import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Lưu danh sách tài khoản gợi ý đã bị người dùng ẩn (nút X) – FR28, BR07, UC26.
 * Lưu theo từng tài khoản để mở lại màn hình / khởi động lại app thì gợi ý đã ẩn không xuất hiện lại.
 */
const keyFor = (viewerId: string) => `hidden-suggestions:${viewerId}`;

export async function getHiddenSuggestionIds(viewerId: string): Promise<string[]> {
  if (!viewerId) return [];
  try {
    const raw = await AsyncStorage.getItem(keyFor(viewerId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch (error) {
    console.warn('Failed to load hidden suggestions:', error);
    return [];
  }
}

export async function hideSuggestion(viewerId: string, hiddenUserId: string): Promise<string[]> {
  const current = await getHiddenSuggestionIds(viewerId);
  if (current.includes(hiddenUserId)) return current;
  const next = [...current, hiddenUserId];
  await AsyncStorage.setItem(keyFor(viewerId), JSON.stringify(next));
  return next;
}