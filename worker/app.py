from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg
from flask import Flask, jsonify, request, send_file

app = Flask(__name__)
MAX_BYTES = 25 * 1024 * 1024
ALLOWED = {"video/mp4", "video/quicktime", "video/webm", "video/x-m4v"}

@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "nexo-content-worker"})

@app.post("/process")
def process_video():
    upload = request.files.get("file")
    if not upload or not upload.filename:
        return jsonify({"error": "Falta el archivo de vídeo."}), 400
    if upload.mimetype not in ALLOWED:
        return jsonify({"error": "Formato no admitido. Usa MP4, MOV, M4V o WebM."}), 400

    upload.stream.seek(0, os.SEEK_END)
    size = upload.stream.tell()
    upload.stream.seek(0)
    if size <= 0 or size > MAX_BYTES:
        return jsonify({"error": "El vídeo debe pesar entre 1 byte y 25 MB."}), 400

    with tempfile.TemporaryDirectory(prefix="nexo-content-") as temp_dir:
        root = Path(temp_dir)
        source = root / "entrada"
        output = root / "nexo-vertical.mp4"
        upload.save(source)

        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        command = [
            ffmpeg,
            "-y",
            "-i", str(source),
            "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "160k",
            "-movflags", "+faststart",
            str(output),
        ]
        completed = subprocess.run(command, capture_output=True, text=True, timeout=180)
        if completed.returncode != 0 or not output.exists():
            detail = completed.stderr[-1200:] if completed.stderr else "ffmpeg no produjo salida"
            return jsonify({"error": "No se pudo procesar el vídeo.", "detail": detail}), 500

        return send_file(
            output,
            mimetype="video/mp4",
            as_attachment=True,
            download_name="nexo-vertical.mp4",
        )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "10000")))
