import { User } from './user.type';

export interface AudioTrack {
  id: string;
  title: string;
  duration: string;
  previewUrl?: string;
  isSaved?: boolean;
}

export interface VideoStats {
  likes: number;
  comments: number;
  shares: number;
  views: string;
}

export interface VideoItem {
  id: string;
  videoUrl: string;
  coverUrl: string;
  caption: string;
  audioTrack: AudioTrack;
  creator: User;
  stats: VideoStats;
  isLiked: boolean;
}

export interface Story {
  id: string;
  name: string;
  avatar: string;
  hasStory: boolean;
}

export interface BrowseTopic {
  id: string;
  name: string;
  icon: string;
}

export interface TopTrendingItem {
  id: string;
  title: string;
  views: string;
  thumbnail: string;
  timeAgo: string;
  creator: User;
}