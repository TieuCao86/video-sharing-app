export interface UserStats {
  following: number;
  followers: number;
  likes: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  following?: number;
  followers?: number;
  likes?: number;
  videos?: string;
  bio?: string;
  stats?: UserStats;
  isFollowing?: boolean;
}

export interface ApiUser {
  id: string;
  name: string;
  avatar: string;
  following: number;
  followers: number;
  likes: number;
  videos: string;
  bio?: string;
}
