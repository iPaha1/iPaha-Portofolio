// =============================================================================
// isaacpaha.com — QR Code Generator: Generate API
// app/api/tools/qr/generate/route.ts
//
// POST { content, type, errorCorrection }
// Returns a QR matrix (2D boolean array) + metadata
// Client uses this matrix to render a fully customised SVG
//
// Using the `qrcode` package — pure JS, no canvas needed on server
// Install: npm install qrcode && npm install --save-dev @types/qrcode
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

// QR error correction levels: L=7%, M=15%, Q=25%, H=30%
// We use H when a logo is embedded (logo covers ~15% of code)
type ErrorLevel = "L" | "M" | "Q" | "H";

// We build the QR matrix manually using the qrcode package's internal API
// The matrix is a 2D array of booleans: true = dark module
async function buildMatrix(content: string, level: ErrorLevel): Promise<boolean[][]> {
  // Dynamic import to avoid SSR issues
  const QRCode = await import("qrcode");
  
  // Use the internal segments API to get the matrix
  const qr = await QRCode.create(content, { errorCorrectionLevel: level });
  const size  = qr.modules.size;
  const data  = qr.modules.data;
  const matrix: boolean[][] = [];
  
  for (let row = 0; row < size; row++) {
    const rowArr: boolean[] = [];
    for (let col = 0; col < size; col++) {
      rowArr.push(!!data[row * size + col]);
    }
    matrix.push(rowArr);
  }
  
  return matrix;
}

// ─── Content formatters by type ───────────────────────────────────────────────

function formatContent(type: string, data: Record<string, string>): string {
  switch (type) {
    case "url":
    case "portfolio":
    case "linkedin":
    case "payment":
    case "instagram":
    case "twitter":
      // Ensure https://
      const url = data.url ?? "";
      return url.startsWith("http") ? url : `https://${url}`;

    case "email":
      return `mailto:${data.email}${data.subject ? `?subject=${encodeURIComponent(data.subject)}` : ""}`;

    case "sms":
      return `sms:${data.phone}${data.message ? `?body=${encodeURIComponent(data.message)}` : ""}`;

    case "phone":
      return `tel:${data.phone}`;

    case "wifi":
      // WPA format
      return `WIFI:T:${data.encryption ?? "WPA"};S:${data.ssid};P:${data.password};;`;

    case "vcard": {
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        data.name     ? `FN:${data.name}`                      : null,
        data.org      ? `ORG:${data.org}`                      : null,
        data.title    ? `TITLE:${data.title}`                  : null,
        data.phone    ? `TEL:${data.phone}`                    : null,
        data.email    ? `EMAIL:${data.email}`                  : null,
        data.website  ? `URL:${data.website}`                  : null,
        data.address  ? `ADR:;;${data.address};;;;`            : null,
        data.linkedin ? `X-SOCIALPROFILE;type=linkedin:${data.linkedin}` : null,
        "END:VCARD",
      ].filter(Boolean);
      return lines.join("\n");
    }

    case "text":
    default:
      return data.text ?? data.url ?? "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content, type = "url", data = {}, errorCorrection = "M" } = await req.json();

    const rawContent = content ?? formatContent(type, data);
    if (!rawContent?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (rawContent.length > 2000) {
      return NextResponse.json({ error: "Content too long (max 2000 chars)" }, { status: 400 });
    }

    const matrix = await buildMatrix(rawContent.trim(), errorCorrection as ErrorLevel);
    const size   = matrix.length;

    return NextResponse.json({
      ok:     true,
      matrix,
      size,
      content: rawContent.trim(),
      type,
    });
  } catch (err: any) {
    console.error("[qr/generate]", err);
    return NextResponse.json({ error: err.message ?? "QR generation failed" }, { status: 500 });
  }
}