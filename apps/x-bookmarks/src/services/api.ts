import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export interface Folder {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  tweet_id: string;
  tweet_url: string;
  folder_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  totalBookmarks: number;
  totalFolders: number;
  unorganized: number;
}

// Folders
export const getFolders = async (): Promise<Folder[]> => {
  const { data } = await api.get('/folders');
  return data;
};

export const createFolder = async (folder: { name: string; color?: string; parentId?: string }): Promise<Folder> => {
  const { data } = await api.post('/folders', folder);
  return data;
};

export const updateFolder = async (id: string, folder: { name?: string; color?: string }): Promise<Folder> => {
  const { data } = await api.put(`/folders/${id}`, folder);
  return data;
};

export const deleteFolder = async (id: string): Promise<void> => {
  await api.delete(`/folders/${id}`);
};

// Bookmarks
export const getBookmarks = async (folderId?: string | null): Promise<Bookmark[]> => {
  const params = folderId !== undefined ? { folderId: folderId ?? 'unsorted' } : {};
  const { data } = await api.get('/bookmarks', { params });
  return data;
};

export const createBookmark = async (bookmark: { url: string; folderId?: string; note?: string }): Promise<Bookmark> => {
  const { data } = await api.post('/bookmarks', bookmark);
  return data;
};

export const updateBookmark = async (id: string, bookmark: { folderId?: string | null; note?: string | null }): Promise<Bookmark> => {
  const { data } = await api.put(`/bookmarks/${id}`, bookmark);
  return data;
};

export const moveBookmark = async (id: string, folderId: string | null): Promise<Bookmark> => {
  const { data } = await api.put(`/bookmarks/${id}/move`, { folderId });
  return data;
};

export const deleteBookmark = async (id: string): Promise<void> => {
  await api.delete(`/bookmarks/${id}`);
};

export const getStats = async (): Promise<Stats> => {
  const { data } = await api.get('/bookmarks/stats');
  return data;
};
