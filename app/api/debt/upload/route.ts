// app/api/debt/upload/route.ts
// Evidence upload for debt entries & repayments.
// Mirrors your existing /api/admin/media/upload logic
// but guards by email instead of admin role.

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary }          from "cloudinary";
import { requireDebtAccess }         from "@/lib/debt/auth";

interface CloudinaryUploadResult {
  secure_url: string;
  public_id:  string;
  bytes?:     number;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const { email, error } = await requireDebtAccess();
  if (error) return error;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file  = formData.get("file") as File | null;
  const label = (formData.get("label") as string) || "evidence";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const maxBytes = 20 * 1024 * 1024; // 20 MB cap for evidence files
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "File exceeds 20 MB limit" }, { status: 413 });
  }

  try {
    const buffer  = Buffer.from(await file.arrayBuffer());
    const b64     = `data:${file.type};base64,${buffer.toString("base64")}`;
    const pubId   = `debt-evidence-${Date.now()}`;

    const result = await cloudinary.uploader.upload(b64, {
      folder:        "isaacpaha/debt-evidence",
      public_id:     pubId,
      resource_type: "auto",
      overwrite:     false,
      context: {
        uploaded_by: email,
        label,
      },
    }) as CloudinaryUploadResult;

    return NextResponse.json(
      { ok: true, url: result.secure_url, publicId: result.public_id },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[debt/upload]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}