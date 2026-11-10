import os
import subprocess
import tempfile
from flask import send_file, jsonify
from io import BytesIO


jarname = "talkmodachi-miitomo.jar"

def ttsMiitomo(text,lang,pitch,speed,quality,tone,accent,intonation):
    fd, out_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    try:
        res = subprocess.run(["java","-jar",jarname,lang,out_path,text,
                              str(pitch),str(speed),str(quality),str(tone),str(accent),str(intonation)],timeout=30,cwd="/app")
        if res.returncode != 0:
            return jsonify({'error': 'miitomo returned fail'}), 500

        with open(out_path, "rb") as f:
            audio_data = f.read()

        return send_file(BytesIO(audio_data), mimetype='audio/wav',
                         as_attachment=True, download_name='speech.wav')
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'timeout'}), 500
    finally:
        os.remove(out_path)