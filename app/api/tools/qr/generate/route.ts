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
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

// QR error correction levels: L=7%, M=15%, Q=25%, H=30%
type ErrorLevel = "L" | "M" | "Q" | "H";

const ToolSlug = "qr-generator";
const TOOL_NAME = "QR Code Generator";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[qr/generate] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[qr/generate] Failed to load tool ID:`, err);
}

// We build the QR matrix manually using the qrcode package's internal API
// The matrix is a 2D array of booleans: true = dark module
async function buildMatrix(content: string, level: ErrorLevel): Promise<boolean[][]> {
  // Dynamic import to avoid SSR issues
  const QRCode = await import("qrcode");
  
  // Use the internal segments API to get the matrix
  const qr = await QRCode.create(content, { errorCorrectionLevel: level });
  const size = qr.modules.size;
  const data = qr.modules.data;
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
      if (!url) return "";
      return url.startsWith("http") ? url : `https://${url}`;

    case "email": {
      const email = data.email ?? "";
      if (!email) return "";
      return `mailto:${email}${data.subject ? `?subject=${encodeURIComponent(data.subject)}` : ""}`;
    }

    case "sms": {
      const phone = data.phone ?? "";
      if (!phone) return "";
      return `sms:${phone}${data.message ? `?body=${encodeURIComponent(data.message)}` : ""}`;
    }

    case "phone": {
      const phone = data.phone ?? "";
      if (!phone) return "";
      return `tel:${phone}`;
    }

    case "wifi": {
      const ssid = data.ssid ?? "";
      if (!ssid) return "";
      return `WIFI:T:${data.encryption ?? "WPA"};S:${ssid};P:${data.password ?? ""};;`;
    }

    case "vcard": {
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        data.name ? `FN:${data.name}` : null,
        data.org ? `ORG:${data.org}` : null,
        data.title ? `TITLE:${data.title}` : null,
        data.phone ? `TEL:${data.phone}` : null,
        data.email ? `EMAIL:${data.email}` : null,
        data.website ? `URL:${data.website}` : null,
        data.address ? `ADR:;;${data.address};;;;` : null,
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
  const start = Date.now();
  
  try {
    const { content, type = "url", data = {}, errorCorrection = "M" } = await req.json();

    // Validate input
    const rawContent = content ?? formatContent(type, data);
    if (!rawContent?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (rawContent.length > 2000) {
      return NextResponse.json(
        { error: "Content too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    // Validate error correction level
    const validLevels: ErrorLevel[] = ["L", "M", "Q", "H"];
    const level = validLevels.includes(errorCorrection as ErrorLevel) 
      ? errorCorrection as ErrorLevel 
      : "M";

    // Generate QR matrix
    const matrix = await buildMatrix(rawContent.trim(), level);
    const size = matrix.length;

    console.log(`[qr/generate] Generated QR code: size=${size}, type=${type}, length=${rawContent.length}`);

    // Track usage (no token cost for QR generation - it's free)
    try {
      const { userId: clerkId } = await req.json(); // Need auth for tracking
      // Note: You might want to add auth to track user usage
      // For now, track with null userId
      await trackToolUsage({
        toolId: TOOL_ID,
        toolName: TOOL_NAME,
        userId: null, // No auth required for QR generation
        ipAddress: getIpFromRequest(req),
        processingMs: Date.now() - start,
        tokenCost: 0, // Free tool
        wasSuccess: true,
      });
    } catch (trackError) {
      console.error("[qr/generate] Failed to track usage:", trackError);
    }

    return NextResponse.json({
      ok: true,
      matrix,
      size,
      content: rawContent.trim(),
      type,
      errorCorrection: level,
      metadata: {
        processingTimeMs: Date.now() - start,
        matrixSize: size,
      }
    });
  } catch (err: any) {
    console.error("[qr/generate] Error:", err);
    
    // Track failed usage
    try {
      await trackToolUsage({
        toolId: TOOL_ID,
        toolName: TOOL_NAME,
        userId: null,
        ipAddress: getIpFromRequest(req),
        processingMs: Date.now() - start,
        wasSuccess: false,
        errorMsg: err.message || "Unknown error",
      });
    } catch (trackError) {
      console.error("[qr/generate] Failed to track error:", trackError);
    }
    
    return NextResponse.json(
      { error: err.message ?? "QR generation failed" },
      { status: 500 }
    );
  }
}







// // =============================================================================
// // isaacpaha.com — QR Code Generator: Generate API
// // app/api/tools/qr/generate/route.ts
// //
// // POST { content, type, errorCorrection }
// // Returns a QR matrix (2D boolean array) + metadata
// // Client uses this matrix to render a fully customised SVG
// //
// // Using the `qrcode` package — pure JS, no canvas needed on server
// // Install: npm install qrcode && npm install --save-dev @types/qrcode
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";

// // QR error correction levels: L=7%, M=15%, Q=25%, H=30%
// // We use H when a logo is embedded (logo covers ~15% of code)
// type ErrorLevel = "L" | "M" | "Q" | "H";

// // We build the QR matrix manually using the qrcode package's internal API
// // The matrix is a 2D array of booleans: true = dark module
// async function buildMatrix(content: string, level: ErrorLevel): Promise<boolean[][]> {
//   // Dynamic import to avoid SSR issues
//   const QRCode = await import("qrcode");
  
//   // Use the internal segments API to get the matrix
//   const qr = await QRCode.create(content, { errorCorrectionLevel: level });
//   const size  = qr.modules.size;
//   const data  = qr.modules.data;
//   const matrix: boolean[][] = [];
  
//   for (let row = 0; row < size; row++) {
//     const rowArr: boolean[] = [];
//     for (let col = 0; col < size; col++) {
//       rowArr.push(!!data[row * size + col]);
//     }
//     matrix.push(rowArr);
//   }
  
//   return matrix;
// }

// // ─── Content formatters by type ───────────────────────────────────────────────

// function formatContent(type: string, data: Record<string, string>): string {
//   switch (type) {
//     case "url":
//     case "portfolio":
//     case "linkedin":
//     case "payment":
//     case "instagram":
//     case "twitter":
//       // Ensure https://
//       const url = data.url ?? "";
//       return url.startsWith("http") ? url : `https://${url}`;

//     case "email":
//       return `mailto:${data.email}${data.subject ? `?subject=${encodeURIComponent(data.subject)}` : ""}`;

//     case "sms":
//       return `sms:${data.phone}${data.message ? `?body=${encodeURIComponent(data.message)}` : ""}`;

//     case "phone":
//       return `tel:${data.phone}`;

//     case "wifi":
//       // WPA format
//       return `WIFI:T:${data.encryption ?? "WPA"};S:${data.ssid};P:${data.password};;`;

//     case "vcard": {
//       const lines = [
//         "BEGIN:VCARD",
//         "VERSION:3.0",
//         data.name     ? `FN:${data.name}`                      : null,
//         data.org      ? `ORG:${data.org}`                      : null,
//         data.title    ? `TITLE:${data.title}`                  : null,
//         data.phone    ? `TEL:${data.phone}`                    : null,
//         data.email    ? `EMAIL:${data.email}`                  : null,
//         data.website  ? `URL:${data.website}`                  : null,
//         data.address  ? `ADR:;;${data.address};;;;`            : null,
//         data.linkedin ? `X-SOCIALPROFILE;type=linkedin:${data.linkedin}` : null,
//         "END:VCARD",
//       ].filter(Boolean);
//       return lines.join("\n");
//     }

//     case "text":
//     default:
//       return data.text ?? data.url ?? "";
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { content, type = "url", data = {}, errorCorrection = "M" } = await req.json();

//     const rawContent = content ?? formatContent(type, data);
//     if (!rawContent?.trim()) {
//       return NextResponse.json({ error: "Content is required" }, { status: 400 });
//     }

//     if (rawContent.length > 2000) {
//       return NextResponse.json({ error: "Content too long (max 2000 chars)" }, { status: 400 });
//     }

//     const matrix = await buildMatrix(rawContent.trim(), errorCorrection as ErrorLevel);
//     const size   = matrix.length;

//     return NextResponse.json({
//       ok:     true,
//       matrix,
//       size,
//       content: rawContent.trim(),
//       type,
//     });
//   } catch (err: any) {
//     console.error("[qr/generate]", err);
//     return NextResponse.json({ error: err.message ?? "QR generation failed" }, { status: 500 });
//   }
// }