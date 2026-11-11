import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteRecording } from '../utils/persistRecording';

const LOCAL_DRAFTS_KEY = 'local-video-drafts';

export interface DraftItem {
  id: string;
  thumbnail: string;
  title: string;
  updatedAt: string;
  duration?: string;
  videoUrl: string;
  audioTrackId?: string;
  audioTitle?: string;
  description?: string;
  topicId?: string;
  visibility?: string;
}

export interface PublishedVideoItem {
  id: string;
  thumbnail: string;
  title: string;
  videoUrl: string;
  views?: string;
  publishedAt: string;
}

interface DraftsState {
  drafts: DraftItem[];
  publishedVideos: PublishedVideoItem[];
}

type Listener = () => void;

let state: DraftsState = {
  drafts: [],
  publishedVideos: [],
};

const listeners = new Set<Listener>();
let persistQueue: Promise<void> = Promise.resolve();

function isDraftItem(value: unknown): value is DraftItem {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<DraftItem>;
  return (
    typeof draft.id === 'string' &&
    typeof draft.title === 'string' &&
    typeof draft.updatedAt === 'string' &&
    typeof draft.videoUrl === 'string' &&
    typeof draft.thumbnail === 'string'
  );
}

function isLocalDraft(draft: DraftItem) {
  return draft.id.startsWith('local-');
}

function persistLocalDrafts(drafts: DraftItem[]): Promise<void> {
  const localDrafts = drafts.filter(isLocalDraft);
  const write = persistQueue.then(() =>
    AsyncStorage.setItem(LOCAL_DRAFTS_KEY, JSON.stringify(localDrafts))
  );
  persistQueue = write.catch(() => undefined);
  return write;
}

async function hydrateLocalDrafts() {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_DRAFTS_KEY);
    if (!raw) return;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Saved drafts data is not a list.');
    }

    const savedDrafts = parsed.filter(isDraftItem).filter(isLocalDraft);
    if (savedDrafts.length !== parsed.length) {
      console.warn('Some invalid saved drafts were ignored.');
    }

    draftsStore.setState((previous) => {
      const currentIds = new Set(previous.drafts.map((draft) => draft.id));
      return {
        drafts: [
          ...previous.drafts,
          ...savedDrafts.filter((draft) => !currentIds.has(draft.id)),
        ],
      };
    });
  } catch (error) {
    console.warn('Failed to load local drafts:', error);
  }
}

const hydrationPromise = hydrateLocalDrafts();

export const draftsStore = {
  getState: (): DraftsState => state,

  setState: (
    partial: Partial<DraftsState> | ((previous: DraftsState) => Partial<DraftsState>)
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

  addDraft: async (input: {
    videoUrl: string;
    durationSeconds?: number;
    title?: string;
    audioTrackId?: string;
    audioTitle?: string;
    description?: string;
    topicId?: string;
    visibility?: string;
    thumbnail?: string;
  }) => {
    await hydrationPromise;

    const total = Math.max(0, Math.floor(input.durationSeconds ?? 0));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    const draft: DraftItem = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      thumbnail: input.thumbnail ?? '',
      title: input.title?.trim() || 'Untitled recording',
      updatedAt: 'Just now',
      duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      videoUrl: input.videoUrl,
      audioTrackId: input.audioTrackId,
      audioTitle: input.audioTitle,
      description: input.description,
      topicId: input.topicId,
      visibility: input.visibility,
    };

    const nextDrafts = [draft, ...state.drafts];
    await persistLocalDrafts(nextDrafts);
    draftsStore.setState({ drafts: nextDrafts });
    return draft;
  },

  deleteDraft: (id: string) => {
    const target = state.drafts.find((draft) => draft.id === id);
    if (target && isLocalDraft(target)) {
      deleteRecording(target.videoUrl);
      if (target.thumbnail) deleteRecording(target.thumbnail);
    }

    const nextDrafts = state.drafts.filter((draft) => draft.id !== id);
    draftsStore.setState({ drafts: nextDrafts });
    void persistLocalDrafts(nextDrafts).catch((error) => {
      console.warn('Failed to save local drafts:', error);
    });
  },

  publishDraft: (id: string): PublishedVideoItem | null => {
    const target = state.drafts.find((draft) => draft.id === id);
    if (!target) return null;

    const published: PublishedVideoItem = {
      id: `pub-${target.id}-${Date.now()}`,
      thumbnail: target.thumbnail,
      title: target.title,
      videoUrl: target.videoUrl,
      views: '0',
      publishedAt: 'Just now',
    };

    const nextDrafts = state.drafts.filter((draft) => draft.id !== id);
    draftsStore.setState((previous) => ({
      drafts: nextDrafts,
      publishedVideos: [published, ...previous.publishedVideos],
    }));
    void persistLocalDrafts(nextDrafts).catch((error) => {
      console.warn('Failed to save local drafts:', error);
    });
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
