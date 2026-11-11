#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting Netlify build for SofLIA Academy monorepo..."

# Make npm resilient to Netlify's intermittent registry network blips (ECONNRESET).
# Without retries a single dropped connection during install fails the whole deploy.
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-timeout 300000

copy_ffmpeg_from_path() {
  local installed_ffmpeg
  installed_ffmpeg="$(command -v ffmpeg || true)"

  if [ -z "${installed_ffmpeg}" ]; then
    return 1
  fi

  echo "✅ Found FFmpeg on PATH at ${installed_ffmpeg}."
  cp "${installed_ffmpeg}" apps/web/bin/ffmpeg
  chmod +x apps/web/bin/ffmpeg
}

install_ffmpeg_from_npm() {
  local ffmpeg_npm_dir
  ffmpeg_npm_dir="$(mktemp -d)"

  echo "📦 Installing FFmpeg binary from npm..."
  if ! (
    cd "${ffmpeg_npm_dir}"
    npm init -y >/dev/null
    npm install --omit=dev --include=optional --ignore-scripts --package-lock=false --no-audit --no-fund @ffmpeg-installer/ffmpeg@1.1.0
  ); then
    echo "❌ Unable to install @ffmpeg-installer/ffmpeg in an isolated temp directory."
    rm -rf "${ffmpeg_npm_dir}"
    return 1
  fi

  local installed_ffmpeg
  if ! installed_ffmpeg="$(node -e "const ffmpeg = require(process.argv[1]); process.stdout.write(ffmpeg.path || '');" "${ffmpeg_npm_dir}/node_modules/@ffmpeg-installer/ffmpeg")"; then
    echo "❌ Unable to resolve @ffmpeg-installer/ffmpeg path."
    rm -rf "${ffmpeg_npm_dir}"
    return 1
  fi

  if [ -z "${installed_ffmpeg}" ] || [ ! -f "${installed_ffmpeg}" ]; then
    echo "❌ @ffmpeg-installer/ffmpeg did not provide an executable binary path."
    rm -rf "${ffmpeg_npm_dir}"
    return 1
  fi

  cp "${installed_ffmpeg}" apps/web/bin/ffmpeg
  chmod +x apps/web/bin/ffmpeg
  rm -rf "${ffmpeg_npm_dir}"
}

# FFmpeg binary is NOT committed to git (would exceed Netlify's 250 MB bundle limit).
# Provisioned here only when VIDEO_TRANSCODING_ENABLED=true.
# We deliberately do NOT bundle ffprobe — video dimensions are read by parsing
# `ffmpeg -i` stderr instead, which keeps the BG function under the 250 MB cap.
# Local dev: set FFMPEG_PATH in apps/web/.env.local.
if [ "${VIDEO_TRANSCODING_ENABLED}" = "true" ]; then
  echo "🎞️ Preparing FFmpeg binary for adaptive video transcoding..."
  mkdir -p apps/web/bin

  if [ -x apps/web/bin/ffmpeg ]; then
    echo "✅ Existing FFmpeg binary found; skipping install."
  else
    if ! copy_ffmpeg_from_path && ! install_ffmpeg_from_npm; then
      echo "❌ Unable to provision FFmpeg without root access."
      exit 2
    fi
  fi

  # Strip debug symbols when supported by the installed binary; no-op otherwise.
  strip apps/web/bin/ffmpeg 2>/dev/null || true
  echo "✅ FFmpeg binary ready — size:"
  ls -lh apps/web/bin/ffmpeg
  apps/web/bin/ffmpeg -version | head -1
  du -sh apps/web/bin
else
  echo "ℹ️ VIDEO_TRANSCODING_ENABLED is not set — skipping FFmpeg provisioning."
fi

# Ensure TypeScript is available for building packages
# Netlify doesn't install devDependencies in production, so we need to install TypeScript
echo "📦 Installing TypeScript for package builds..."
# Temporarily set NODE_ENV to development to ensure devDependencies are available
export NODE_ENV=development
npm install typescript@^5.3.3 --save-dev --no-save
export NODE_ENV=production

# Build shared packages first
echo "📦 Building @aprende-y-aplica/shared package..."
npm run build --workspace=@aprende-y-aplica/shared

echo "📦 Building @aprende-y-aplica/ui package..."
npm run build --workspace=@aprende-y-aplica/ui

# Build the web app
echo "🌐 Building Next.js web app..."
npm run build --workspace=apps/web

echo "✅ Build completed successfully!"
