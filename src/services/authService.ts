import { supabase } from '../utils/supabase';
import { authStore, UserProfile } from '../store/useAuthStore';

export const DEFAULT_AVATAR_URL =
  'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Image/avt%20df.png';

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidSignupEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export function getSignupPasswordError(password: string): string | null {
  if (password.length < 6 || password.length > 64) {
    return 'Mật khẩu phải từ 6 đến 64 ký tự.';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 chữ cái và 1 chữ số.';
  }
  return null;
}

/**
 * Kiểm tra xem email đã tồn tại trong database (bảng users) chưa
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) return false;

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .ilike('email', trimmedEmail)
    .maybeSingle();

  if (error) {
    console.error('Error checking email exists:', error);
    return false;
  }

  return !!data;
}

/**
 * Đồng bộ Display Name và thông tin tài khoản vào bảng users
 * Xử lý đúng cấu trúc DB: auth_id = Supabase Auth UID, id = users.id (UUID)
 */
export async function syncUserProfileToDb(
  authUid: string,
  email: string,
  displayName: string
): Promise<void> {
  const trimmedEmail = email.trim();
  const trimmedName = displayName.trim();
  if (!trimmedEmail || !trimmedName) return;

  try {
    // 1. Tìm bản ghi theo auth_id hoặc email
    const { data: byAuthId } = await supabase
      .from('users')
      .select('id, auth_id, email, display_name')
      .eq('auth_id', authUid)
      .maybeSingle();

    let targetUser = byAuthId;
    if (!targetUser) {
      const { data: byEmail } = await supabase
        .from('users')
        .select('id, auth_id, email, display_name')
        .ilike('email', trimmedEmail)
        .maybeSingle();
      targetUser = byEmail;
    }

    if (targetUser) {
      // Đã có bản ghi (do trigger DB tạo tự động hoặc trước đó) -> Cập nhật display_name chuẩn người dùng nhập
      await supabase
        .from('users')
        .update({
          display_name: trimmedName,
          auth_id: authUid,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUser.id);
    } else {
      // Chưa có bản ghi -> Insert mới với auth_id
      await supabase.from('users').insert({
        auth_id: authUid,
        email: trimmedEmail,
        display_name: trimmedName,
        avatar_url: DEFAULT_AVATAR_URL,
        following_count: 0,
        followers_count: 0,
        likes_count: 0,
        videos_count: 0,
      });
    }

    // Cập nhật auth metadata để Supabase session luôn giữ name đúng
    try {
      await supabase.auth.updateUser({
        data: {
          name: trimmedName,
          display_name: trimmedName,
          full_name: trimmedName,
        },
      });
    } catch {
      // Không chặn luồng nếu cập nhật metadata thất bại
    }
  } catch (err) {
    console.error('[syncUserProfileToDb] Error syncing user profile:', err);
  }
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

    // Lấy thông tin user từ bảng users — thử cả id = auth UID lẫn auth_id = auth UID lẫn email
    const authUid = data.user.id;
    let profile: any = null;

    // Ưu tiên 1: users.auth_id = auth UID
    const byAuthId = await supabase.from('users').select('*').eq('auth_id', authUid).maybeSingle();
    if (byAuthId.data) {
      profile = byAuthId.data;
    } else {
      // Ưu tiên 2: users.email = email
      const byEmail = await supabase.from('users').select('*').ilike('email', trimmedEmail).maybeSingle();
      if (byEmail.data) {
        profile = byEmail.data;
        if (!profile.auth_id) {
          void supabase.from('users').update({ auth_id: authUid }).eq('id', profile.id);
        }
      } else {
        // Ưu tiên 3: users.id = auth UID
        const byId = await supabase.from('users').select('*').eq('id', authUid).maybeSingle();
        if (byId.data) profile = byId.data;
      }
    }

    // Lấy display name do người dùng nhập từ metadata (nếu database đang giữ tên tự sinh)
    const metaDisplayName =
      data.user.user_metadata?.display_name ||
      data.user.user_metadata?.name ||
      data.user.user_metadata?.full_name;

    const emailPrefix = trimmedEmail.split('@')[0];
    let resolvedDisplayName = profile?.display_name;

    // Nếu profile chưa có tên hoặc tên đang là email prefix / User / Anonymous
    if (
      metaDisplayName &&
      (!resolvedDisplayName ||
        resolvedDisplayName.toLowerCase() === emailPrefix.toLowerCase() ||
        resolvedDisplayName === 'User' ||
        resolvedDisplayName === 'Anonymous')
    ) {
      resolvedDisplayName = metaDisplayName;
      if (profile?.id) {
        void supabase.from('users').update({ display_name: metaDisplayName }).eq('id', profile.id);
      }
    }

    const loggedInUser: UserProfile = {
      // id luôn là users.id (db PK)
      id: profile?.id || authUid,
      name: resolvedDisplayName || profile?.display_name || metaDisplayName || 'User',
      avatar: profile?.avatar_url || DEFAULT_AVATAR_URL,
      bio: profile?.bio || '',
      following: profile?.following_count || 0,
      followers: profile?.followers_count || 0,
      likes: profile?.likes_count || 0,
      videos: profile?.avatar_url || DEFAULT_AVATAR_URL,
      auth_id: authUid,
    };

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
  if (!isValidSignupEmail(trimmedEmail)) {
    return { success: false, message: 'Vui lòng nhập email hợp lệ (tối đa 254 ký tự).' };
  }
  const passwordError = getSignupPasswordError(password);
  if (passwordError) {
    return { success: false, message: passwordError };
  }

  try {
    // 1. Kiểm tra email đã tồn tại trong bảng users chưa
    const emailExists = await checkEmailExists(trimmedEmail);
    if (emailExists) {
      return {
        success: false,
        message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.',
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: password,
      options: {
        data: {
          name: trimmedName,
          display_name: trimmedName,
          full_name: trimmedName,
        },
      },
    });

    if (error) {
      if (
        error.message?.toLowerCase().includes('already registered') ||
        error.message?.toLowerCase().includes('already exists') ||
        error.status === 422
      ) {
        return {
          success: false,
          message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.',
        };
      }
      return { success: false, message: error.message };
    }

    // Supabase trả về user với identities rỗng khi email đã tồn tại trong Auth (bảo vệ chống dò email)
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        success: false,
        message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.',
      };
    }

    if (data.user) {
      // Đồng bộ thông tin display name do người dùng nhập vào bảng users
      await syncUserProfileToDb(data.user.id, trimmedEmail, trimmedName);

      // Trả về success: true để chuyển sang màn hình OTP
      return {
        success: true,
        message: 'Mã xác nhận OTP đã được gửi về email của bạn.',
      };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Lỗi khi tạo tài khoản.' };
  }
}

/**
 * Xác thực mã OTP sau khi đăng ký (S14 - OTP Verification)
 */
export async function verifyOtpCode(
  email: string,
  token: string,
  displayName?: string
): Promise<AuthResponse> {
  const trimmedEmail = email.trim();
  const trimmedToken = token.trim();

  if (!trimmedEmail || !/^\d{6}$/.test(trimmedToken)) {
    return { success: false, message: 'Mã OTP phải gồm đúng 6 chữ số.' };
  }

  try {
    // 1. Thử xác thực với type 'signup'
    let { data, error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: trimmedToken,
      type: 'signup',
    });

    // 2. Nếu thất bại, thử lại với type 'email'
    if (error) {
      const retry = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: trimmedToken,
        type: 'email',
      });
      if (!retry.error && retry.data.user) {
        data = retry.data;
        error = null;
      }
    }

    if (error || !data.user) {
      return {
        success: false,
        message: error?.message || 'Mã OTP không chính xác hoặc đã hết hạn.',
      };
    }

    // Cập nhật thông tin display name người dùng nhập vào bảng users
    const effectiveDisplayName =
      displayName?.trim() ||
      data.user.user_metadata?.display_name ||
      data.user.user_metadata?.name ||
      data.user.user_metadata?.full_name ||
      '';

    if (effectiveDisplayName) {
      await syncUserProfileToDb(data.user.id, trimmedEmail, effectiveDisplayName);
    }

    // Đăng xuất phiên tạm để bắt người dùng đăng nhập tại màn hình Login
    await supabase.auth.signOut();
    authStore.logout();

    return {
      success: true,
      message: 'Xác thực tài khoản thành công! Vui lòng đăng nhập.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Đã có lỗi xảy ra khi xác thực OTP.',
    };
  }
}

/**
 * Gửi lại mã OTP
 */
export async function resendOtpCode(email: string): Promise<AuthResponse> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return { success: false, message: 'Vui lòng nhập Email để gửi lại mã.' };
  }

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: trimmedEmail,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Đã gửi lại mã OTP về email của bạn.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Lỗi khi gửi lại OTP.' };
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
      const authUid = data.session.user.id;
      let profile: any = null;

      // Thử theo users.auth_id = auth UID trước
      const byAuthId = await supabase.from('users').select('*').eq('auth_id', authUid).maybeSingle();
      if (byAuthId.data) {
        profile = byAuthId.data;
      } else {
        const byEmail = data.session.user.email
          ? await supabase.from('users').select('*').ilike('email', data.session.user.email).maybeSingle()
          : null;
        if (byEmail?.data) {
          profile = byEmail.data;
          if (!profile.auth_id) {
            void supabase.from('users').update({ auth_id: authUid }).eq('id', profile.id);
          }
        } else {
          const byId = await supabase.from('users').select('*').eq('id', authUid).maybeSingle();
          if (byId?.data) profile = byId.data;
        }
      }

      const metaDisplayName =
        data.session.user.user_metadata?.display_name ||
        data.session.user.user_metadata?.name ||
        data.session.user.user_metadata?.full_name;

      const emailPrefix = (data.session.user.email || '').split('@')[0];
      let resolvedDisplayName = profile?.display_name;

      if (
        metaDisplayName &&
        (!resolvedDisplayName ||
          resolvedDisplayName.toLowerCase() === emailPrefix.toLowerCase() ||
          resolvedDisplayName === 'User' ||
          resolvedDisplayName === 'Anonymous')
      ) {
        resolvedDisplayName = metaDisplayName;
        if (profile?.id) {
          void supabase.from('users').update({ display_name: metaDisplayName }).eq('id', profile.id);
        }
      }

      const userProfile: UserProfile = {
        id: profile?.id || authUid,
        name: resolvedDisplayName || profile?.display_name || metaDisplayName || 'User',
        avatar: profile?.avatar_url || DEFAULT_AVATAR_URL,
        bio: profile?.bio || '',
        following: profile?.following_count || 0,
        followers: profile?.followers_count || 0,
        likes: profile?.likes_count || 0,
        videos: profile?.avatar_url || DEFAULT_AVATAR_URL,
        auth_id: authUid,
      };

      authStore.login(userProfile);
      return userProfile;
    }
  } catch (err) {
    console.error('Check session error:', err);
  }
  return null;
}

