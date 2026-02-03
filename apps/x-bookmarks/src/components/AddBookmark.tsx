import { useState } from 'react';
import { Plus, Link, X } from 'lucide-react';
import { Folder } from '../services/api';

interface AddBookmarkProps {
  folders: Folder[];
  onAdd: (url: string, folderId?: string, note?: string) => void;
}

export function AddBookmark({ folders, onAdd }: AddBookmarkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    
    onAdd(url.trim(), folderId || undefined, note.trim() || undefined);
    setUrl('');
    setFolderId('');
    setNote('');
    setError('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 active:bg-blue-700 transition"
      >
        <Plus className="w-5 h-5" />
        <span className="hidden sm:inline">Add Bookmark</span>
      </button>
    );
  }

  return (
    <>
      {/* Mobile: Full screen overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-2xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-slate-900">Add New Bookmark</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                X/Twitter URL
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="https://x.com/user/status/123..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>

            {/* Folder Select */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Folder (optional)
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3 py-3 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">No folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Note (optional)
              </label>
              <textarea
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-3 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 active:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 active:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
