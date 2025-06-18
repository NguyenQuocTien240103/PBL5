from fastapi import APIRouter,Request,HTTPException, status
import os
from fastapi.responses import FileResponse
from fastapi.responses import StreamingResponse
router = APIRouter()


@router.get("/videos")
def list_videos():
    VIDEO_DIR = os.path.join(os.path.dirname(__file__), '../../videos')
    if not os.path.exists(VIDEO_DIR):
        raise HTTPException(status_code=404, detail="Video directory not found")
    return [f for f in os.listdir(VIDEO_DIR) if f.endswith(".mp4")]


@router.get("/get-video/{filename}")
def get_video(filename: str, request: Request):
    VIDEO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../videos'))
    file_path = os.path.join(VIDEO_DIR, filename)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Video not found")

    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("range")

    def iterfile(start=0):
        with open(file_path, "rb") as f:
            f.seek(start)
            while chunk := f.read(1024 * 1024):
                yield chunk

    if range_header:
        start = int(range_header.replace("bytes=", "").split("-")[0])
        end = file_size - 1
        content_length = end - start + 1
        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(content_length),
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Resource-Policy": "cross-origin",
        }
        return StreamingResponse(iterfile(start=start), status_code=206, headers=headers, media_type="video/mp4")
    else:
        headers = {
            "Content-Length": str(file_size),
            "Accept-Ranges": "bytes",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Resource-Policy": "cross-origin",
        }
        return StreamingResponse(iterfile(), headers=headers, media_type="video/mp4")