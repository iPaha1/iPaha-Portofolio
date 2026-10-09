// app/api/tools/cv-analyser/export/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { prismadb } from "@/lib/db";
import { getTemplate } from "@/lib/cv-templates";
import { parseCvToStructured } from "@/lib/cv-templates/parse-cv";

const TOKEN_COST = 30;

// ─── Browser launcher: local Chromium in dev, serverless Chromium in prod ────
async function getBrowser() {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteerCore = (await import("puppeteer-core")).default;
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  // Local dev: use full puppeteer, which manages its own downloaded Chromium
  const puppeteer = (await import("puppeteer")).default;
  return puppeteer.launch({ headless: true });
}

export async function POST(req: NextRequest) {
  try {
    const { cvText, templateId, analysisId, jobTitle, companyName } = await req.json();
    if (!cvText?.trim()) return NextResponse.json({ error: "cvText required" }, { status: 400 });

    const gate = await tokenGate(req, TOKEN_COST, { toolName: "CV PDF Export" });
    if (!gate.ok) return gate.response;

    const template = getTemplate(templateId);
    const data = await parseCvToStructured(cvText);
    const html = template.renderHtml(data);

    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    const nodeBuffer = Buffer.from(pdfBuffer);

    await deductTokens(gate.dbUserId, TOKEN_COST, "cv-analyser/export-pdf", { templateId });

    await prismadb.cvExport.create({
      data: {
        userId: gate.dbUserId, analysisId: analysisId ?? null,
        templateId, format: "PDF", cvContent: cvText.slice(0, 15000),
        jobTitle: jobTitle ?? null, companyName: companyName ?? null,
      },
    });

    return new NextResponse(nodeBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="CV-${template.id}.pdf"`,
        "Content-Length": String(nodeBuffer.length),
      },
    });
  } catch (err: any) {
    console.error("[cv-analyser/export/pdf] error:", err);
    return NextResponse.json({ error: err.message ?? "PDF export failed" }, { status: 500 });
  }
}