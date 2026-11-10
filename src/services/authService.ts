import { supabase } from '../utils/supabase';
import { authStore, UserProfile } from '../store/useAuthStore';

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
}

/**
 * Đăng nhập bằng Email và Password (UC02 - S12)
 */
export async function loginWithEmail(email: string, password: string): Promise<AuthResponse> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    return { success: false, message: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: password,
    });

    if (error || !data.user) {
      return { success: false, message: error?.message || 'Email hoặc mật khẩu không chính xác!' };
    }

    // Lấy thông tin user tương ứng từ bảng users
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    const loggedInUser: UserProfile = {
      id: data.user.id,
      name: profile?.display_name || data.user.user_metadata?.name || 'User',
      avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      bio: profile?.bio || '',
      following: profile?.following_count || 0,
      followers: profile?.followers_count || 0,
      likes: profile?.likes_count || 0,
      videos: profile?.avatar_url || '',
    };

    // Cập nhật vào global store
    authStore.login(loggedInUser);

    return { success: true, user: loggedInUser };
  } catch (err: any) {
    return { success: false, message: err.message || 'Đã có lỗi xảy ra khi đăng nhập.' };
  }
}

/**
 * Đăng ký tài khoản mới (UC01 - S13)
 */
export async function signUpWithEmail(
  displayName: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const trimmedName = displayName.trim();
  const trimmedEmail = email.trim();

  if (trimmedName.length < 2 || trimmedName.length > 50) {
    return { success: false, message: 'Tên hiển thị phải từ 2 đến 50 ký tự.' };
  }
  if (!trimmedEmail) {
    return { success: false, message: 'Vui lòng nhập Email hợp lệ.' };
  }
  if (password.length < 6) {
    return { success: false, message: 'Mật khẩu phải từ 6 ký tự trở lên.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: password,
      options: {
        data: {
          name: trimmedName,
        },
      },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (data.user) {
      // Tạo bản ghi tương ứng trong bảng users
      await supabase.from('users').upsert({
        id: data.user.id,
        email: trimmedEmail,
        display_name: trimmedName,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        following_count: 0,
        followers_count: 0,
        likes_count: 0,
        videos_count: 0,
      });

      // Nếu có session (email confirmation OFF) → tự động login
      if (data.session) {
        const newUser: UserProfile = {
          id: data.user.id,
          name: trimmedName,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
          bio: '',
          following: 0,
          followers: 0,
          likes: 0,
          videos: '',
        };
        authStore.login(newUser);
        return { success: true, user: newUser };
      }

      // Email confirmation ON → thông báo cần xác nhận email
      return {
        success: false,
        message: 'Vui lòng kiểm tra email và xác nhận tài khoản trước khi đăng nhập.',
      };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Lỗi khi tạo tài khoản.' };
  }
}

/**
 * Đăng xuất (UC03)
 */
export async function logout(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Error signing out:', err);
  } finally {
    authStore.logout();
  }
}

/**
 * Khôi phục phiên đăng nhập khi khởi động App
 */
export async function checkSession(): Promise<UserProfile | null> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .maybeSingle();

      const userProfile: UserProfile = {
        id: data.session.user.id,
        name: profile?.display_name || data.session.user.user_metadata?.name || 'User',
        avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        bio: profile?.bio || '',
        following: profile?.following_count || 0,
        followers: profile?.followers_count || 0,
        likes: profile?.likes_count || 0,
        videos: profile?.avatar_url || '',
      };

      authStore.login(userProfile);
      return userProfile;
    }
  } catch (err) {
    console.error('Check session error:', err);
  }
  return null;
}

