import { NextResponse } from "next/server";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { createElement } from "react";
import { fetchLatexSource } from "@/lib/fetchResume";
import { parseLatexResume } from "@/hooks/parseResume";
import ResumePDFPages from "@/components/ResumePDF";

export const dynamic = "force-dynamic";

export async function GET() {
  const latexSource = await fetchLatexSource();
  const resume = parseLatexResume(latexSource);

  // Wrap the pages in a Document element that renderToBuffer expects
  const doc = createElement(
    Document,
    {
      title: `${resume.contact.name} — Resume`,
      author: resume.contact.name,
      subject: "Resume",
    },
    createElement(ResumePDFPages, { resume }),
  );

  const nodeBuffer = await renderToBuffer(doc);
  // Copy into a plain ArrayBuffer — Buffer.buffer is typed as ArrayBufferLike
  // which Blob constructor doesn't accept, but ArrayBuffer is fine.
  const arrayBuffer = new ArrayBuffer(nodeBuffer.byteLength);
  new Uint8Array(arrayBuffer).set(nodeBuffer);
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const safeName = resume.contact.name.replaceAll(/[^a-zA-Z0-9_-]/g, "_");

  return new NextResponse(blob, {
    headers: {
      "Content-Disposition": `attachment; filename="${safeName}_Resume.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
