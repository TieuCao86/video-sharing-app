import { API_BASE_URL } from '../config/env';
import { ApiUser } from '../types/user.type';

export async function fetchUsers(): Promise<ApiUser[]> {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) {
    throw new Error(`Failed to fetch users (${response.status})`);
  }
  return response.json();
}

export async function fetchUserById(id: string): Promise<ApiUser> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user ${id} (${response.status})`);
  }
  return response.json();
}

