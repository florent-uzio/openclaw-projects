import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, RefreshCw, Bookmark, FolderOpen } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TweetCard } from './components/TweetCard';
import { AddBookmark } from './components/AddBookmark';
import { useStore } from './stores/useStore';
import {
  getFolders,
  getBookmarks,
  getStats,
  createFolder,
  updateFolder,
  deleteFolder,
  createBookmark,
  moveBookmark,
  deleteBookmark,
  Folder,
} from './services/api';

export default function App() {
  const queryClient = useQueryClient();
  const { selectedFolderId, searchQuery, setSearchQuery } = useStore();

  // Queries
  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: getFolders,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const { data: bookmarks = [], isLoading: loadingBookmarks, refetch: refetchBookmarks } = useQuery({
    queryKey: ['bookmarks', selectedFolderId],
    queryFn: () => {
      if (selectedFolderId === 'all') return getBookmarks();
      return getBookmarks(selectedFolderId);
    },
  });

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => createFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) =>
      updateFolder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const createBookmarkMutation = useMutation({
    mutationFn: (data: { url: string; folderId?: string; note?: string }) =>
      createBookmark(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const moveBookmarkMutation = useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      moveBookmark(id, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: deleteBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  // Filter bookmarks by search
  const filteredBookmarks = bookmarks.filter((b) =>
    searchQuery ? b.tweet_id.includes(searchQuery) || b.note?.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  // Get current folder name
  const getCurrentTitle = () => {
    if (selectedFolderId === 'all') return 'All Bookmarks';
    if (selectedFolderId === null) return 'Unsorted';
    const folder = folders.find((f) => f.id === selectedFolderId);
    return folder?.name || 'Bookmarks';
  };

  const getCurrentFolder = (): Folder | undefined => {
    if (selectedFolderId === 'all' || selectedFolderId === null) return undefined;
    return folders.find((f) => f.id === selectedFolderId);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        folders={folders}
        stats={stats}
        onCreateFolder={(name, color) => createFolderMutation.mutate({ name, color })}
        onUpdateFolder={(id, data) => updateFolderMutation.mutate({ id, data })}
        onDeleteFolder={(id) => deleteFolderMutation.mutate(id)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getCurrentFolder() ? (
                <FolderOpen
                  className="w-6 h-6"
                  style={{ color: getCurrentFolder()?.color }}
                />
              ) : (
                <Bookmark className="w-6 h-6 text-blue-500" />
              )}
              <h2 className="text-xl font-bold text-slate-900">{getCurrentTitle()}</h2>
              <span className="text-slate-400">({filteredBookmarks.length})</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => refetchBookmarks()}
                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loadingBookmarks ? 'animate-spin' : ''}`} />
              </button>
              <AddBookmark
                folders={folders}
                onAdd={(url, folderId, note) =>
                  createBookmarkMutation.mutate({ url, folderId, note })
                }
              />
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-slate-200 transition"
            />
          </div>
        </header>

        {/* Bookmarks Grid */}
        <main className="flex-1 overflow-y-auto p-6">
          {loadingBookmarks ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Bookmark className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium">No bookmarks yet</p>
              <p className="text-sm">Add your first X post to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookmarks.map((bookmark) => (
                <TweetCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  folders={folders}
                  onDelete={(id) => deleteBookmarkMutation.mutate(id)}
                  onMove={(id, folderId) => moveBookmarkMutation.mutate({ id, folderId })}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
