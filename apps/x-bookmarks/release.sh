#!/bin/bash

# X-Bookmarks Release Script
# Usage: ./release.sh [patch|minor|major]

set -e

# Config - CHANGE THIS
GITHUB_USERNAME="florentuzio"
IMAGE_NAME="ghcr.io/$GITHUB_USERNAME/x-bookmarks"

# Get bump type (default: patch)
BUMP_TYPE=${1:-patch}

if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Usage: ./release.sh [patch|minor|major]"
  exit 1
fi

# Bump version
echo "📦 Bumping $BUMP_TYPE version..."
npm version $BUMP_TYPE --no-git-tag-version

# Get new version
VERSION=$(node -p "require('./package.json').version")
echo "🏷️  New version: $VERSION"

# Git commit & tag
echo "📝 Committing..."
git add -A
git commit -m "release: v$VERSION"
git tag "v$VERSION"

# Build Docker
echo "🐳 Building Docker image..."
docker build \
  --build-arg APP_VERSION=$VERSION \
  --build-arg BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  -t "$IMAGE_NAME:$VERSION" \
  -t "$IMAGE_NAME:latest" \
  .

# Push Docker
echo "🚀 Pushing to GitHub Container Registry..."
docker push "$IMAGE_NAME:$VERSION"
docker push "$IMAGE_NAME:latest"

# Push git
echo "📤 Pushing to GitHub..."
git push
git push --tags

echo ""
echo "✅ Released v$VERSION!"
echo ""
echo "On your Synology, run:"
echo "  docker pull $IMAGE_NAME:latest"
echo "  docker-compose up -d"
