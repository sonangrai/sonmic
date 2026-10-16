import shutil
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import yt_dlp
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from starlette.background import BackgroundTask

ALLOWED_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
}

app = FastAPI(title="sonmic backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


class DownloadRequest(BaseModel):
    url: HttpUrl


def validate_youtube_url(url: str) -> None:
    host = urlparse(url).hostname or ""
    if host not in ALLOWED_HOSTS:
        raise HTTPException(status_code=400, detail="Only YouTube URLs are supported")


def download_audio(url: str) -> tuple[Path, str]:
    """Download the best audio stream into a fresh temp dir. Returns (file path, title)."""
    tmp_dir = Path(tempfile.mkdtemp(prefix="sonmic-"))
    opts = {
        # Prefer YouTube's AAC stream as-is (no re-encode); fall back if a video lacks one.
        "format": "bestaudio[ext=m4a]/bestaudio/best",
        "outtmpl": str(tmp_dir / "%(id)s.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
    except yt_dlp.utils.DownloadError as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(status_code=422, detail=f"Could not download audio: {e}") from e

    files = list(tmp_dir.iterdir())
    if not files:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Download produced no file")

    return files[0], info.get("title") or info["id"]


@app.get("/health")
def health():
    return {"status": "ok"}


# Sync handler: FastAPI runs it in a threadpool, so the blocking yt-dlp call doesn't stall the event loop.
@app.post("/download")
def download(req: DownloadRequest):
    url = str(req.url)
    validate_youtube_url(url)

    path, title = download_audio(url)
    safe_title = "".join(c for c in title if c not in '\\/:*?"<>|').strip() or "audio"

    return FileResponse(
        path,
        filename=f"{safe_title}{path.suffix}",
        media_type="application/octet-stream",
        background=BackgroundTask(shutil.rmtree, path.parent, ignore_errors=True),
    )
