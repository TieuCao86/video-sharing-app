import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authStore } from "./useAuthStore";
import { deleteRecording } from "../utils/persistRecording";

const LOCAL_DRAFTS_KEY = "local-video-drafts";

/** UC29, S21: mỗi tài khoản lưu tối đa 20 bản nháp */
export const MAX_DRAFTS_PER_USER = 20;
export const DRAFT_LIMIT_MESSAGE = `Bạn đã có tối đa ${MAX_DRAFTS_PER_USER} bản nháp. Hãy xóa bớt bản nháp cũ trước khi lưu thêm.`;

export interface DraftItem {
  id: string;
  thumbnail: string;
  title: string;
  updatedAt: string;
  duration?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  videoUrl: string;
  audioTrackId?: string;
  audioTitle?: string;
  description?: string;
  topicId?: string;
  visibility?: string;
  ownerId?: string;
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
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<DraftItem>;
  return (
    typeof draft.id === "string" &&
    typeof draft.title === "string" &&
    typeof draft.updatedAt === "string" &&
    typeof draft.videoUrl === "string" &&
    typeof draft.thumbnail === "string"
  );
}

function isLocalDraft(draft: DraftItem) {
  return draft.id.startsWith("local-");
}

/** TC66 – BR03: chỉ chủ sở hữu thấy bản nháp của mình */
function currentOwnerId(): string {
  const auth = authStore.getState();
  return auth.isLoggedIn && auth.user?.id ? auth.user.id : "guest";
}

function visibleState(): DraftsState {
  const owner = currentOwnerId();
  return {
    ...state,
    drafts: state.drafts.filter((draft) => draft.ownerId === owner),
  };
}

function findOwnDraft(id: string): DraftItem | undefined {
  const owner = currentOwnerId();
  return state.drafts.find(
    (draft) => draft.id === id && draft.ownerId === owner,
  );
}

function persistLocalDrafts(drafts: DraftItem[]): Promise<void> {
  const localDrafts = drafts.filter(isLocalDraft);
  const write = persistQueue.then(() =>
    AsyncStorage.setItem(LOCAL_DRAFTS_KEY, JSON.stringify(localDrafts)),
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
      throw new Error("Saved drafts data is not a list.");
    }

    const savedDrafts = parsed.filter(isDraftItem).filter(isLocalDraft);
    if (savedDrafts.length !== parsed.length) {
      console.warn("Some invalid saved drafts were ignored.");
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
    console.warn("Failed to load local drafts:", error);
  }
}

const hydrationPromise = hydrateLocalDrafts();

// Đổi tài khoản (đăng nhập/đăng xuất) → màn hình bản nháp cập nhật lại danh sách
authStore.subscribe(() => {
  listeners.forEach((listener) => listener());
});

export const draftsStore = {
  getState: (): DraftsState => visibleState(),

  setState: (
    partial:
      | Partial<DraftsState>
      | ((previous: DraftsState) => Partial<DraftsState>),
  ) => {
    const next = typeof partial === "function" ? partial(state) : partial;
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
    fileSizeBytes?: number;
    title?: string;
    audioTrackId?: string;
    audioTitle?: string;
    description?: string;
    topicId?: string;
    visibility?: string;
    thumbnail?: string;
    /** Lưu đè lên bản nháp đang chỉnh sửa (mở từ My Drafts) thay vì tạo bản mới */
    replaceId?: string;
  }) => {
    await hydrationPromise;
    const owner = currentOwnerId();
    const replacing = input.replaceId
      ? findOwnDraft(input.replaceId)
      : undefined;
    const ownCount = state.drafts.filter((d) => d.ownerId === owner).length;
    if (!replacing && ownCount >= MAX_DRAFTS_PER_USER) {
      throw new Error(DRAFT_LIMIT_MESSAGE);
    }

    const total = Math.max(0, Math.floor(input.durationSeconds ?? 0));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    const draft: DraftItem = {
      id: replacing?.id ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      thumbnail: input.thumbnail ?? '',
      title: input.title?.trim() || 'Untitled recording',
      updatedAt: 'Just now',
      duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      durationSeconds: total,
      fileSizeBytes: input.fileSizeBytes,
      videoUrl: input.videoUrl,
      audioTrackId: input.audioTrackId,
      audioTitle: input.audioTitle,
      description: input.description,
      topicId: input.topicId,
      visibility: input.visibility,
      ownerId: owner,
    };

    const nextDrafts = [
      draft,
      ...state.drafts.filter((d) => d.id !== draft.id),
    ];
    await persistLocalDrafts(nextDrafts);
    draftsStore.setState({ drafts: nextDrafts });
    return draft;
  },

  deleteDraft: (id: string) => {
    const target = findOwnDraft(id);
    if (!target) return;
    if (target && isLocalDraft(target)) {
      deleteRecording(target.videoUrl);
      if (target.thumbnail) deleteRecording(target.thumbnail);
    }

    const nextDrafts = state.drafts.filter((draft) => draft.id !== id);
    draftsStore.setState({ drafts: nextDrafts });
    void persistLocalDrafts(nextDrafts).catch((error) => {
      console.warn("Failed to save local drafts:", error);
    });
  },

  /** Xóa bản nháp khỏi danh sách sau khi đã đăng thành công (tệp do màn hình Post xử lý) */
  removeDraftEntry: (id: string) => {
    if (!findOwnDraft(id)) return;
    const nextDrafts = state.drafts.filter((draft) => draft.id !== id);
    draftsStore.setState({ drafts: nextDrafts });
    void persistLocalDrafts(nextDrafts).catch((error) => {
      console.warn("Failed to save local drafts:", error);
    });
  },

  publishDraft: (id: string): PublishedVideoItem | null => {
    const target = findOwnDraft(id);
    if (!target) return null;

    const published: PublishedVideoItem = {
      id: `pub-${target.id}-${Date.now()}`,
      thumbnail: target.thumbnail,
      title: target.title,
      videoUrl: target.videoUrl,
      views: "0",
      publishedAt: "Just now",
    };

    const nextDrafts = state.drafts.filter((draft) => draft.id !== id);
    draftsStore.setState((previous) => ({
      drafts: nextDrafts,
      publishedVideos: [published, ...previous.publishedVideos],
    }));
    void persistLocalDrafts(nextDrafts).catch((error) => {
      console.warn("Failed to save local drafts:", error);
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
