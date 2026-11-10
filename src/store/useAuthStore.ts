import { useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  following: number;
  followers: number;
  likes: number;
  videos: string;
  auth_id: string;
}

export const DEFAULT_USER: UserProfile = {
  id: 'c0000001-0000-4000-8000-000000000001',
  name: 'Pat Reichert',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
  bio: 'Digital creator and video explorer ❤️❤️❤️',
  following: 6,
  followers: 53,
  likes: 23,
  videos: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500',
  auth_id: ""
};

interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile;
  isLoginModalVisible: boolean;
}

type Listener = () => void;

let state: AuthState = {
  isLoggedIn: false, // Default is Guest
  user: DEFAULT_USER,
  isLoginModalVisible: false,
};

const listeners = new Set<Listener>();

export const authStore = {
  getState: (): AuthState => state,
  setState: (
    partial: Partial<AuthState> | ((prev: AuthState) => Partial<AuthState>)
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
  login: (userData?: Partial<UserProfile>) => {
    authStore.setState({
      isLoggedIn: true,
      user: { ...state.user, ...(userData || {}) },
      isLoginModalVisible: false,
    });
  },
  logout: () => {
    authStore.setState({
      isLoggedIn: false,
      isLoginModalVisible: false,
    });
  },
  updateProfile: (updates: Partial<UserProfile>) => {
    authStore.setState({
      user: { ...state.user, ...updates },
    });
  },
  showLoginModal: () => {
    if (!state.isLoggedIn) {
      authStore.setState({ isLoginModalVisible: true });
    }
  },
  hideLoginModal: () => {
    authStore.setState({ isLoginModalVisible: false });
  },
  checkAuth: (action: () => void) => {
    if (state.isLoggedIn) {
      action();
    } else {
      authStore.showLoginModal();
    }
  },
};

export const useAuthStore = () => {
  const [snapshot, setSnapshot] = useState<AuthState>(authStore.getState());

  useEffect(() => {
    return authStore.subscribe(() => {
      setSnapshot(authStore.getState());
    });
  }, []);

  return {
    ...snapshot,
    ...authStore,
  };
};

