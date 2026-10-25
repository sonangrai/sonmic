import os
import shutil
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import yt_dlp
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, HttpUrl
from starlette.background import BackgroundTask

import auth

ALLOWED_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
}

# Thumbnails are only fetched from YouTube's image hosts, so /thumbnail can't be used
# to make the server request arbitrary addresses.
THUMBNAIL_HOST_SUFFIX = ".ytimg.com"
MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024

# Websites allowed to call this API from a browser. Set in backend/.env (see .env.example).
ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

# The API is reachable by anyone who has the tunnel address, so cap what one request can cost.
MAX_DURATION_SECONDS = int(os.environ.get("MAX_DURATION_SECONDS", 30 * 60))
MAX_FILESIZE_BYTES = int(os.environ.get("MAX_FILESIZE_MB", 150)) * 1024 * 1024

# Optional proxy for reaching YouTube, e.g. when hosted on a cloud IP that YouTube blocks.
YTDLP_PROXY = os.environ.get("YTDLP_PROXY", "").strip() or None

app = FastAPI(title="sonmic backend")
auth.init_db()
app.include_router(auth.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Disposition", "X-Thumbnail-Url"],
)


class DownloadRequest(BaseModel):
    url: HttpUrl


def validate_youtube_url(url: str) -> None:
    host = urlparse(url).hostname or ""
    if host not in ALLOWED_HOSTS:
        raise HTTPException(status_code=400, detail="Only YouTube URLs are supported")


def format_limit(seconds: int) -> str:
    return f"{seconds // 60} minutes" if seconds >= 120 else f"{seconds} seconds"


def download_audio(url: str) -> tuple[Path, str, str | None]:
    """Download the best audio stream into a fresh temp dir. Returns (file path, title, thumbnail URL)."""
    tmp_dir = Path(tempfile.mkdtemp(prefix="sonmic-"))
    opts = {
        # Prefer YouTube's AAC stream as-is (no re-encode); fall back if a video lacks one.
        "format": "bestaudio[ext=m4a]/bestaudio/best",
        "outtmpl": str(tmp_dir / "%(id)s.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        # YouTube needs a JS runtime to unlock formats; Node is already installed for the frontend.
        "js_runtimes": {"node": {}},
        "match_filter": yt_dlp.utils.match_filter_func(
            f"duration <= {MAX_DURATION_SECONDS} & !is_live"
        ),
        "max_filesize": MAX_FILESIZE_BYTES,
    }
    if YTDLP_PROXY:
        opts["proxy"] = YTDLP_PROXY
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
    except yt_dlp.utils.DownloadError as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(status_code=422, detail=f"Could not download audio: {e}") from e

    files = list(tmp_dir.iterdir())
    if not files:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        # match_filter and max_filesize skip silently instead of raising.
        if info and (info.get("is_live") or (info.get("duration") or 0) > MAX_DURATION_SECONDS):
            raise HTTPException(
                status_code=422,
                detail=f"Videos longer than {format_limit(MAX_DURATION_SECONDS)} and live streams aren't supported",
            )
        raise HTTPException(status_code=422, detail="This audio is too large to download")

    return files[0], info.get("title") or info["id"], info.get("thumbnail")


def fetch_thumbnail(src: str) -> tuple[bytes, str]:
    """Fetch a YouTube thumbnail (through the proxy, if set). Returns (image bytes, content type)."""
    parsed = urlparse(src)
    host = parsed.hostname or ""
    if parsed.scheme != "https" or not host.endswith(THUMBNAIL_HOST_SUFFIX):
        raise HTTPException(status_code=400, detail="Only YouTube thumbnails are supported")

    opts = {"quiet": True, "no_warnings": True, "socket_timeout": 15}
    if YTDLP_PROXY:
        opts["proxy"] = YTDLP_PROXY
    try:
        with yt_dlp.YoutubeDL(opts) as ydl, ydl.urlopen(src) as res:
            content_type = res.headers.get("Content-Type", "")
            data = res.read(MAX_THUMBNAIL_BYTES + 1)
    except yt_dlp.utils.YoutubeDLError as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch the thumbnail: {e}") from e

    if not content_type.startswith("image/") or len(data) > MAX_THUMBNAIL_BYTES:
        raise HTTPException(status_code=502, detail="The thumbnail isn't a usable image")
    return data, content_type


# Public on purpose: the app checks it before login to confirm the address is a sonmic backend.
@app.get("/health")
def health():
    return {"status": "ok", "app": "sonmic"}


# Sync handler: FastAPI runs it in a threadpool, so the blocking yt-dlp call doesn't stall the event loop.
@app.post("/download")
def download(req: DownloadRequest, _user: str = Depends(auth.current_user)):
    url = str(req.url)
    validate_youtube_url(url)

    path, title, thumbnail = download_audio(url)
    safe_title = "".join(c for c in title if c not in '\\/:*?"<>|').strip() or "audio"

    # The app fetches the image itself from /thumbnail; it's optional, so older apps ignore it.
    headers = {"X-Thumbnail-Url": thumbnail} if thumbnail else None
    return FileResponse(
        path,
        filename=f"{safe_title}{path.suffix}",
        media_type="application/octet-stream",
        headers=headers,
        background=BackgroundTask(shutil.rmtree, path.parent, ignore_errors=True),
    )


@app.get("/thumbnail")
def thumbnail(src: str, _user: str = Depends(auth.current_user)):
    data, content_type = fetch_thumbnail(src)
    return Response(data, media_type=content_type)
