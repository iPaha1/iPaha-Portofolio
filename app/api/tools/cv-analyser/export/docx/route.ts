// app/api/tools/cv-analyser/export/docx/route.ts
import { NextRequest, NextResponse } from "next/server";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { prismadb } from "@/lib/db";
import { parseCvToStructured } from "@/lib/cv-templates/parse-cv";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
} from "docx";

const TOKEN_COST = 30;

export async function POST(req: NextRequest) {
  try {
    const { cvText, templateId, analysisId, jobTitle, companyName } = await req.json();
    if (!cvText?.trim()) return NextResponse.json({ error: "cvText required" }, { status: 400 });

    const gate = await tokenGate(req, TOKEN_COST, { toolName: "CV Word Export" });
    if (!gate.ok) return gate.response;

    const data = await parseCvToStructured(cvText);

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: data.fullName, heading: HeadingLevel.TITLE }),
          ...(data.title ? [new Paragraph({ text: data.title })] : []),
          new Paragraph({
            children: [new TextRun({
              text: [data.email, data.phone, data.location, data.linkedin].filter(Boolean).join(" · "),
              size: 18, color: "666666",
            })],
          }),
          ...(data.summary ? [
            new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: data.summary }),
          ] : []),
          new Paragraph({ text: "Experience", heading: HeadingLevel.HEADING_2 }),
          ...data.experience.flatMap((e) => [
            new Paragraph({
              children: [
                new TextRun({ text: `${e.role}, ${e.company}`, bold: true }),
                new TextRun({ text: `   ${e.dates}`, italics: true }),
              ],
            }),
            ...e.bullets.map((b) => new Paragraph({ text: b, bullet: { level: 0 } })),
          ]),
          new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2 }),
          ...data.education.map((ed) =>
            new Paragraph({ text: `${ed.degree}, ${ed.institution} — ${ed.dates}` })),
          ...(data.skills.length ? [
            new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: data.skills.join(" · ") }),
          ] : []),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const docxBytes = new Uint8Array(buffer);

    await deductTokens(gate.dbUserId, TOKEN_COST, "cv-analyser/export-docx", { templateId });
    await prismadb.cvExport.create({
      data: {
        userId: gate.dbUserId, analysisId: analysisId ?? null,
        templateId, format: "DOCX", cvContent: cvText.slice(0, 15000),
        jobTitle: jobTitle ?? null, companyName: companyName ?? null,
      },
    });

    return new NextResponse(docxBytes, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="CV.docx"`,
      },
    });
  } catch (err: any) {
    console.error("[cv-analyser/export/docx] error:", err);
    return NextResponse.json({ error: err.message ?? "Word export failed" }, { status: 500 });
  }
}