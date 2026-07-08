import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const QUESTIONS = [
  {
    text: "A production lot contains 1,200 pcs. If 35 pcs are rejected, how many good pcs remain?",
    options: ["1,000 pcs", "1,165 pcs", "1,200 pcs", "1,500 pcs"],
    correct: "1,165 pcs",
  },
  {
    text: "A machine produces 150 pcs/hour. How many pieces will it produce in 8 hours?",
    options: ["800 pcs", "1,100 pcs", "1,200 pcs", "1,400 pcs"],
    correct: "1,200 pcs",
  },
  {
    text: "A box holds 250 reels. How many boxes are needed for 2,000 reels?",
    options: ["8 boxes", "10 boxes", "12 boxes", "15 boxes"],
    correct: "8 boxes",
  },
  {
    text: "A reel contains 500 meters of tape. Two reels contain how many meters?",
    options: ["500 meters", "1,000 meters", "1,500 meters", "1,600 meters"],
    correct: "1,000 meters",
  },
  {
    text: "If 5 cartons each weigh 18 kg, what is the total weight?",
    options: ["45 kg", "90 kg", "95 kg", "100 kg"],
    correct: "90 kg",
  },
];

const POSITION_OPTIONS = ["Production Operator", "QC Inspector", "Technician"];

export async function GET() {
  const supabase = createServiceClient();
  const { data: settings } = await supabase
    .from("company_settings")
    .select("pretest_sheet_url")
    .limit(1)
    .single();

  if (!settings?.pretest_sheet_url) {
    return NextResponse.json({ configured: false });
  }

  const match = settings.pretest_sheet_url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    return NextResponse.json({ error: "Invalid Google Sheet URL" }, { status: 400 });
  }

  const sheetId = match[1];
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

  let csvText: string;
  try {
    const res = await fetch(csvUrl, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Cannot access sheet. Make sure it is shared as 'Anyone with the link can view'." },
        { status: 400 }
      );
    }
    csvText = await res.text();
  } catch {
    return NextResponse.json({ error: "Failed to fetch Google Sheet." }, { status: 500 });
  }

  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    return NextResponse.json({
      configured: true,
      totalRespondents: 0,
      questionStats: QUESTIONS.map((q) => ({ ...q, counts: {}, total: 0 })),
      positionCounts: {},
      scoreDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 },
    });
  }

  const dataRows = rows.slice(1); // skip header row

  // Per-question answer counts
  const questionStats = QUESTIONS.map((q, idx) => {
    const colIdx = idx + 1; // col 0 = Timestamp
    const counts: Record<string, number> = {};
    for (const opt of q.options) counts[opt] = 0;
    for (const row of dataRows) {
      const ans = row[colIdx]?.trim();
      if (!ans) continue;
      counts[ans] = (counts[ans] ?? 0) + 1;
    }
    return { ...q, counts, total: dataRows.length };
  });

  // Position breakdown (col 6)
  const positionCounts: Record<string, number> = {};
  for (const opt of POSITION_OPTIONS) positionCounts[opt] = 0;
  for (const row of dataRows) {
    const pos = row[6]?.trim();
    if (!pos) continue;
    positionCounts[pos] = (positionCounts[pos] ?? 0) + 1;
  }

  // Score distribution (0–5 correct)
  const scoreDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
  for (const row of dataRows) {
    let correct = 0;
    QUESTIONS.forEach((q, idx) => {
      if (row[idx + 1]?.trim() === q.correct) correct++;
    });
    scoreDistribution[correct] = (scoreDistribution[correct] ?? 0) + 1;
  }

  return NextResponse.json({
    configured: true,
    totalRespondents: dataRows.length,
    questionStats,
    positionCounts,
    scoreDistribution,
    lastUpdated: new Date().toISOString(),
  });
}

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  for (const line of csv.split("\n")) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let inQuotes = false;
    let current = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        row.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    row.push(current);
    rows.push(row);
  }
  return rows;
}
