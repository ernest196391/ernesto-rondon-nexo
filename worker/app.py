from __future__ import annotations

import hmac
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg
from flask import Flask, jsonify, request, send_file

app = Flask(__name__)
MAX_BYTES = 25 * 1024 * 1024
ALLOWED = {"video/mp4", "video/quicktime", "video/webm", "video/x-m4v"}


@app.before_request
def protect_worker():
    if request.path == "/health":
        return None
    expected = os.environ.get("CONTENT_WORKER_SECRET", "")
    supplied = request.headers.get("x-nexo-worker-key", "")
    if not expected or not supplied or not hmac.compare_digest(expected, supplied):
        return jsonify({"error": "Unauthorized worker request."}), 401
    return None


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
    match = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", stderr)
    if match:
        duration = int(match.group(1))*3600 + int(match.group(2))*60 + float(match.group(3))
    video = re.search(r"Video:.*?,\s*(\d+)x(\d+)", stderr)
    return {"durationSeconds": duration, "width": int(video.group(1)) if video else None, "height": int(video.group(2)) if video else None, "hasAudio": "Audio:" in stderr}


def _ass_time(seconds: float) -> str:
    seconds = max(0.0, seconds)
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def _escape_ass(text: str) -> str:
    return text.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}").replace("\n", " ")


def _normalize_plan(raw: dict, duration: float | None):
    cuts = raw.get("cuts") or []
    words = raw.get("words") or []
    safe_cuts = []
    for item in cuts[:60]:
        try:
            start = max(0.0, float(item["start"]))
            end = float(item["end"])
        except (KeyError, TypeError, ValueError):
            continue
        if end <= start or end - start < 0.2:
            continue
        if duration is not None:
            end = min(end, duration)
        safe_cuts.append({"start": start, "end": end})
    safe_cuts.sort(key=lambda x: x["start"])
    if not safe_cuts and duration:
        safe_cuts = [{"start": 0.0, "end": duration}]
    safe_words = []
    for item in words[:5000]:
        try:
            start, end = float(item["start"]), float(item["end"])
            text = str(item["word"]).strip()
        except (KeyError, TypeError, ValueError):
            continue
        if text and end > start >= 0:
            safe_words.append({"word": text, "start": start, "end": end})
    return safe_cuts, safe_words


def _map_time(original: float, cuts: list[dict]) -> float | None:
    out = 0.0
    for cut in cuts:
        if cut["start"] <= original <= cut["end"]:
            return out + (original - cut["start"])
        out += cut["end"] - cut["start"]
    return None


def _write_ass(path: Path, words: list[dict], cuts: list[dict]):
    mapped = []
    for word in words:
        start = _map_time(word["start"], cuts)
        end = _map_time(word["end"], cuts)
        if start is not None and end is not None and end > start:
            mapped.append({"word": word["word"], "start": start, "end": end})
    header = """[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\n\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: Nexo,Arial,62,&H00FFFFFF,&H0000D7FF,&H00111111,&H64000000,-1,0,0,0,100,100,0,0,1,4,0,2,80,80,180,1\n\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n"""
    lines = [header]
    for i in range(0, len(mapped), 5):
        group = mapped[i:i+5]
        if not group:
            continue
        parts = []
        for item in group:
            cs = max(1, int(round((item["end"] - item["start"]) * 100)))
            parts.append(f"{{\\k{cs}}}{_escape_ass(item['word'])}")
        lines.append(f"Dialogue: 0,{_ass_time(group[0]['start'])},{_ass_time(group[-1]['end'])},Nexo,,0,0,0,,{' '.join(parts)}\n")
    path.write_text("".join(lines), encoding="utf-8")


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "nexo-content-worker", "kit": "05", "pipeline": "approved-edit-plan", "protected": True})


@app.post("/analyze")
def analyze_video():
    upload, error = _validate_upload()
    if error: return error
    with tempfile.TemporaryDirectory(prefix="nexo-content-analysis-") as temp_dir:
        source = Path(temp_dir) / "entrada"
        upload.save(source)
        probe = _probe(source, imageio_ffmpeg.get_ffmpeg_exe())
        return jsonify({"ok": True, "source": probe, "steps": [
            {"id": 1, "name": "Transcripción palabra a palabra", "status": "ready-via-api", "evidence": "NEXO puede solicitar STT real bajo acción explícita."},
            {"id": 2, "name": "Plan de cortes", "status": "ready-after-transcript", "evidence": "Se construye desde pausas reales y requiere aprobación."},
            {"id": 3, "name": "Encuadre", "status": "ready", "evidence": f"Fuente detectada: {probe['width']}x{probe['height']}."},
            {"id": 4, "name": "Vertical 9:16", "status": "ready", "evidence": "Salida 1080x1920."},
            {"id": 5, "name": "Subtítulos karaoke", "status": "ready-after-transcript", "evidence": "Se generan desde timestamps por palabra aprobados."},
            {"id": 6, "name": "Rótulos y zooms", "status": "planned", "evidence": "Capa creativa posterior al MVP trazable."},
            {"id": 7, "name": "Composición", "status": "ready-after-approval", "evidence": "El worker renderiza cortes aprobados + captions."},
            {"id": 8, "name": "Audio -14 LUFS", "status": "ready" if probe['hasAudio'] else "not-applicable", "evidence": "Normalización EBU-style con loudnorm."},
            {"id": 9, "name": "Exportación", "status": "ready", "evidence": "H.264/AAC MP4 con faststart."}],
            "truthPolicy": "NEXO solo renderiza texto y cortes procedentes de evidencia real y aprobación explícita."})


@app.post("/render")
def render_approved_plan():
    upload, error = _validate_upload()
    if error: return error
    try:
        plan = json.loads(request.form.get("plan") or "{}")
    except json.JSONDecodeError:
        return jsonify({"error": "El edit plan no es JSON válido."}), 400
    if plan.get("approved") is not True:
        return jsonify({"error": "El edit plan debe estar aprobado antes de renderizar."}), 400
    with tempfile.TemporaryDirectory(prefix="nexo-content-render-") as temp_dir:
        root = Path(temp_dir); source = root / "entrada"; output = root / "nexo-editado.mp4"; ass = root / "captions.ass"
        upload.save(source)
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe(); probe = _probe(source, ffmpeg)
        cuts, words = _normalize_plan(plan, probe["durationSeconds"])
        if not cuts: return jsonify({"error": "No hay segmentos válidos para renderizar."}), 400
        _write_ass(ass, words, cuts)
        vf_parts = []; af_parts = []
        for idx, cut in enumerate(cuts):
            vf_parts.append(f"[0:v]trim=start={cut['start']}:end={cut['end']},setpts=PTS-STARTPTS,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[v{idx}]")
            if probe["hasAudio"]: af_parts.append(f"[0:a]atrim=start={cut['start']}:end={cut['end']},asetpts=PTS-STARTPTS[a{idx}]")
        if probe["hasAudio"]:
            inputs = "".join(f"[v{i}][a{i}]" for i in range(len(cuts)))
            filter_complex = ";".join(vf_parts + af_parts + [f"{inputs}concat=n={len(cuts)}:v=1:a=1[vcat][acat]", f"[vcat]subtitles='{ass.as_posix()}'[vout];[acat]loudnorm=I=-14:TP=-1.5:LRA=11[aout]"])
            maps = ["-map", "[vout]", "-map", "[aout]"]
        else:
            inputs = "".join(f"[v{i}]" for i in range(len(cuts)))
            filter_complex = ";".join(vf_parts + [f"{inputs}concat=n={len(cuts)}:v=1:a=0[vcat]", f"[vcat]subtitles='{ass.as_posix()}'[vout]"])
            maps = ["-map", "[vout]"]
        command = [ffmpeg, "-y", "-i", str(source), "-filter_complex", filter_complex, *maps, "-c:v", "libx264", "-preset", "veryfast", "-crf", "23"]
        if probe["hasAudio"]: command += ["-c:a", "aac", "-b:a", "160k"]
        command += ["-movflags", "+faststart", str(output)]
        completed = subprocess.run(command, capture_output=True, text=True, timeout=240)
        if completed.returncode != 0 or not output.exists():
            return jsonify({"error": "No se pudo renderizar el edit plan.", "detail": (completed.stderr or "")[-1400:]}), 500
        return send_file(output, mimetype="video/mp4", as_attachment=True, download_name="nexo-editado.mp4")


@app.post("/process")
def process_video():
    upload, error = _validate_upload()
    if error: return error
    with tempfile.TemporaryDirectory(prefix="nexo-content-") as temp_dir:
        root = Path(temp_dir); source = root / "entrada"; output = root / "nexo-vertical.mp4"
        upload.save(source); ffmpeg = imageio_ffmpeg.get_ffmpeg_exe(); probe = _probe(source, ffmpeg)
        command = [ffmpeg, "-y", "-i", str(source), "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"]
        if probe["hasAudio"]: command += ["-af", "loudnorm=I=-14:TP=-1.5:LRA=11"]
        command += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "23"]
        if probe["hasAudio"]: command += ["-c:a", "aac", "-b:a", "160k"]
        command += ["-movflags", "+faststart", str(output)]
        completed = subprocess.run(command, capture_output=True, text=True, timeout=180)
        if completed.returncode != 0 or not output.exists():
            return jsonify({"error": "No se pudo procesar el vídeo.", "detail": (completed.stderr or "")[-1200:]}), 500
        return send_file(output, mimetype="video/mp4", as_attachment=True, download_name="nexo-vertical.mp4")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "10000")))
