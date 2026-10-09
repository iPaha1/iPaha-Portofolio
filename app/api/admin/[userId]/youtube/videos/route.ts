// =============================================================================
// API: /api/admin/[userId]/youtube/videos
// GET  — list videos with filters & pagination
// POST — create a standalone video (outside a batch)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { getOrCreateProfile, getVideosForProfile } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-db";
import { VideoFilterOptions } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-types";

// export async function GET(
//   req: NextRequest,
//   { params }: { params: Promise<{ userId: string }> }
// ) {
//   try {
//     const { userId } = await params;

//     const { userId: clerkId } = await auth();
//     if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

//     const user = await prismadb.user.findFirst({
//       where: { OR: [{ id: userId }, { clerkId }] },
//       select: { id: true, clerkId: true, role: true },
//     });
//     if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

//     const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
//     if (!isAdmin && user.clerkId !== clerkId) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     const profile = await getOrCreateProfile(user.id);
//     const { searchParams } = new URL(req.url);

//     const filters: VideoFilterOptions = {
//       status: searchParams.get("status") as VideoFilterOptions["status"] || undefined,
//       search: searchParams.get("search") || undefined,
//       sortBy: (searchParams.get("sortBy") as VideoFilterOptions["sortBy"]) || "date",
//       sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
//       page: parseInt(searchParams.get("page") || "1"),
//       pageSize: parseInt(searchParams.get("pageSize") || "20"),
//       isStarred: searchParams.get("isStarred") === "true" ? true : undefined,
//     };

//     const result = await getVideosForProfile(profile.id, filters);

//     // Parse JSON fields
//     const videos = result.data.map(v => ({
//       ...v,
//       pausePoints: safeJsonParse(v.pausePoints as unknown as string, []),
//       emphasisPoints: safeJsonParse(v.emphasisPoints as unknown as string, []),
//       tags: safeJsonParse(v.tags as unknown as string, []),
//       thumbnailTextIdeas: safeJsonParse(v.thumbnailTextIdeas as unknown as string, []),
//       coreConcepts: safeJsonParse(v.coreConcepts as unknown as string, []),
//       topicFingerprint: safeJsonParse(v.topicFingerprint as unknown as string, []),
//     }));

//     return NextResponse.json({ ...result, data: videos });
//   } catch (error) {
//     console.error("[youtube/videos GET]", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }


// app/api/admin/[userId]/youtube/videos/route.ts (GET method)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await prismadb.user.findFirst({
      where: { OR: [{ id: userId }, { clerkId }] },
      select: { id: true, clerkId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const isSelf = user.clerkId === clerkId;
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profile = await getOrCreateProfile(user.id);
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");
    const isStarred = searchParams.get("isStarred") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    console.log(`[GET /youtube/videos] Fetching videos for profile ${profile.id} with filters:`, { status, search, sortBy, sortOrder, isStarred, page, pageSize });

    // Build where clause
    const where: any = { profileId: profile.id };
    if (status && status !== "All") {
      where.status = status.toUpperCase();
    }
    if (isStarred) {
      where.isStarred = true;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { seoTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build order by
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "views") {
      orderBy = { viewCount: sortOrder === "asc" ? "asc" : "desc" };
    } else if (sortBy === "likes") {
      orderBy = { likeCount: sortOrder === "asc" ? "asc" : "desc" };
    }

    const [videos, total] = await Promise.all([
      prismadb.youtubeVideo.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prismadb.youtubeVideo.count({ where }),
    ]);
    // console.log(`[GET /youtube/videos] Fetched videos from DB for profile ${profile.id} with filters:`, { status, search, sortBy, sortOrder, isStarred, page, pageSize });

    // Parse JSON fields
    const parsedVideos = videos.map(v => ({
      ...v,
      tags: safeJsonParse(v.tags, []),
      thumbnailTextIdeas: safeJsonParse(v.thumbnailTextIdeas, []),
      coreConcepts: safeJsonParse(v.coreConcepts, []),
      pausePoints: safeJsonParse(v.pausePoints, []),
      emphasisPoints: safeJsonParse(v.emphasisPoints, []),
    }));
    // console.log(`[GET /youtube/videos] Retrieved ${videos.length} videos (total: ${total}) for profile ${profile.id}`);
    // console.log("Sample retrieved videos:", parsedVideos.slice(0, 3).map(v => ({ id: v.id, title: v.title, tags: v.tags })));

    return NextResponse.json({
      data: parsedVideos,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("[youtube/videos GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// function safeJsonParse<T>(value: any, fallback: T): T {
//   if (!value) return fallback;
//   if (typeof value === "string") {
//     try { return JSON.parse(value) as T; } catch { return fallback; }
//   }
//   return value as T;
// }


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await prismadb.user.findFirst({
      where: { OR: [{ id: userId }, { clerkId }] },
      select: { id: true, clerkId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const isSelf = user.clerkId === clerkId;
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profile = await getOrCreateProfile(user.id);
    const body = await req.json();

    const {
      title,
      seoTitle,
      hook,
      intro,
      body: scriptBody,
      perspectiveShift,
      closingLine,
      deliveryNotes,
      toneNotes,
      pausePoints,
      emphasisPoints,
      facialCues,
      energyArc,
      cameraPosition,
      lightingSuggestion,
      bodyLanguageTips,
      setDressing,
      description,
      tags,
      thumbnailTextIdeas,
      category,
      twitterPost,
      linkedinPost,
      facebookPost,
      tiktokCaption,
      shortsCaption,
    } = body;

    // Create the video in database
    const video = await prismadb.youtubeVideo.create({
      data: {
        profileId: profile.id,
        title: title || "Untitled Video",
        seoTitle: seoTitle || title,
        hook: hook || null,
        intro: intro || null,
        body: scriptBody || null,
        perspectiveShift: perspectiveShift || null,
        closingLine: closingLine || null,
        fullScript: [hook, intro, scriptBody, perspectiveShift, closingLine]
          .filter(Boolean)
          .join("\n\n"),
        toneNotes: toneNotes || deliveryNotes || null,
        pausePoints: pausePoints ? JSON.stringify(pausePoints) : null,
        emphasisPoints: emphasisPoints ? JSON.stringify(emphasisPoints) : null,
        facialCues: facialCues || null,
        energyArc: energyArc || null,
        cameraPosition: cameraPosition || null,
        lightingSuggestion: lightingSuggestion || null,
        bodyLanguageTips: bodyLanguageTips || null,
        setDressing: setDressing || null,
        description: description || null,
        tags: tags ? JSON.stringify(tags) : null,
        thumbnailTextIdeas: thumbnailTextIdeas ? JSON.stringify(thumbnailTextIdeas) : null,
        category: category || null,
        twitterPost: twitterPost || null,
        linkedinPost: linkedinPost || null,
        facebookPost: facebookPost || null,
        tiktokCaption: tiktokCaption || null,
        shortsCaption: shortsCaption || null,
        status: "DRAFT",
      },
    });

    return NextResponse.json({
      data: video,
      message: "Video saved to library successfully",
    });
  } catch (error) {
    console.error("[youtube/videos POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




// export async function POST(
//   req: NextRequest,
//   { params }: { params: Promise<{ userId: string }> }
// ) {
//   try {
//     const { userId } = await params;

//     const { userId: clerkId } = await auth();
//     if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

//     const user = await prismadb.user.findFirst({
//       where: { OR: [{ id: userId }, { clerkId }] },
//       select: { id: true, clerkId: true },
//     });
//     if (!user || user.clerkId !== clerkId) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     const profile = await getOrCreateProfile(user.id);
//     const body = await req.json();

//     const video = await prismadb.youtubeVideo.create({
//       data: {
//         profileId: profile.id,
//         title: body.title || "Untitled Video",
//         status: "DRAFT",
//         viewCount: 0,
//         likeCount: 0,
//         commentCount: 0,
//         impressions: 0,
//         isStarred: false,
//         isEdited: false,
//         orderInBatch: 0,
//       },
//     });

//     return NextResponse.json({ data: video, message: "Video created" }, { status: 201 });
//   } catch (error) {
//     console.error("[youtube/videos POST]", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }



function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}