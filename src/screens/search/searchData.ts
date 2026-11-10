export interface SearchVideoItem {
  id: string;
  thumbnail: string;
  views: string;
  viewsCount: number;
  likes: string;
  likesCount: number;
  caption: string;
  creatorName: string;
  creatorAvatar: string;
  timeAgo?: string;
  timestamp: number; // For date filtering/sorting
}

export interface SearchAccountItem {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: string;
  followersCount: number;
  videosCount: string;
  bio: string;
  isFollowing?: boolean;
  isVerified?: boolean;
}

export interface SearchStreamItem {
  id: string;
  streamerName: string;
  streamerAvatar: string;
  title: string;
  viewers: string;
  viewersCount: number;
  thumbnail: string;
  category: string;
  tags: string[];
}

export interface SearchAudioItem {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  audioUrl: string;
  usesCount: string;
}

export const SEARCH_REFERENCE_TIME = Date.now();
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const now = SEARCH_REFERENCE_TIME;
const oneHour = 60 * 60 * 1000;
const oneDay = ONE_DAY_MS;

export const mockSearchVideos: SearchVideoItem[] = [
  {
    id: '1',
    thumbnail: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500',
    views: '1.5M views',
    viewsCount: 1500000,
    likes: '12.3K',
    likesCount: 12300,
    caption: 'Cute golden retriever playing with puppy friends in the park',
    creatorName: 'Laura Pet Care',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    timeAgo: '1 hour ago',
    timestamp: now - oneHour,
  },
  {
    id: '2',
    thumbnail: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500',
    views: '982K views',
    viewsCount: 982000,
    likes: '19.6K',
    likesCount: 19600,
    caption: 'Funny corgi dancing to upbeat music',
    creatorName: 'Liz Corgi Club',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    timeAgo: '3 hours ago',
    timestamp: now - 3 * oneHour,
  },
  {
    id: '3',
    thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500',
    views: '2.4M views',
    viewsCount: 2400000,
    likes: '84.3K',
    likesCount: 84300,
    caption: 'Adorably sleepy cat refuses to wake up for breakfast',
    creatorName: 'Cris Cat World',
    creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100',
    timeAgo: '1 day ago',
    timestamp: now - oneDay,
  },
  {
    id: '4',
    thumbnail: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=500',
    views: '650K views',
    viewsCount: 650000,
    likes: '29.7K',
    likesCount: 29700,
    caption: 'How to make healthy homemade dog food and treats',
    creatorName: 'Lina Pet Chef',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    timeAgo: '2 days ago',
    timestamp: now - 2 * oneDay,
  },
  {
    id: '5',
    thumbnail: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=500',
    views: '890K views',
    viewsCount: 890000,
    likes: '8.2K',
    likesCount: 8200,
    caption: 'Hilarious pet fails compilation 2026',
    creatorName: 'Mike Comedy',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    timeAgo: '4 days ago',
    timestamp: now - 4 * oneDay,
  },
  {
    id: '6',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500',
    views: '2.1M views',
    viewsCount: 2100000,
    likes: '45.6K',
    likesCount: 45600,
    caption: 'Professional dog training tips for beginners - Sit & Stay',
    creatorName: 'Sarah Dog Trainer',
    creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    timeAgo: '5 days ago',
    timestamp: now - 5 * oneDay,
  },
  {
    id: '7',
    thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500',
    views: '567K views',
    viewsCount: 567000,
    likes: '3.4K',
    likesCount: 3400,
    caption: 'Pet store shopping haul and toy review',
    creatorName: 'Tom Pet Hauls',
    creatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    timeAgo: '1 week ago',
    timestamp: now - 7 * oneDay,
  },
  {
    id: '8',
    thumbnail: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500',
    views: '3.2M views',
    viewsCount: 3200000,
    likes: '128K',
    likesCount: 128000,
    caption: 'Vet clinic emergency rescue: cute kitten recovered',
    creatorName: 'Dr. Emily Vet',
    creatorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100',
    timeAgo: '2 weeks ago',
    timestamp: now - 14 * oneDay,
  },
  {
    id: '9',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
    views: '1.1M views',
    viewsCount: 1100000,
    likes: '72K',
    likesCount: 72000,
    caption: 'Hiking through the Alps with my border collie',
    creatorName: 'Adventure Pets',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    timeAgo: '3 weeks ago',
    timestamp: now - 21 * oneDay,
  },
  {
    id: '10',
    thumbnail: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=500',
    views: '430K views',
    viewsCount: 430000,
    likes: '15.2K',
    likesCount: 15200,
    caption: 'Parrot singing Mozart first thing in the morning',
    creatorName: 'Bird Paradise',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    timeAgo: '1 month ago',
    timestamp: now - 30 * oneDay,
  },
];

export const mockSearchAccounts: SearchAccountItem[] = [
  {
    id: 'acc1',
    name: 'Laura Pet Care',
    username: '@laura_pets',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    followers: '2.5M',
    followersCount: 2500000,
    videosCount: '348',
    bio: 'Professional pet groomer & animal rescue lover. Daily tips!',
    isFollowing: false,
    isVerified: true,
  },
  {
    id: 'acc2',
    name: 'Liz Corgi Club',
    username: '@corgi_liz',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    followers: '890K',
    followersCount: 890000,
    videosCount: '192',
    bio: 'Life with 3 fluffy corgis. Pure joy every single day 🐾',
    isFollowing: true,
    isVerified: false,
  },
  {
    id: 'acc3',
    name: 'Dr. Emily Vet',
    username: '@dr_emily_vet',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100',
    followers: '1.8M',
    followersCount: 1800000,
    videosCount: '412',
    bio: 'Veterinarian surgeon sharing pet health facts and rescue stories.',
    isFollowing: false,
    isVerified: true,
  },
  {
    id: 'acc4',
    name: 'Cris Cat World',
    username: '@cris_cats',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100',
    followers: '1.2M',
    followersCount: 1200000,
    videosCount: '260',
    bio: 'Cat cafe owner in Tokyo. Feline happiness guaranteed!',
    isFollowing: false,
    isVerified: false,
  },
  {
    id: 'acc5',
    name: 'Sarah Dog Trainer',
    username: '@sarah_dog_pro',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    followers: '760K',
    followersCount: 760000,
    videosCount: '145',
    bio: 'Certified positive reinforcement trainer. Behavior & agility.',
    isFollowing: false,
    isVerified: true,
  },
];

export const mockSearchStreams: SearchStreamItem[] = [
  {
    id: 'str1',
    streamerName: 'Laura Pet Care',
    streamerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    title: '🔴 LIVE: Puppy bath day & grooming Q&A with viewers',
    viewers: '14.2K',
    viewersCount: 14200,
    thumbnail: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500',
    category: 'Pets & Animals',
    tags: ['Puppy', 'Grooming', 'LiveQ&A'],
  },
  {
    id: 'str2',
    streamerName: 'Cris Cat World',
    streamerAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100',
    title: '🔴 24/7 Cat Cafe Chill Cam: Relaxing lofi music & sleeping cats',
    viewers: '8.9K',
    viewersCount: 8900,
    thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500',
    category: 'Relaxation',
    tags: ['CatCafe', 'Lofi', 'Chill'],
  },
  {
    id: 'str3',
    streamerName: 'Sarah Dog Trainer',
    streamerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    title: '🔴 Dog Agility Championship Finals Live Reaction & Breakdown',
    viewers: '5.1K',
    viewersCount: 5100,
    thumbnail: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500',
    category: 'Sports & Training',
    tags: ['Agility', 'Championship', 'Live'],
  },
];

export const mockSearchAudios: SearchAudioItem[] = [
  {
    id: 'aud1',
    title: 'Quá đủ rồi',
    artist: 'CoolKid',
    duration: '03:15',
    thumbnail: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/ArtistImage/quaduroi.jfif',
    audioUrl: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Music/QUA%20DU%20ROI%20-%20COOLKID.mp3',
    usesCount: '1.2M videos',
  },
  {
    id: 'aud2',
    title: 'Người Im Lặng Gặp Người Hay Nói',
    artist: 'HIEUTHUHAI',
    duration: '03:42',
    thumbnail: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/ArtistImage/c0742c35795d4d234bf86cc7258b5077.jpg',
    audioUrl: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Music/nguoiimlanggapnguoihaynoi.mp3',
    usesCount: '890K videos',
  },
  {
    id: 'aud3',
    title: 'Cute Pet Funny BGM',
    artist: 'Joy Music Lab',
    duration: '02:45',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    usesCount: '520K videos',
  },
  {
    id: 'aud4',
    title: 'Happy Whistle Beat',
    artist: 'Acoustic Fun',
    duration: '02:18',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    usesCount: '340K videos',
  },
  {
    id: 'aud5',
    title: 'Sunny Garden Moments',
    artist: 'Chill Vibes',
    duration: '03:30',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    usesCount: '210K videos',
  },
];

export const mockTrendingTags = [
  'Funny moments of pet',
  'Cats',
  'Dogs',
  'Foods for pet',
  'Vet center',
  'Puppy training',
  'Pet adoption',
  'Cute kittens',
];

export const defaultRecentSearches = [
  'Pet care tips',
  'Golden retriever',
  'Cat funny moments',
  'Dog food recipes',
];
