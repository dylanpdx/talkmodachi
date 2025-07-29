from flask import Flask, request, jsonify, send_file
from io import BytesIO
import citra,utils
from flask_cors import CORS
import newSongConverter

if __name__ != '__main__':
    citra.CITRA_PORT = utils.findFreePort()

import tts

app = Flask(__name__)
CORS(app)

def sing():
    # get body
    data = request.get_json()
    if not data or 'notes' not in data or data['notes'] is None:
        return jsonify({'error': 'Missing notes parameter'}), 400 # todo update this
    
    pitch = int(request.args.get('pitch', 50))
    speed = int(request.args.get('speed', 50))
    quality = int(request.args.get('quality', 50))
    tone = int(request.args.get('tone', 50))
    accent = int(request.args.get('accent', 50))
    intonation = int(request.args.get('intonation', 1))

    data = newSongConverter.convertSongToTTS(data)

    try:
        if __name__ != '__main__':
            romName = 'EU' if data['lang'] == 'eueng' else 'US'
            tts.startEmulator(romName)

        audio_data = tts.generateText(data, pitch, speed, quality, tone, accent, intonation)
        audio_buffer = BytesIO(audio_data)
        audio_buffer.seek(0)
        
        # Return the audio file
        return send_file(
            audio_buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='speech.wav'
        )
    except Exception as e:
        return "error",500
    finally:
        if __name__ != '__main__':
            tts.killEmulator()

@app.route('/tts', methods=['GET','POST'])
def text_to_speech():

    if request.method == 'POST':
        return sing() # Bypass default TTS and use sing function

    data = {
        'text': request.args.get('text', None),
        'pitch': request.args.get('pitch', 50),
        'speed': request.args.get('speed', 50),
        'quality': request.args.get('quality', 50),
        'tone': request.args.get('tone', 50),
        'accent': request.args.get('accent', 50),
        'intonation': request.args.get('intonation', 1),
        'lang': request.args.get('lang', 'useng')  # Default to US English
    }
    
    if not data or 'text' not in data or data['text'] is None:
        return jsonify({'error': 'Missing text parameter'}), 400
    if len(data['text']) > 2000:
        return jsonify({'error': 'Text too long'}), 400
    text = data['text'].replace('\n', '')
    
    # Extract voice parameters (with defaults if not provided)
    pitch = int(data.get('pitch', 50))
    speed = int(data.get('speed', 50))
    quality = int(data.get('quality', 50))
    tone = int(data.get('tone', 50))
    accent = int(data.get('accent', 50))
    intonation = int(data.get('intonation', 1))
    
    # Validate
    if not (0 <= pitch <= 100 and 0 <= speed <= 100 and 0 <= quality <= 100 and 
            0 <= tone <= 100 and 0 <= accent <= 100 and intonation in [1, 2, 3, 4]):
        return jsonify({'error': 'Invalid parameter values'}), 400
    intonation = intonation - 1 # convert to 0-based index

    if data['lang'] not in ['useng', 'eueng']:
        return jsonify({'error': 'Invalid language specified'}), 400

    formatted_text = text
    if __name__ != '__main__':
        romName = 'EU' if data['lang'] == 'eueng' else 'US'
        tts.startEmulator(romName)
    try:
        audio_data = None
        if "<lyric" not in text:
            # Generate audio from text using the tts module
            audio_data = tts.generateText(formatted_text, pitch, speed, quality, tone, accent, intonation)
        else:
            formatted_text = formatted_text.replace("\n","").replace("\t","").strip()
            audio_data = tts.singText(formatted_text, pitch, speed, quality, tone, accent, intonation)

        # Create a BytesIO object to serve the audio data
        audio_buffer = BytesIO(audio_data)
        audio_buffer.seek(0)
        
        # Return the audio file
        return send_file(
            audio_buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='speech.wav'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if __name__ != '__main__':
            tts.killEmulator()

if __name__ == '__main__':
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=False)