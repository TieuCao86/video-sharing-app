import { supabase } from '../utils/supabase';

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
  };
  audioTrack?: {
    id: string;
    title: string;
    artist: string;
    audioUrl: string;
  };
  isLiked?: boolean;
}

function formatViews(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Format raw Supabase video item sang client UI format
 */
function mapVideoItem(v: any, isLiked = false): VideoDetailItem {
  return {
    id: v.id,
    videoUrl: v.video_url || '',
    coverUrl: v.cover_url || '',
    title: v.title || '',
    caption: v.description || v.title || '',
    views: `${formatViews(v.views_count)} views`,
    viewsCount: v.views_count,
    likes: formatViews(v.likes_count),
    likesCount: v.likes_count,
    commentsCount: v.comments_count,
    createdAt: v.created_at,
    visibility: v.visibility,
    creator: {
      id: v.users?.id || v.profiles?.id || '',
      name: v.users?.display_name || v.profiles?.display_name || 'Anonymous',
      avatar: v.users?.avatar_url || v.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
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
 */
export async function getTrendingVideos(limit = 10): Promise<VideoDetailItem[]> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles:creator_id (id, display_name, avatar_url),
      audio_tracks:audio_track_id (id, title, artist, audio_url)
    `)
    .eq('visibility', 'PUBLIC')
    .order('views_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching trending videos:', error);
    throw error;
  }

  return (data || []).map((v: any) => mapVideoItem(v));
}

/**
 * Lấy danh sách video theo Chủ đề (Topic) (S08 / S19)
 */
export async function getVideosByTopic(topicId: string): Promise<VideoDetailItem[]> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles:creator_id (id, display_name, avatar_url),
      audio_tracks:audio_track_id (id, title, artist, audio_url)
    `)
    .eq('visibility', 'PUBLIC')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching topic videos:', error);
    throw error;
  }

  return (data || []).map((v: any) => mapVideoItem(v));
}

/**
 * Lấy chi tiết 1 video theo ID (S03 - Phát video)
 */
export async function getVideoById(videoId: string, currentUserId?: string): Promise<VideoDetailItem | null> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles:creator_id (id, display_name, avatar_url),
      audio_tracks:audio_track_id (id, title, artist, audio_url)
    `)
    .eq('id', videoId)
    .single();

  if (error || !data) {
    console.error('Error fetching video by id:', error);
    return null;
  }

  let isLiked = false;
  if (currentUserId) {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId)
      .eq('video_id', videoId);
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
    .from('videos')
    .select('views_count')
    .eq('id', videoId)
    .single();

  if (data) {
    await supabase
      .from('videos')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', videoId);
  }
}

/**
 * Thả tim / Bỏ tim video (UC16)
 */
export async function toggleLikeVideo(userId: string, videoId: string): Promise<boolean> {
  const { data } = await supabase
    .from('likes')
    .select('*')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();

  if (data) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId);
    if (error) throw error;
    return false; // Đã bỏ thích
  } else {
    const { error } = await supabase
      .from('likes')
      .insert({ user_id: userId, video_id: videoId });
    if (error) throw error;
    return true; // Đã thích
  }
}

/**
 * Lấy danh sách video do chính User tạo (Tab 'My Videos' trên S09)
 */
export async function getUserVideos(creatorId: string): Promise<VideoDetailItem[]> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles:creator_id (id, display_name, avatar_url),
      audio_tracks:audio_track_id (id, title, artist, audio_url)
    `)
    .eq('creator_id', creatorId)
    .neq('visibility', 'DELETED')
    .neq('visibility', 'DRAFT')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user videos:', error);
    throw error;
  }

  return (data || []).map((v: any) => mapVideoItem(v));
}

/**
 * Lấy danh sách video mà User đã Thả tim (Tab 'Liked' trên S09)
 */
export async function getLikedVideos(userId: string): Promise<VideoDetailItem[]> {
  const { data, error } = await supabase
    .from('likes')
    .select(`
      created_at,
      videos:video_id (
        *,
        profiles:creator_id (id, display_name, avatar_url),
        audio_tracks:audio_track_id (id, title, artist, audio_url)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching liked videos:', error);
    throw error;
  }

  return (data || [])
    .filter((item: any) => item.videos && item.videos.visibility !== 'DELETED')
    .map((item: any) => mapVideoItem(item.videos, true));
}

/**
 * Lấy danh sách Bản nháp của tôi (S21 - My Drafts)
 */
export async function getUserDrafts(creatorId: string): Promise<VideoDetailItem[]> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles:creator_id (id, display_name, avatar_url),
      audio_tracks:audio_track_id (id, title, artist, audio_url)
    `)
    .eq('creator_id', creatorId)
    .eq('visibility', 'DRAFT')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching drafts:', error);
    throw error;
  }

  return (data || []).map((v: any) => mapVideoItem(v));
}

/**
 * Tìm kiếm video theo từ khóa tiêu đề hoặc caption (S02)
 */
export async function searchVideos(query: string): Promise<VideoDetailItem[]> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles:creator_id (id, display_name, avatar_url),
      audio_tracks:audio_track_id (id, title, artist, audio_url)
    `)
    .eq('visibility', 'PUBLIC')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('views_count', { ascending: false });

  if (error) {
    console.error('Error searching videos:', error);
    throw error;
  }

  return (data || []).map((v: any) => mapVideoItem(v));
}

