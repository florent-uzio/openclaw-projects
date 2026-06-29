import { Tweet } from 'react-tweet';
import { Trash2, FolderInput, ExternalLink, MessageSquare } from 'lucide-react';
import { Bookmark, Folder } from '../services/api';
import { Component, ReactNode, useState } from 'react';

interface TweetCardProps {
  bookmark: Bookmark;
  folders: Folder[];
  onDelete: (id: string) => void;
  onMove: (id: string, folderId: string | null) => void;
}

// react-tweet can throw while parsing tweets with an unexpected shape, which
// would otherwise crash the whole dashboard. This contains the failure to a
// single card and shows a fallback instead.
class TweetErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export function TweetCard({ bookmark, folders, onDelete, onMove }: TweetCardProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition">
      {/* Tweet Preview */}
      <div className="p-3 sm:p-4">
        <TweetErrorBoundary
          fallback={
            <div className="text-sm text-slate-400 text-center py-8">
              Couldn't load this post.{' '}
              <a
                href={bookmark.tweet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Open on X
              </a>
            </div>
          }
        >
          <Tweet id={bookmark.tweet_id} apiUrl={`/api/tweet/${bookmark.tweet_id}`} />
        </TweetErrorBoundary>
      </div>

      {/* Note if exists */}
      {bookmark.note && (
        <div className="px-3 sm:px-4 pb-2">
          <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
            <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{bookmark.note}</p>
          </div>
        </div>
      )}

      {/* Actions - Always visible on mobile */}
      <div className="px-3 sm:px-4 py-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Move to folder */}
          <div className="relative">
            <button
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className="p-2.5 sm:p-2 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition text-slate-500 hover:text-slate-700"
              title="Move to folder"
            >
              <FolderInput className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
            
            {showMoveMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMoveMenu(false)} />
                <div className="absolute left-0 bottom-full mb-2 z-20 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[200px] max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      onMove(bookmark.id, null);
                      setShowMoveMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-3 sm:py-2 text-sm hover:bg-slate-50 active:bg-slate-100 ${!bookmark.folder_id ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
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
                      className={`w-full flex items-center gap-2 px-4 py-3 sm:py-2 text-sm hover:bg-slate-50 active:bg-slate-100 ${bookmark.folder_id === folder.id ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: folder.color }}
                      />
                      <span className="truncate">{folder.name}</span>
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
            className="p-2.5 sm:p-2 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition text-slate-500 hover:text-slate-700"
            title="Open in X"
          >
            <ExternalLink className="w-5 h-5 sm:w-4 sm:h-4" />
          </a>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(bookmark.id)}
          className="p-2.5 sm:p-2 hover:bg-red-50 active:bg-red-100 rounded-lg transition text-slate-400 hover:text-red-500"
          title="Delete"
        >
          <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}
