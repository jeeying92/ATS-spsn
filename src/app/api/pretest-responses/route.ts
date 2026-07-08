import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

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
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  let csvText: string;
  try {
    const res = await fetch(csvUrl, { cache: "no-store" });
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
  if (rows.length < 1) {
    return NextResponse.json({ error: "Sheet is empty." }, { status: 400 });
  }

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim() !== ""));

  // Locate special columns
  const scoreCol = headers.findIndex((h) => /^score$/i.test(h));
  const nameCol = headers.findIndex((h) => /^name/i.test(h));
  const positionCol = headers.findIndex((h) => /position applied/i.test(h));
  const timestampCol = headers.findIndex((h) => /^timestamp$/i.test(h));

  // Question columns = everything else with a non-empty header
  const questionCols = headers
    .map((h, i) => ({ header: h, index: i }))
    .filter(
      ({ header, index }) =>
        header !== "" &&
        index !== scoreCol &&
        index !== nameCol &&
        index !== positionCol &&
        index !== timestampCol
    );

  // Respondents with parsed scores
  const respondents = dataRows.map((row) => {
    const rawScore = scoreCol >= 0 ? row[scoreCol]?.trim() ?? "" : "";
    let percent: number | null = null;
    const m = rawScore.match(/^([\d.]+)\s*\/\s*([\d.]+)$/);
    if (m && Number(m[2]) > 0) {
      percent = Math.round((Number(m[1]) / Number(m[2])) * 100);
    }
    return {
      name: nameCol >= 0 ? row[nameCol]?.trim() || "(no name)" : "(no name)",
      position: positionCol >= 0 ? row[positionCol]?.trim() || "-" : "-",
      score: rawScore || "-",
      percent,
      timestamp: timestampCol >= 0 ? row[timestampCol]?.trim() ?? "" : "",
    };
  });

  const scored = respondents.filter((r) => r.percent !== null) as (typeof respondents[number] & { percent: number })[];
  const avgPercent = scored.length > 0
    ? Math.round(scored.reduce((s, r) => s + r.percent, 0) / scored.length)
    : 0;

  // Per-question answer distribution (skip blanks — sections not shown to that respondent)
  const questionStats = questionCols.map(({ header, index }) => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of dataRows) {
      const ans = row[index]?.trim();
      if (!ans) continue;
      counts[ans] = (counts[ans] ?? 0) + 1;
      total++;
    }
    return { text: header, counts, total };
  }).filter((q) => q.total > 0);

  // Position breakdown
  const positionCounts: Record<string, number> = {};
  for (const r of respondents) {
    if (r.position === "-") continue;
    positionCounts[r.position] = (positionCounts[r.position] ?? 0) + 1;
  }

  return NextResponse.json({
    configured: true,
    totalRespondents: dataRows.length,
    totalQuestions: questionCols.length,
    avgPercent,
    pass: scored.filter((r) => r.percent >= 70).length,
    borderline: scored.filter((r) => r.percent >= 50 && r.percent < 70).length,
    fail: scored.filter((r) => r.percent < 50).length,
    respondents: respondents.sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1)),
    questionStats,
    positionCounts,
    lastUpdated: new Date().toISOString(),
  });
}

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (inQuotes && csv[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && csv[i + 1] === "\n") i++;
      row.push(current);
      current = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else {
      current += ch;
    }
  }
  if (current !== "" || row.length > 0) {
    row.push(current);
    if (row.some((c) => c !== "")) rows.push(row);
  }
  return rows;
}
