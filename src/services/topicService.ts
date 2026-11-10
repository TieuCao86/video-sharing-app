import { supabase } from '../utils/supabase';

export interface Topic {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

/**
 * Lấy danh sách toàn bộ Topics (sắp xếp theo sort_order)
 * Phục vụ Trang chủ S01, Tìm kiếm S02, Đăng video S08, Xem thêm S19
 */
export async function getTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching topics:', error);
    throw error;
  }
  return data || [];
}

