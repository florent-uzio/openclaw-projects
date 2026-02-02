import { useState } from 'react';
import { 
  Folder as FolderIcon, 
  Plus, 
  Bookmark, 
  FolderOpen, 
  Trash2, 
  Edit2,
  X,
  Check,
  Inbox
} from 'lucide-react';
import { Folder, Stats } from '../services/api';
import { useStore } from '../stores/useStore';

interface SidebarProps {
  folders: Folder[];
  stats: Stats | undefined;
  onCreateFolder: (name: string, color: string) => void;
  onUpdateFolder: (id: string, data: { name?: string; color?: string }) => void;
  onDeleteFolder: (id: string) => void;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export function Sidebar({ folders, stats, onCreateFolder, onUpdateFolder, onDeleteFolder }: SidebarProps) {
  const { selectedFolderId, setSelectedFolderId } = useStore();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), newFolderColor);
      setNewFolderName('');
      setNewFolderColor(COLORS[0]);
      setShowNewFolder(false);
    }
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingId(folder.id);
    setEditName(folder.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      onUpdateFolder(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-blue-500" />
          <h1 className="font-bold text-lg">X Bookmarks</h1>
        </div>
        {stats && (
          <p className="text-sm text-slate-500 mt-1">
            {stats.totalBookmarks} posts saved
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {/* All Bookmarks */}
        <button
          onClick={() => setSelectedFolderId('all')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
            selectedFolderId === 'all'
              ? 'bg-blue-50 text-blue-600'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="font-medium">All Bookmarks</span>
          {stats && (
            <span className="ml-auto text-sm text-slate-400">{stats.totalBookmarks}</span>
          )}
        </button>

        {/* Unsorted */}
        <button
          onClick={() => setSelectedFolderId(null)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
            selectedFolderId === null
              ? 'bg-blue-50 text-blue-600'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Inbox className="w-5 h-5" />
          <span className="font-medium">Unsorted</span>
          {stats && (
            <span className="ml-auto text-sm text-slate-400">{stats.unorganized}</span>
          )}
        </button>

        {/* Folders Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Folders
            </span>
            <button
              onClick={() => setShowNewFolder(true)}
              className="p-1 hover:bg-slate-100 rounded transition"
              title="New folder"
            >
              <Plus className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* New Folder Input */}
          {showNewFolder && (
            <div className="px-2 py-2 space-y-2">
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex items-center gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewFolderColor(color)}
                    className={`w-5 h-5 rounded-full transition ${
                      newFolderColor === color ? 'ring-2 ring-offset-1 ring-slate-400' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateFolder}
                  className="flex-1 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewFolder(false)}
                  className="px-3 py-1.5 text-slate-500 text-sm hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Folder List */}
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition cursor-pointer ${
                selectedFolderId === folder.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => !editingId && setSelectedFolderId(folder.id)}
            >
              {editingId === folder.id ? (
                <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(folder.id)}
                    className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(folder.id)}
                    className="p-1 hover:bg-green-100 rounded text-green-600"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <FolderIcon
                    className="w-5 h-5"
                    style={{ color: folder.color }}
                  />
                  <span className="font-medium flex-1 truncate">{folder.name}</span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditFolder(folder);
                      }}
                      className="p-1 hover:bg-slate-200 rounded transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {folders.length === 0 && !showNewFolder && (
            <p className="px-3 py-4 text-sm text-slate-400 text-center">
              No folders yet
            </p>
          )}
        </div>
      </nav>
    </div>
  );
}
