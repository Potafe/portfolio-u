import { NextResponse } from "next/server";
import { fetchLatexSource } from "@/lib/fetchResume";

export async function GET() {
  const latexSource = await fetchLatexSource();
  return new NextResponse(latexSource, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="resume.sty"',
    },
  });
}
