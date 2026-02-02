import { Tweet } from 'react-tweet';
import { Trash2, FolderInput, ExternalLink, MessageSquare } from 'lucide-react';
import { Bookmark, Folder } from '../services/api';
import { useState } from 'react';

interface TweetCardProps {
  bookmark: Bookmark;
  folders: Folder[];
  onDelete: (id: string) => void;
  onMove: (id: string, folderId: string | null) => void;
}

export function TweetCard({ bookmark, folders, onDelete, onMove }: TweetCardProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition group">
      {/* Tweet Preview */}
      <div className="p-4">
        <Tweet id={bookmark.tweet_id} />
      </div>

      {/* Note if exists */}
      {bookmark.note && (
        <div className="px-4 pb-2">
          <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
            <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{bookmark.note}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition">
        <div className="flex items-center gap-2">
          {/* Move to folder */}
          <div className="relative">
            <button
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-700"
              title="Move to folder"
            >
              <FolderInput className="w-4 h-4" />
            </button>
            
            {showMoveMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMoveMenu(false)} />
                <div className="absolute left-0 bottom-full mb-2 z-20 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[180px]">
                  <button
                    onClick={() => {
                      onMove(bookmark.id, null);
                      setShowMoveMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${!bookmark.folder_id ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                  >
                    No folder
                  </button>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        onMove(bookmark.id, folder.id);
                        setShowMoveMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${bookmark.folder_id === folder.id ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: folder.color }}
                      />
                      {folder.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Open in X */}
          <a
            href={bookmark.tweet_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-700"
            title="Open in X"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(bookmark.id)}
          className="p-2 hover:bg-red-50 rounded-lg transition text-slate-400 hover:text-red-500"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
