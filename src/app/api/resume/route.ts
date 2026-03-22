import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseLatexResume } from "@/hooks/parseResume";

export function GET() {
  const filePath = join(process.cwd(), "src", "data", "resume.sty");
  const latexSource = readFileSync(filePath, "utf8");
  const resume = parseLatexResume(latexSource);
  return NextResponse.json(resume);
}
