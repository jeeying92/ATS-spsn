import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "your_anthropic_api_key") {
    return NextResponse.json(
      { error: "Anthropic API key not configured. Add ANTHROPIC_API_KEY to environment variables." },
      { status: 500 }
    );
  }

  const supabase = createServiceClient();

  // Get candidate with applications and job details
  const { data: candidate } = await supabase
    .from("candidates")
    .select("*, applications(*, job:jobs(*))")
    .eq("id", id)
    .single();

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  // Get resume content
  let resumeContent = "";
  let resumeBase64: string | null = null;
  let resumeMediaType: string | null = null;

  if (candidate.resume_url) {
    try {
      const res = await fetch(candidate.resume_url);
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("pdf")) {
          const buffer = await res.arrayBuffer();
          resumeBase64 = Buffer.from(buffer).toString("base64");
          resumeMediaType = "application/pdf";
        } else {
          resumeContent = await res.text();
        }
      }
    } catch {
      resumeContent = "[Resume could not be fetched]";
    }
  }

  // Build job context
  const jobDescriptions = (candidate.applications || [])
    .map((app: { job: { title: string; description: string; requirements: string } | null }) => {
      if (!app.job) return "";
      return `Position: ${app.job.title}\nDescription: ${app.job.description}\nRequirements: ${app.job.requirements}`;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");

  const systemPrompt = `You are an expert HR recruiter at Semipack Malaysia Sdn Bhd, a semiconductor packaging company in Nilai, Negeri Sembilan, Malaysia. Your task is to evaluate a candidate's resume and score them on 5 criteria.

Score each criterion from 1 to 5:
1 = Poor/Not qualified
2 = Below average
3 = Average/Meets minimum
4 = Good/Above average
5 = Excellent/Exceptional

You MUST respond with ONLY a valid JSON object in this exact format, no other text:
{
  "experience": <1-5>,
  "education": <1-5>,
  "skills": <1-5>,
  "communication": <1-5>,
  "culture_fit": <1-5>,
  "notes": "<2-3 sentence summary of strengths and areas of concern>"
}

Scoring criteria:
- **Experience**: Years and relevance of work experience to the applied position
- **Education**: Degree level and relevance of field of study
- **Skills**: Technical skills match with job requirements (semiconductor, manufacturing, quality, etc.)
- **Communication**: Resume clarity, organization, grammar, and presentation
- **Culture Fit**: Alignment with manufacturing/semiconductor industry, Malaysia work context, team orientation`;

  const userMessage = `Evaluate this candidate for Semipack Malaysia:

Candidate: ${candidate.name}
Email: ${candidate.email}
Source: ${candidate.source}

${jobDescriptions ? `APPLIED FOR:\n${jobDescriptions}\n\n` : ""}${resumeContent ? `RESUME TEXT:\n${resumeContent}` : !resumeBase64 ? "NOTE: No resume uploaded. Score based on available information only. Be conservative with scores." : "Resume attached as PDF."}`;

  try {
    const client = new Anthropic({ apiKey });

    const contentBlocks: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    if (resumeBase64 && resumeMediaType) {
      contentBlocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: resumeMediaType as "application/pdf",
          data: resumeBase64,
        },
      });
    }

    contentBlocks.push({ type: "text", text: userMessage });

    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Extract JSON from response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
    }

    const scores = JSON.parse(jsonMatch[0]);

    // Validate scores
    const criteria = ["experience", "education", "skills", "communication", "culture_fit"];
    for (const key of criteria) {
      if (typeof scores[key] !== "number" || scores[key] < 1 || scores[key] > 5) {
        scores[key] = 3;
      }
      scores[key] = Math.round(scores[key]);
    }

    // Upsert score in database
    const scoreData = {
      candidate_id: id,
      experience: scores.experience,
      education: scores.education,
      skills: scores.skills,
      communication: scores.communication,
      culture_fit: scores.culture_fit,
      notes: scores.notes || "",
      scored_by: "AI (Claude)",
    };

    const { data: existing } = await supabase
      .from("candidate_scores")
      .select("id")
      .eq("candidate_id", id)
      .single();

    if (existing) {
      await supabase.from("candidate_scores").update(scoreData).eq("candidate_id", id);
    } else {
      await supabase.from("candidate_scores").insert(scoreData);
    }

    return NextResponse.json({
      ...scores,
      overall_score: (scores.experience + scores.education + scores.skills + scores.communication + scores.culture_fit) / 5,
      scored_by: "AI (Claude)",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI scoring failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
