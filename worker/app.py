from __future__ import annotations

import json
import os
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg
from flask import Flask, jsonify, request, send_file

app = Flask(__name__)
MAX_BYTES = 25 * 1024 * 1024
ALLOWED = {"video/mp4", "video/quicktime", "video/webm", "video/x-m4v"}


def _validate_upload():
    upload = request.files.get("file")
    if not upload or not upload.filename:
        return None, (jsonify({"error": "Falta el archivo de vídeo."}), 400)
    if upload.mimetype not in ALLOWED:
        return None, (jsonify({"error": "Formato no admitido. Usa MP4, MOV, M4V o WebM."}), 400)
    upload.stream.seek(0, os.SEEK_END)
    size = upload.stream.tell()
    upload.stream.seek(0)
    if size <= 0 or size > MAX_BYTES:
        return None, (jsonify({"error": "El vídeo debe pesar entre 1 byte y 25 MB."}), 400)
    return upload, None


def _probe(source: Path, ffmpeg: str):
    completed = subprocess.run([ffmpeg, "-hide_banner", "-i", str(source), "-f", "null", "-"], capture_output=True, text=True, timeout=60)
    stderr = completed.stderr or ""
    duration = None
    import re
    match = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", stderr)
    if match:
        duration = int(match.group(1))*3600 + int(match.group(2))*60 + float(match.group(3))
    video = re.search(r"Video:.*?,\s*(\d+)x(\d+)", stderr)
    audio = "Audio:" in stderr
    return {"durationSeconds": duration, "width": int(video.group(1)) if video else None, "height": int(video.group(2)) if video else None, "hasAudio": audio}


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "nexo-content-worker", "kit": "05", "pipeline": "foundation"})


@app.post("/analyze")
def analyze_video():
    upload, error = _validate_upload()
    if error:
        return error
    with tempfile.TemporaryDirectory(prefix="nexo-content-analysis-") as temp_dir:
        source = Path(temp_dir) / "entrada"
        upload.save(source)
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        probe = _probe(source, ffmpeg)
        duration = probe["durationSeconds"]
        # Kit 05 contract: analysis is explicit and never invents transcript/cuts.
        return jsonify({
            "ok": True,
            "source": probe,
            "steps": [
                {"id": 1, "name": "Transcripción palabra a palabra", "status": "needs-model", "evidence": "No se inventa transcripción sin motor STT."},
                {"id": 2, "name": "Plan de cortes", "status": "blocked-by-transcript", "evidence": "Los cortes semánticos requieren transcripción real."},
                {"id": 3, "name": "Encuadre", "status": "ready", "evidence": f"Fuente detectada: {probe['width']}x{probe['height']}."},
                {"id": 4, "name": "Vertical 9:16", "status": "ready", "evidence": "El worker puede producir 1080x1920."},
                {"id": 5, "name": "Subtítulos karaoke", "status": "blocked-by-transcript", "evidence": "Necesita timestamps palabra a palabra."},
                {"id": 6, "name": "Rótulos y zooms", "status": "planned", "evidence": "Se aplicarán desde un edit plan trazable."},
                {"id": 7, "name": "Composición", "status": "planned", "evidence": "Se ejecutará después de aprobar el edit plan."},
                {"id": 8, "name": "Audio -14 LUFS", "status": "ready" if probe['hasAudio'] else "not-applicable", "evidence": "Se detectó audio." if probe['hasAudio'] else "La fuente no expone pista de audio."},
                {"id": 9, "name": "Exportación", "status": "ready", "evidence": "H.264/AAC MP4 con faststart."},
            ],
            "durationSeconds": duration,
            "truthPolicy": "Sin transcripción real no se generan texto, cortes ni subtítulos ficticios."
        })


@app.post("/process")
def process_video():
    upload, error = _validate_upload()
    if error:
        return error
    with tempfile.TemporaryDirectory(prefix="nexo-content-") as temp_dir:
        root = Path(temp_dir)
        source = root / "entrada"
        output = root / "nexo-vertical.mp4"
        upload.save(source)
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        command = [
            ffmpeg, "-y", "-i", str(source),
            "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
            "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
            "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(output),
        ]
        completed = subprocess.run(command, capture_output=True, text=True, timeout=180)
        if completed.returncode != 0 or not output.exists():
            detail = completed.stderr[-1200:] if completed.stderr else "ffmpeg no produjo salida"
            return jsonify({"error": "No se pudo procesar el vídeo.", "detail": detail}), 500
        return send_file(output, mimetype="video/mp4", as_attachment=True, download_name="nexo-vertical.mp4")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "10000")))
