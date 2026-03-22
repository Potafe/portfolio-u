import { NextResponse } from "next/server";
import { parseLatexResume } from "@/hooks/parseResume";
import { fetchLatexSource } from "@/lib/fetchResume";

export async function GET() {
  const latexSource = await fetchLatexSource();
  const resume = parseLatexResume(latexSource);
  return NextResponse.json(resume);
}
