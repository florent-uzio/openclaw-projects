# X Bookmarks

Save, organize, and preview X (Twitter) posts with a clean UI.

## Features

- 📌 **Save Posts** — Paste any X/Twitter URL to save it
- 📁 **Organize in Folders** — Create color-coded folders
- 👀 **Live Previews** — See embedded tweets using react-tweet
- 🔍 **Search** — Find bookmarks quickly
- 📝 **Notes** — Add notes to your bookmarks
- 📱 **Mobile Friendly** — Works great on phones and tablets

## Quick Start (Development)

```bash
npm install
npm run dev
```

- **Frontend:** http://localhost:5176
- **API:** http://localhost:3002

---

## 🐳 Deploy on Synology NAS

### Option 1: Docker Compose (Recommended)

1. **Copy the app to your NAS** (via SMB or SSH):
   ```bash
   scp -r apps/x-bookmarks user@synology:/volume1/docker/
   ```

2. **SSH into your Synology:**
   ```bash
   ssh user@synology
   cd /volume1/docker/x-bookmarks
   ```

3. **Build and run:**
   ```bash
   docker-compose up -d --build
   ```

4. **Access at:** `http://synology-ip:3002`

### Option 2: Container Manager UI

1. Open **Container Manager** on your Synology
2. Go to **Project** → **Create**
3. Set path to `/volume1/docker/x-bookmarks`
4. It will detect the `docker-compose.yml`
5. Click **Build** then **Start**

### Option 3: Pre-built Image

Build on your Mac and push to the NAS:

```bash
# Build the image
cd apps/x-bookmarks
docker build -t x-bookmarks .

# Save to file
docker save x-bookmarks > x-bookmarks.tar

# Copy to NAS
scp x-bookmarks.tar user@synology:/volume1/docker/

# On NAS: load and run
ssh user@synology
docker load < /volume1/docker/x-bookmarks.tar
docker run -d --name x-bookmarks \
  -p 3002:3002 \
  -v /volume1/docker/x-bookmarks-data:/app/data \
  --restart unless-stopped \
  x-bookmarks
```

### Reverse Proxy (Optional)

For a custom domain with SSL:

1. Go to **Control Panel** → **Login Portal** → **Advanced** → **Reverse Proxy**
2. Create new rule:
   - **Source:** `https://bookmarks.yourdomain.com` (port 443)
   - **Destination:** `http://localhost:3002`
3. Get SSL via **Control Panel** → **Security** → **Certificate**

---

## Data Persistence

The SQLite database is stored in `/app/data/bookmarks.db`. 

Mount this volume to persist data:
```yaml
volumes:
  - /volume1/docker/x-bookmarks-data:/app/data
```

---

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

---

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS + react-tweet
- **Backend:** NestJS
- **Database:** SQLite (better-sqlite3)
- **State:** Zustand + React Query
