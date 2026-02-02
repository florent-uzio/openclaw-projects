# X Bookmarks

Save, organize, and preview X (Twitter) posts with a clean UI.

## Features

- 📌 **Save Posts** — Paste any X/Twitter URL to save it
- 📁 **Organize in Folders** — Create color-coded folders
- 👀 **Live Previews** — See embedded tweets using react-tweet
- 🔍 **Search** — Find bookmarks quickly
- 📝 **Notes** — Add notes to your bookmarks

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS + react-tweet
- **Backend:** NestJS
- **Database:** SQLite (better-sqlite3)
- **State:** Zustand + React Query

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

- **Frontend:** http://localhost:5176
- **Backend API:** http://localhost:3002

## API Endpoints

### Folders
- `GET /api/folders` — List all folders
- `POST /api/folders` — Create folder
- `PUT /api/folders/:id` — Update folder
- `DELETE /api/folders/:id` — Delete folder

### Bookmarks
- `GET /api/bookmarks` — List all bookmarks
- `GET /api/bookmarks?folderId=xxx` — List by folder
- `GET /api/bookmarks/stats` — Get stats
- `POST /api/bookmarks` — Create bookmark
- `PUT /api/bookmarks/:id` — Update bookmark
- `PUT /api/bookmarks/:id/move` — Move to folder
- `DELETE /api/bookmarks/:id` — Delete bookmark

## Usage

1. Click "Add Bookmark"
2. Paste an X/Twitter URL (e.g., `https://x.com/user/status/123456789`)
3. Optionally select a folder and add a note
4. Save!

The tweet will be rendered with a live preview using the embedded X widget.
