import { supabase } from "../utils/supabase";
import { createLikeNotification } from "./notificationService";
import { resolveDbUserId } from "./userService";

export const PAGE_SIZE = 20;

function pageRange(page: number, pageSize: number): [number, number] {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const from = (safePage - 1) * safePageSize;
  return [from, from + safePageSize - 1];
}

/** Kiểm tra chuỗi có đúng định dạng UUID không */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(val?: string | null): val is string {
  return !!val && UUID_REGEX.test(val);
}

export interface VideoDetailItem {
  id: string;
  videoUrl: string;
  coverUrl: string;
  title: string;
  caption: string;
  views: string;
  viewsCount: number;
  likes: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  visibility: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    isFollowing?: boolean;
  };
  audioTrack?: {
    id: string;
    title: string;
    artist: string;
    audioUrl: string;
  };
  isLiked?: boolean;
}

export interface CreateVideoInput {
  videoUri: string;
  fileSizeBytes: number;
  durationSeconds: number;
  coverUri?: string;
  title: string;
  description: string;
  hashtags?: string[];
  topicId?: string;
  visibility: "PUBLIC" | "PRIVATE";
  audioTrackId?: string;
}

export interface VideoSearchResult {
  videos: VideoDetailItem[];
  mode: "hybrid" | "keyword";
  warning?: string;
}

const VIDEO_FILE_EXTENSIONS = /\.(mp4|mov)$/i;
const IMAGE_FILE_EXTENSIONS = /\.(jpg|jpeg|png|webp|heic)$/i;

async function uploadMediaFile(
  bucket: "Video" | "Image",
  ownerId: string,
  uri: string,
  fallbackExtension: string,
): Promise<string> {
  const extension =
    uri
      .split("?")[0]
      .match(
        bucket === "Video" ? VIDEO_FILE_EXTENSIONS : IMAGE_FILE_EXTENSIONS,
      )?.[1]
      ?.toLowerCase() ?? fallbackExtension;
  const contentType =
    bucket === "Video"
      ? extension === "mov"
        ? "video/quicktime"
        : "video/mp4"
      : extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : "image/jpeg";
  const path = `${ownerId}/posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(
      `Could not read the selected ${bucket === "Video" ? "video" : "cover image"}.`,
    );
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, await response.arrayBuffer(), { contentType, upsert: false });
  if (error) throw error;

  return path;
}

/** Upload a recorded video and create its database post. */
export async function createVideoPost(input: CreateVideoInput): Promise<void> {
  const videoExtension = input.videoUri.split('?')[0].match(VIDEO_FILE_EXTENSIONS)?.[1];
  if (!videoExtension) throw new Error('Video must be an MP4 or MOV file.');
  if (!Number.isFinite(input.fileSizeBytes) || input.fileSizeBytes < 0 || input.fileSizeBytes > 100 * 1024 * 1024) {
    throw new Error('Video must be 100 MB or smaller.');
  }
  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds < 0 || input.durationSeconds > 180) {
    throw new Error('Video must be 180 seconds or shorter.');
  }
  const title = input.title.trim();
  if (title.length < 1 || title.length > 100) throw new Error('Title must be 1 to 100 characters.');
  if (input.description.length > 500) throw new Error('Description must be 500 characters or fewer.');
  const hashtags = input.hashtags ?? [];
  if (hashtags.length > 10 || hashtags.some((tag) => !/^[A-Za-z0-9_]{1,30}$/.test(tag))) {
    throw new Error('Use up to 10 hashtags, each 1 to 30 letters, numbers, or underscores.');
  }
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Please sign in before posting a video.");

  const creatorId =
    (await resolveDbUserId(authData.user.id)) ?? authData.user.id;
  let videoPath: string | undefined;
  let coverPath: string | undefined;
  try {
    videoPath = await uploadMediaFile('Video', authData.user.id, input.videoUri, videoExtension.toLowerCase());
    if (input.coverUri) {
      coverPath = await uploadMediaFile(
        "Image",
        authData.user.id,
        input.coverUri,
        "jpg",
      );
    }

    const videoUrl = supabase.storage.from("Video").getPublicUrl(videoPath)
      .data.publicUrl;
    const coverUrl = coverPath
      ? supabase.storage.from("Image").getPublicUrl(coverPath).data.publicUrl
      : null;
    const { data: createdVideo, error } = await supabase.from('videos').insert({
      creator_id: creatorId,
      title,
      description: [input.description.trim(), ...hashtags.map((tag) => `#${tag}`)].filter(Boolean).join(' '),
      visibility: input.visibility,
      topic_id: input.topicId || null,
      audio_track_id: input.audioTrackId && isUUID(input.audioTrackId) ? input.audioTrackId : null,
      video_url: videoUrl,
      cover_url: coverUrl,
    }).select('id').single();
    if (error) throw error;

    const { error: indexingError } = await supabase.functions.invoke(
      "video-search",
      {
        body: { action: "index-video", videoId: createdVideo.id },
      },
    );
    if (indexingError) {
      console.warn(
        "Video was posted, but search indexing is queued for retry:",
        indexingError,
      );
    }
  } catch (error) {
    const cleanupResults = await Promise.all([
      videoPath
        ? supabase.storage.from("Video").remove([videoPath])
        : Promise.resolve({ error: null }),
      coverPath
        ? supabase.storage.from("Image").remove([coverPath])
        : Promise.resolve({ error: null }),
    ]);
    cleanupResults.forEach(({ error: cleanupError }) => {
      if (cleanupError)
        console.warn("Failed to clean up uploaded post media:", cleanupError);
    });
    throw error;
  }
}

function formatViews(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Format raw Supabase video item sang client UI format
 */
function mapVideoItem(
  v: any,
  isLiked = false,
  followedSet?: ReadonlySet<string>,
): VideoDetailItem {
  const creatorId = v.users?.id || v.profiles?.id || "";
  return {
    id: v.id,
    videoUrl: v.video_url || "",
    coverUrl: v.cover_url || "",
    title: v.title || "",
    caption: v.description || v.title || "",
    views: `${formatViews(v.views_count)} views`,
    viewsCount: v.views_count,
    likes: formatViews(v.likes_count),
    likesCount: v.likes_count,
    commentsCount: v.comments_count,
    createdAt: v.created_at,
    visibility: v.visibility,
    creator: {
      id: creatorId,
      name: v.users?.display_name || v.profiles?.display_name || "Anonymous",
      avatar:
        v.users?.avatar_url ||
        v.profiles?.avatar_url ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      isFollowing: followedSet?.has(creatorId) ?? false,
    },
    audioTrack: v.audio_tracks
      ? {
          id: v.audio_tracks.id,
          title: v.audio_tracks.title,
          artist: v.audio_tracks.artist,
          audioUrl: v.audio_tracks.audio_url,
        }
      : undefined,
    isLiked,
  };
}

/**
 * Lấy danh sách Video Trending (S01 Trang chủ & S19 View more)
 * @param limit        - số lượng video tối đa
 * @param currentUserId - users.id (db id) của người đang xem để check isLiked
 */
export async function getTrendingVideos(limit = PAGE_SIZE, currentUserId?: string, page = 1): Promise<VideoDetailItem[]> {
  const publishedSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("videos")
    .select(
      `
      *,
      profiles:creator_id (id, display_name, avatar_url),
      audio_tracks:audio_track_id (id, title, artist, audio_url)
    `)
    .eq('visibility', 'PUBLIC')
    .gte('created_at', publishedSince);

  if (error) {
    console.error("Error fetching trending videos:", error);
    throw error;
  }

  const [from] = pageRange(page, limit);
  const videos = [...(data || [])]
    .sort((a: any, b: any) => calculateTrendingScore(b) - calculateTrendingScore(a))
    .slice(from, from + Math.max(1, limit));

  // Nếu có user đang đăng nhập → batch check isLiked cho toàn bộ video
  let likedSet = new Set<string>();
  let followedSet = new Set<string>();
  if (currentUserId && videos.length > 0) {
    const videoIds = videos.map((v: any) => v.id);
    const creatorIds = Array.from(
      new Set(videos.map((v: any) => v.creator_id).filter(Boolean)),
    );
    const [likesResult, followsResult] = await Promise.all([
      supabase
        .from("likes")
        .select("video_id")
        .eq("user_id", currentUserId)
        .in("video_id", videoIds),
      creatorIds.length > 0
        ? supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", currentUserId)
            .in("following_id", creatorIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (likesResult.error)
      console.error("Error fetching video likes:", likesResult.error);
    if (followsResult.error)
      console.error("Error fetching followed creators:", followsResult.error);
    likedSet = new Set((likesResult.data || []).map((r: any) => r.video_id));
    followedSet = new Set(
      (followsResult.data || []).map((r: any) => r.following_id),
    );
  }

  return videos.map((v: any) =>
    mapVideoItem(v, likedSet.has(v.id), followedSet),
  );
}

/**
 * Lấy danh sách video theo Chủ đề (Topic) (S08 / S19)
 */
export async function getVideosByTopic(
  topicId: string,
  page = 1,
  pageSize = PAGE_SIZE,
): Promise<VideoDetailItem[]> {
  const [from, to] = pageRange(page, pageSize);
  const { data, error } = await supabase
    .from("videos")
    .select(
      `
      *,
      profiles:creator_id (id, display_name, avatar_url),
      audio_tracks:audio_track_id (id, title, artist, audio_url)
    `,
    )
    .eq("visibility", "PUBLIC")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching topic videos:", error);
    throw error;
  }

  return (data || []).map((v: any) => mapVideoItem(v));
}

/**
 * Lấy chi tiết 1 video theo ID (S03 - Phát video)
 */
export async function getVideoById(
  videoId: string,
  currentUserId?: string,
): Promise<VideoDetailItem | null> {
  const { data, error } = await supabase
    .from("videos")
    .select(
      `
      *,
      profiles:creator_id (id, display_name, avatar_url),
      audio_tracks:audio_track_id (id, title, artist, audio_url)
    `,
    )
    .eq("id", videoId)
    .single();

  if (error || !data) {
    console.error("Error fetching video by id:", error);
    return null;
  }

  let isLiked = false;
  if (currentUserId) {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", currentUserId)
      .eq("video_id", videoId);
    isLiked = !!count && count > 0;
  }

  return mapVideoItem(data, isLiked);
}

/**
 * Tăng lượt xem (viewCount) khi phát video (UC12)
 */
export async function incrementVideoView(videoId: string): Promise<void> {
  // Thực hiện tăng view thông qua Postgres rpc hoặc update đơn giản
  const { data } = await supabase
    .from("videos")
    .select("views_count")
    .eq("id", videoId)
    .single();

  if (data) {
    await supabase
      .from("videos")
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq("id", videoId);
  }
}

/**
 * Thả tim / Bỏ tim video (UC16)
 * @param userId  - users.id (db id) hoặc auth_id của người thả tim — sẽ được resolve tự động
 * @param videoId - id của video
 * @returns true = đang liked, false = đã bỏ liked
 */
export async function toggleLikeVideo(
  userId: string,
  videoId: string,
): Promise<boolean> {
  // Resolve sang users.id đảm bảo đúng FK của bảng likes
  const dbUserId = (await resolveDbUserId(userId)) ?? userId;

  const { data, error: readError } = await supabase
    .from("likes")
    .select("video_id")
    .eq("user_id", dbUserId)
    .eq("video_id", videoId)
    .maybeSingle();

  if (readError) throw readError;

  let liked = false;

  if (data) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", dbUserId)
      .eq("video_id", videoId);
    if (error) throw error;
    liked = false;
  } else {
    const { error } = await supabase
      .from("likes")
      .insert({ user_id: dbUserId, video_id: videoId });
    if (error && error.code !== "23505") throw error;
    liked = true;
  }

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("creator_id")
    .eq("id", videoId)
    .maybeSingle();

  if (videoError) throw videoError;

  if (liked && video?.creator_id) {
    const creatorDbId =
      (await resolveDbUserId(video.creator_id)) ?? video.creator_id;
    if (creatorDbId && creatorDbId !== dbUserId) {
      void createLikeNotification(dbUserId, creatorDbId, videoId);
    }
  }

  return liked;
}

/**
 * Lấy danh sách video do chính User tạo (Tab 'My Videos' trên S09)
 */
export async function getUserVideos(
  creatorId: string,
): Promise<VideoDetailItem[]> {
  // Guard: creatorId phải là UUID hợp lệ
  if (!isUUID(creatorId)) return [];

  const { data, error } = await supabase
    .from("videos")
    .select(
      `
      *,
      profiles:creator_id (id, display_name, avatar_url),
      audio_tracks:audio_track_id (id, title, artist, audio_url)
    `,
    )
    .eq("creator_id", creatorId)
    .neq("visibility", "DELETED")
    .neq("visibility", "DRAFT")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user videos:", error);
    throw error;
  }

  return (data || []).map((v: any) => mapVideoItem(v));
}

/**
 * Lấy danh sách video mà User đã Thả tim (Tab 'Liked' trên S09)
 * @param userId - users.id (db id, UUID) của user
 */
export async function getLikedVideos(
  userId: string,
): Promise<VideoDetailItem[]> {
  // Guard: userId phải là UUID hợp lệ; resolve nếu là auth_id
  if (!isUUID(userId)) return [];
  const dbUserId = (await resolveDbUserId(userId)) ?? userId;

  const { data, error } = await supabase
    .from("likes")
    .select(
      `
      created_at,
      videos:video_id (
        *,
        profiles:creator_id (id, display_name, avatar_url),
        audio_tracks:audio_track_id (id, title, artist, audio_url)
      )
    `,
    )
    .eq("user_id", dbUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching liked videos:", error);
    throw error;
  }

  return (data || [])
    .filter((item: any) => item.videos && item.videos.visibility !== "DELETED")
    .map((item: any) => mapVideoItem(item.videos, true));
}

/**
 * Lấy danh sách Bản nháp của tôi (S21 - My Drafts)
 */
export async function getUserDrafts(
  creatorId: string,
): Promise<VideoDetailItem[]> {
  const { data, error } = await supabase
    .from("videos")
    .select(
      `
      *,
      profiles:creator_id (id, display_name, avatar_url),
      audio_tracks:audio_track_id (id, title, artist, audio_url)
    `,
    )
    .eq("creator_id", creatorId)
    .eq("visibility", "DRAFT")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching drafts:", error);
    throw error;
  }

  return (data || []).map((v: any) => mapVideoItem(v));
}

/** Publish an existing server-side draft without uploading its media again. */
export async function publishStoredVideoDraft(draftId: string, title: string): Promise<void> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle || trimmedTitle.length > 100) throw new Error('Title must be 1 to 100 characters.');
  const { data, error } = await supabase
    .from('videos')
    .update({ title: trimmedTitle, visibility: 'PUBLIC', updated_at: new Date().toISOString() })
    .eq('id', draftId)
    .eq('visibility', 'DRAFT')
    .select('id');
  if (error) throw error;
  if (!data?.length) throw new Error('Could not publish this draft. Refresh your drafts and try again.');
}

const VIDEO_SEARCH_SELECT = `
  *,
  profiles:creator_id (id, display_name, avatar_url),
  audio_tracks:audio_track_id (id, title, artist, audio_url)
`;

export interface TrendingWeights {
  views: number;
  likes: number;
  comments: number;
}

export const DEFAULT_TRENDING_WEIGHTS: TrendingWeights = { views: 3, likes: 2, comments: 1 };

export function calculateTrendingScore(
  video: { views_count?: number | null; likes_count?: number | null; comments_count?: number | null },
  weights: TrendingWeights = DEFAULT_TRENDING_WEIGHTS
): number {
  return (video.views_count ?? 0) * weights.views
    + (video.likes_count ?? 0) * weights.likes
    + (video.comments_count ?? 0) * weights.comments;
}

class NonFallbackSearchError extends Error {}

async function searchVideosByKeyword(
  query: string,
): Promise<VideoDetailItem[]> {
  const escapedQuery = query.replace(/[\\%_]/g, "\\$&");
  const pattern = `%${escapedQuery}%`;
  const [titleResult, descriptionResult] = await Promise.all([
    supabase
      .from("videos")
      .select(VIDEO_SEARCH_SELECT)
      .eq("visibility", "PUBLIC")
      .ilike("title", pattern)
      .order("views_count", { ascending: false })
      .limit(30),
    supabase
      .from("videos")
      .select(VIDEO_SEARCH_SELECT)
      .eq("visibility", "PUBLIC")
      .ilike("description", pattern)
      .order("views_count", { ascending: false })
      .limit(30),
  ]);

  if (titleResult.error) throw titleResult.error;
  if (descriptionResult.error) throw descriptionResult.error;

  const videosById = new Map<string, any>();
  for (const video of [
    ...(titleResult.data || []),
    ...(descriptionResult.data || []),
  ]) {
    videosById.set(video.id, video);
  }

  return Array.from(videosById.values())
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .map((video) => mapVideoItem(video));
}

/** Search public videos with semantic + keyword retrieval and an explicit keyword fallback. */
export async function searchVideosWithStatus(
  query: string,
): Promise<VideoSearchResult> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return { videos: [], mode: 'hybrid' };
  if (trimmedQuery.length > 100) throw new Error('Search query must be 100 characters or fewer.');

  try {
    const { data, error } = await supabase.functions.invoke<{
      videoIds?: unknown;
    }>("video-search", {
      body: { action: "search", query: trimmedQuery },
    });
    if (error) {
      const response = error.context;
      if (
        response instanceof Response &&
        [400, 401, 403, 429].includes(response.status)
      ) {
        throw new NonFallbackSearchError(
          response.status === 429
            ? "Search limit reached. Please try again in a minute."
            : "The search request could not be completed.",
        );
      }
      throw error;
    }

    if (
      !Array.isArray(data?.videoIds) ||
      !data.videoIds.every((id) => typeof id === "string")
    ) {
      throw new Error("Semantic search returned an invalid response.");
    }

    const videoIds = Array.from(new Set(data.videoIds));
    if (videoIds.length === 0) return { videos: [], mode: "hybrid" };

    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select(VIDEO_SEARCH_SELECT)
      .eq("visibility", "PUBLIC")
      .in("id", videoIds);
    if (videosError) throw videosError;

    const videosById = new Map(
      (videos || []).map((video: any) => [video.id, video]),
    );
    return {
      videos: videoIds
        .map((id) => videosById.get(id))
        .filter((video): video is NonNullable<typeof video> => Boolean(video))
        .map((video) => mapVideoItem(video)),
      mode: "hybrid",
    };
  } catch (semanticError) {
    if (semanticError instanceof NonFallbackSearchError) throw semanticError;
    console.warn(
      "Semantic video search failed; falling back to keyword search:",
      semanticError,
    );
    return {
      videos: await searchVideosByKeyword(trimmedQuery),
      mode: "keyword",
      warning:
        "Tìm kiếm ngữ nghĩa hiện không khả dụng; đang hiển thị kết quả khớp từ khóa.",
    };
  }
}

/** Compatibility wrapper for callers that only need the matching video list. */
export async function searchVideos(query: string): Promise<VideoDetailItem[]> {
  return (await searchVideosWithStatus(query)).videos;
}
