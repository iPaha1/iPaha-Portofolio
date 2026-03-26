// =============================================================================
// isaacpaha.com — Admin Media Library Page (Server Component)
// app/admin/[userId]/media-library/page.tsx
// =============================================================================

import {
  getMediaStats,
  getMediaFiles,
  getFolders,
} from"@/lib/actions/media-actions";
import type { Metadata }           from "next";
import { MediaLibraryClient } from "./_media/media-client";
import { MediaType } from "@/lib/generated/prisma/enums";



export const metadata: Metadata = {
  title: "Media Library | Admin",
  robots: { index: false, follow: false },
};


type Folder = {
  id:          string;
  name:        string;
  slug:        string;
  color:       string;
  description: string | null;
  parentId:    string | null;
  createdAt:   Date;
  updatedAt:   Date;
  icon:        string;
  _count:      { files: number };
  children:    Folder[];
};

interface Props {
  params:       Promise<{ userId: string }>;
  searchParams: Promise<{
    view?:      string;   // "grid" | "list"
    type?:      string;
    folder?:    string;
    search?:    string;
    page?:      string;
    sort?:      string; 
  }>;
}

export default async function MediaLibraryPage({ params, searchParams }: Props) {
    const { userId } = await params;
    const { view, type, folder, search, page, sort } = await searchParams;

//   const page     = Number(page ?? 1);
  const folderId = folder === "unfiled"
    ? "unfiled"
    : folder ?? undefined;

  const [stats, filesData, folders] = await Promise.all([
    getMediaStats(),
    getMediaFiles({
      page:     Number(page ?? 1),
      pageSize:  40,
      type:      type as MediaType || undefined,
      folderId,
      search:    search,
      sortBy:    ((sortField) => sortField === "name" ? "filename" : sortField)(sort?.split("_")[0] as "createdAt" | "name" | "size") ?? "createdAt",
      sortOrder: (sort?.split("_")[1] as "asc" | "desc") ?? "desc",
    }),
    getFolders(),
  ]);

  const transformedFolders = folders.map(folder => ({
    ...folder,
    children: folder.children || [],
  }));

  return (
    <MediaLibraryClient
      userId={userId}
      stats={stats}
      initialFiles={filesData.files}
      fileTotal={filesData.total}
      filePages={filesData.pages}
      folders={transformedFolders as Folder[]} 
      initialView={(view as "grid" | "list") ?? "grid"}
      initialType={type}
      initialFolder={folder}
      initialSearch={search}
      currentPage={Number(page ?? 1)}
    />
  );
}