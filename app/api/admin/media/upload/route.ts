// =============================================================================
// isaacpaha.com — Media Upload API
// app/api/admin/media/upload/route.ts
//
// POST  multipart/form-data
//   Fields: file (required), alt, caption, description, folderId, tags (CSV)
// Returns: { ok: true, file: MediaFile }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { v2 as cloudinary }          from "cloudinary";
import { prismadb } from "@/lib/db";
import { MediaType } from "@/lib/generated/prisma/enums";

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes?: number;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

function detectType(mime: string, name: string): MediaType {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("audio/")) return "AUDIO";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg","jpeg","png","gif","webp","svg","avif","heic"].includes(ext)) return "IMAGE";
  if (["mp4","webm","mov","avi","mkv","m4v"].includes(ext))                return "VIDEO";
  if (["mp3","wav","ogg","m4a","flac","aac"].includes(ext))                return "AUDIO";
  return "DOCUMENT";
}

function toSlug(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file        = formData.get("file")        as File | null;
  const alt         = (formData.get("alt")         as string) || null;
  const caption     = (formData.get("caption")     as string) || null;
  const description = (formData.get("description") as string) || null;
  const folderId    = (formData.get("folderId")    as string) || null;
  const tagsRaw     = (formData.get("tags")        as string) || "";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const maxBytes = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 50) * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: `File exceeds ${maxBytes / 1024 / 1024} MB limit` }, { status: 413 });
  }

  const mediaType   = detectType(file.type, file.name);
  const slug        = toSlug(file.name);
  const tags        = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
  const cloudFolder = `isaacpaha/${mediaType.toLowerCase()}`;

  const resourceType: "image" | "video" | "raw" =
    mediaType === "IMAGE"    ? "image" :
    mediaType === "VIDEO"    ? "video" :
    mediaType === "AUDIO"    ? "video" :   // Cloudinary uses video resource_type for audio
    "raw";

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const b64    = `data:${file.type};base64,${buffer.toString("base64")}`;
    const pubId  = `${slug}-${Date.now()}`;

    const upload = await cloudinary.uploader.upload(b64, {
      folder:        cloudFolder,
      public_id:     pubId,
      resource_type: resourceType,
      overwrite:     false,
      tags,
      context: {
        alt:     alt     ?? file.name,
        caption: caption ?? "",
      },
    }) as CloudinaryUploadResponse;

    // Verify DB folder exists if folderId provided
    if (folderId) {
      const folderExists = await prismadb.mediaFolder.findUnique({ where: { id: folderId } });
      if (!folderExists) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
      }
    }

    const record = await prismadb.mediaFile.create({
      data: {
        filename:     pubId,
        originalName: file.name,
        url:          upload.secure_url,
        cloudinaryId: upload.public_id,
        thumbnailUrl: mediaType === "VIDEO"
          ? upload.secure_url.replace(/\.[^.]+$/, ".jpg")
          : null,
        type:         mediaType,
        mimeType:     file.type,
        size:         upload.bytes ?? file.size,
        width:        upload.width   ?? null,
        height:       upload.height  ?? null,
        duration:     upload.duration ?? null,
        alt:          alt         ?? null,
        caption:      caption     ?? null,
        description:  description ?? null,
        tags:         tags.length  ? JSON.stringify(tags) : null,
        folderId:     folderId    ?? null,
      },
    });

    return NextResponse.json({ ok: true, file: record }, { status: 201 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[media/upload]", error);
    return NextResponse.json({ error: error.message ?? "Upload failed" }, { status: 500 });
  }
}