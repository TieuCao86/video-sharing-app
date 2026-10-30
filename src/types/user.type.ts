export interface UserStats {
  following: number;
  followers: number;
  likes: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  stats?: UserStats;
  isFollowing?: boolean;
}