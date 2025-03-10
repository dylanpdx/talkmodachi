from flask import Flask, request, jsonify, send_file
from io import BytesIO
import time
import tts
from flask_cors import CORS

def formatCommandP(commandCode,param):
    commandCode = int(commandCode)
    param = int(param)
    return f"\x1b\\mrk={commandCode}{param:>07}\\"

def formatCommand(commandCode):
    commandCode = int(commandCode)
    return f"\x1b\\mrk={commandCode}\\"

app = Flask(__name__)
CORS(app)


@app.route('/tts', methods=['POST'])
def text_to_speech():
    """
    API endpoint that converts text to speech.
    
    Expected JSON payload:
    {
        "text": "Text to convert to speech",
        "pitch": 50,         # Optional: 0 to 100
        "speed": 50,         # Optional: 0 to 100
        "quality": 50,       # Optional: 0 to 100
        "tone": 50,          # Optional: 0 to 100
        "accent": 50,        # Optional: 0 to 100
        "intonation": 1       # Optional: 1, 2, 3, or 4
    }
    
    Returns:
    - Audio file in WAV format
    """
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing text parameter'}), 400
    
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

    formatted_text = text
    try:
        # Generate audio from text using the tts module
        audio_data = tts.generateText(formatted_text, pitch, speed, quality, tone, accent, intonation)

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

if __name__ == '__main__':
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=False)