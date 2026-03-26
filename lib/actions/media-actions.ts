"use server";

// =============================================================================
// isaacpaha.com — Media Library Server Actions
// lib/actions/media.actions.ts
// =============================================================================

import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import { MediaType } from "../generated/prisma/enums";
import { prismadb } from "../db";


// ─── Cloudinary ───────────────────────────────────────────────────────────────

function setupCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// ─── STATS ───────────────────────────────────────────────────────────────────

export async function getMediaStats() {
  const [total, byType, totalSizeAgg, last30d, trashCount] = await Promise.all([
    prismadb.mediaFile?.count({ where: { isDeleted: false } }),
    prismadb.mediaFile?.groupBy({
      by:      ["type"],
      where:   { isDeleted: false },
      _count:  { _all: true },
      _sum:    { size: true },
    }),
    prismadb.mediaFile?.aggregate({
      where: { isDeleted: false },
      _sum:  { size: true },
    }),
    prismadb.mediaFile?.count({
      where: {
        isDeleted: false,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prismadb.mediaFile?.count({ where: { isDeleted: true } }),
  ]);

  return {
    total,
    totalSize:  totalSizeAgg?._sum.size ?? 0,
    last30d,
    trashCount,
    byType: byType?.map((b) => ({
      type:  b.type,
      count: b._count._all,
      size:  b._sum.size ?? 0,
    })),
  };
}

// ─── FOLDERS ─────────────────────────────────────────────────────────────────

export async function getFolders() {
  return prismadb.mediaFolder?.findMany({
    where:   { parentId: null },     // top-level only
    orderBy: { name: "asc" },
    include: {
      _count:   { select: { files: true } },
      children: {
        include: { _count: { select: { files: true } } },
        orderBy: { name: "asc" },
      },
    },
  });
}

export async function createFolder(data: {
  name:         string;
  slug:         string;
  description?: string;
  color?:       string;
  icon?:        string;
  parentId?:    string;
}) {
  const folder = await prismadb.mediaFolder.create({ data });
  revalidatePath("/admin/[userId]/media-library", "page");
  return folder;
}

export async function updateFolder(id: string, data: { name?: string; color?: string; description?: string }) {
  const folder = await prismadb.mediaFolder.update({ where: { id }, data });
  revalidatePath("/admin/[userId]/media-library", "page");
  return folder;
}

export async function deleteFolder(id: string) {
  // Move files to root before deleting
  await prismadb.mediaFile.updateMany({
    where: { folderId: id },
    data:  { folderId: null },
  });
  await prismadb.mediaFolder.delete({ where: { id } });
  revalidatePath("/admin/[userId]/media-library", "page");
}

// ─── FILES — LIST ─────────────────────────────────────────────────────────────

export async function getMediaFiles({
  page      = 1,
  pageSize  = 40,
  type,
  folderId,
  search,
  sortBy    = "createdAt",
  sortOrder = "desc",
}: {
  page?:      number;
  pageSize?:  number;
  type?:      MediaType;
  folderId?:  string | "unfiled";
  search?:    string;
  sortBy?:    "createdAt" | "filename" | "size";
  sortOrder?: "asc" | "desc";
} = {}) {
  const where = {
    isDeleted: false,
    ...(type !== undefined && { type }),
    ...(folderId === "unfiled"
      ? { folderId: null }
      : folderId !== undefined
      ? { folderId }
      : {}),
    ...(search && {
      OR: [
        { filename:     { contains: search } },
        { originalName: { contains: search } },
        { alt:          { contains: search } },
        { caption:      { contains: search } },
        { description:  { contains: search } },
        { tags:         { contains: search } },
      ],
    }),
  };

  const [files, total] = await Promise.all([
    prismadb.mediaFile?.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: {
        folder: { select: { id: true, name: true, color: true, slug: true } },
        _count: { select: { usedIn: true } },
      },
    }),
    prismadb.mediaFile?.count({ where }),
  ]);

  return { files, total, pages: Math.ceil(total / pageSize) };
}

// ─── FILES — SINGLE ───────────────────────────────────────────────────────────

export async function getMediaFileById(id: string) {
  return prismadb.mediaFile.findUnique({
    where:   { id, isDeleted: false },
    include: {
      folder: true,
      usedIn: {
        orderBy: { createdAt: "desc" },
        take:    20,
      },
    },
  });
}

// ─── FILES — UPDATE METADATA ──────────────────────────────────────────────────

export async function updateMediaFile(
  id: string,
  data: {
    alt?:         string;
    caption?:     string;
    description?: string;
    tags?:        string[];
    folderId?:    string | null;
    filename?:    string;
  }
) {
  const updated = await prismadb.mediaFile.update({
    where: { id },
    data: {
      alt:         data.alt,
      caption:     data.caption,
      description: data.description,
      filename:    data.filename,
      folderId:    data.folderId,
      tags:        data.tags !== undefined ? JSON.stringify(data.tags) : undefined,
    },
  });
  revalidatePath("/admin/[userId]/media-library", "page");
  return updated;
}

// ─── FILES — MOVE ────────────────────────────────────────────────────────────

export async function moveFiles(ids: string[], folderId: string | null) {
  await prismadb.mediaFile.updateMany({
    where: { id: { in: ids } },
    data:  { folderId },
  });
  revalidatePath("/admin/[userId]/media-library", "page");
}

// ─── FILES — SOFT DELETE (trash) ─────────────────────────────────────────────

export async function trashFiles(ids: string[]) {
  await prismadb.mediaFile.updateMany({
    where: { id: { in: ids } },
    data:  { isDeleted: true, deletedAt: new Date() },
  });
  revalidatePath("/admin/[userId]/media-library", "page");
}

// ─── FILES — RESTORE FROM TRASH ──────────────────────────────────────────────

export async function restoreFiles(ids: string[]) {
  await prismadb.mediaFile.updateMany({
    where: { id: { in: ids } },
    data:  { isDeleted: false, deletedAt: null },
  });
  revalidatePath("/admin/[userId]/media-library", "page");
}

// ─── FILES — PERMANENT DELETE (removes from Cloudinary too) ─────────────────

export async function permanentlyDeleteFiles(ids: string[]) {
  const files = await prismadb.mediaFile.findMany({
    where:  { id: { in: ids } },
    select: { id: true, cloudinaryId: true, type: true },
  });

  setupCloudinary();
  await Promise.allSettled(
    files
      .filter((f) => f.cloudinaryId)
      .map((f) => {
        const resourceType =
          f.type === "IMAGE"    ? "image" :
          f.type === "VIDEO"    ? "video" :
          f.type === "AUDIO"    ? "video" :   // Cloudinary uses "video" for audio
          "raw";
        return cloudinary.uploader.destroy(f.cloudinaryId!, { resource_type: resourceType as MediaType });
      })
  );

  await prismadb.mediaFile.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/[userId]/media-library", "page");
}

// ─── TRASH — LIST ────────────────────────────────────────────────────────────

export async function getTrashFiles({ page = 1, pageSize = 40 } = {}) {
  const [files, total] = await Promise.all([
    prismadb.mediaFile.findMany({
      where:   { isDeleted: true },
      orderBy: { deletedAt: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    }),
    prismadb.mediaFile.count({ where: { isDeleted: true } }),
  ]);
  return { files, total, pages: Math.ceil(total / pageSize) };
}

// ─── TRASH — EMPTY ALL ───────────────────────────────────────────────────────

export async function emptyTrash() {
  const files = await prismadb.mediaFile.findMany({
    where:  { isDeleted: true },
    select: { id: true, cloudinaryId: true, type: true },
  });

  setupCloudinary();
  await Promise.allSettled(
    files
      .filter((f) => f.cloudinaryId)
      .map((f) => {
        const resourceType =
          f.type === "IMAGE" ? "image" :
          f.type === "VIDEO" ? "video" :
          f.type === "AUDIO" ? "video" :
          "raw";
        return cloudinary.uploader.destroy(f.cloudinaryId!, { resource_type: resourceType as MediaType });
      })
  );

  await prismadb.mediaFile.deleteMany({ where: { isDeleted: true } });
  revalidatePath("/admin/[userId]/media-library", "page");
}

// ─── USAGE TRACKING ──────────────────────────────────────────────────────────

export async function trackMediaUsage(data: {
  fileId:     string;
  sourceType: string;
  sourceId:   string;
  field?:     string;
}) {
  return prismadb.mediaUsage.upsert({
    where: {
      fileId_sourceType_sourceId_field: {
        fileId:     data.fileId,
        sourceType: data.sourceType,
        sourceId:   data.sourceId,
        field:      data.field ?? "",
      },
    },
    create: { ...data, field: data.field ?? "" },
    update: {},
  });
}