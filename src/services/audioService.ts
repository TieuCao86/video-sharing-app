import { supabase } from '../utils/supabase';

export interface AudioTrackItem {
  id: string;
  title: string;
  artist: string;
  durationSecs: number;
  durationFormatted: string; // VD: '03:15'
  audioUrl: string;
  thumbnailUrl: string;
  usesCount: number;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Lấy danh sách nhạc thịnh hành / phổ biến nhất
 * Phục vụ Trang chủ S01, Chọn nhạc S07, Tab Audio Tìm kiếm S02
 */
export async function getAudioTracks(limit = 20): Promise<AudioTrackItem[]> {
  const { data, error } = await supabase
    .from('audio_tracks')
    .select('*')
    .order('uses_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audio tracks:', error);
    throw error;
  }

  return (data || []).map((track: any) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    durationSecs: track.duration_secs,
    durationFormatted: formatDuration(track.duration_secs),
    audioUrl: track.audio_url,
    thumbnailUrl: track.thumbnail_url,
    usesCount: track.uses_count,
  }));
}

/**
 * Tìm kiếm nhạc theo tên bài hát hoặc ca sĩ
 */
export async function searchAudioTracks(query: string): Promise<AudioTrackItem[]> {
  const { data, error } = await supabase
    .from('audio_tracks')
    .select('*')
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
    .order('uses_count', { ascending: false });

  if (error) {
    console.error('Error searching audio tracks:', error);
    throw error;
  }

  return (data || []).map((track: any) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    durationSecs: track.duration_secs,
    durationFormatted: formatDuration(track.duration_secs),
    audioUrl: track.audio_url,
    thumbnailUrl: track.thumbnail_url,
    usesCount: track.uses_count,
  }));
}

