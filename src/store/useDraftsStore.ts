import { useState, useEffect } from 'react';
import { MOCK_VIDEOS_ARRAY } from '../screens/reel/ReelDetailScreen';

export interface DraftItem {
  id: string;
  thumbnail: string;
  title: string;
  updatedAt: string;
  duration?: string;
  videoUrl: string;
}

export interface PublishedVideoItem {
  id: string;
  thumbnail: string;
  title: string;
  videoUrl: string;
  views?: string;
  publishedAt: string;
}

const INITIAL_DRAFTS: DraftItem[] = [
  {
    id: 'draft-1',
    thumbnail: 'https://picsum.photos/seed/draft1/300/400',
    title: 'Summer dance routine',
    updatedAt: '2 hours ago',
    duration: '0:15',
    videoUrl: MOCK_VIDEOS_ARRAY[0]?.url || 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Video/360429_small.mp4',
  },
  {
    id: 'draft-2',
    thumbnail: 'https://picsum.photos/seed/draft2/300/400',
    title: 'Cooking recipe tutorial',
    updatedAt: 'Yesterday',
    duration: '0:30',
    videoUrl: MOCK_VIDEOS_ARRAY[1]?.url || 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    id: 'draft-3',
    thumbnail: 'https://picsum.photos/seed/draft3/300/400',
    title: 'Travel memories preview',
    updatedAt: '3 days ago',
    duration: '0:45',
    videoUrl: MOCK_VIDEOS_ARRAY[2]?.url || 'https://download.samplelib.com/mp4/sample-5s.mp4',
  },
  {
    id: 'draft-4',
    thumbnail: 'https://picsum.photos/seed/draft4/300/400',
    title: 'Sunset timelapse draft',
    updatedAt: 'Last week',
    duration: '0:20',
    videoUrl: MOCK_VIDEOS_ARRAY[3]?.url || 'https://download.samplelib.com/mp4/sample-10s.mp4',
  },
  {
    id: 'draft-5',
    thumbnail: 'https://picsum.photos/seed/draft5/300/400',
    title: 'Guitar chord practice',
    updatedAt: '2 weeks ago',
    duration: '1:00',
    videoUrl: MOCK_VIDEOS_ARRAY[4]?.url || 'https://download.samplelib.com/mp4/sample-15s.mp4',
  },
  {
    id: 'draft-6',
    thumbnail: 'https://picsum.photos/seed/draft6/300/400',
    title: 'Cat play highlights',
    updatedAt: '3 weeks ago',
    duration: '0:18',
    videoUrl: MOCK_VIDEOS_ARRAY[5]?.url || 'https://download.samplelib.com/mp4/sample-20s.mp4',
  },
];

interface DraftsState {
  drafts: DraftItem[];
  publishedVideos: PublishedVideoItem[];
}

type Listener = () => void;

let state: DraftsState = {
  drafts: INITIAL_DRAFTS,
  publishedVideos: [],
};

const listeners = new Set<Listener>();

export const draftsStore = {
  getState: (): DraftsState => state,
  setState: (
    partial: Partial<DraftsState> | ((prev: DraftsState) => Partial<DraftsState>)
  ) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  deleteDraft: (id: string) => {
    draftsStore.setState((prev) => ({
      drafts: prev.drafts.filter((d) => d.id !== id),
    }));
  },
  publishDraft: (id: string): PublishedVideoItem | null => {
    const target = state.drafts.find((d) => d.id === id);
    if (!target) return null;

    const published: PublishedVideoItem = {
      id: `pub-${target.id}-${Date.now()}`,
      thumbnail: target.thumbnail,
      title: target.title,
      videoUrl: target.videoUrl,
      views: '0',
      publishedAt: 'Just now',
    };

    draftsStore.setState((prev) => ({
      drafts: prev.drafts.filter((d) => d.id !== id),
      publishedVideos: [published, ...prev.publishedVideos],
    }));

    return published;
  },
};

export const useDraftsStore = () => {
  const [snapshot, setSnapshot] = useState<DraftsState>(draftsStore.getState());

  useEffect(() => {
    return draftsStore.subscribe(() => {
      setSnapshot(draftsStore.getState());
    });
  }, []);

  return {
    ...snapshot,
    ...draftsStore,
  };
};

