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
        "pitch": 0.5,         # Optional: 0 to 1
        "speed": 0.5,         # Optional: 0 to 1
        "quality": 0.5,       # Optional: 0 to 1
        "tone": 0.5,          # Optional: 0 to 1
        "accent": 0.5,        # Optional: 0 to 1
        "intonation": 1       # Optional: 1, 2, 3, or 4
    }
    
    Returns:
    - Audio file in WAV format
    """
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing text parameter'}), 400
    
    text = data['text']
    
    # Extract voice parameters (with defaults if not provided)
    pitch = float(data.get('pitch', 0.5))
    speed = float(data.get('speed', 0.5))
    quality = float(data.get('quality', 0.5))
    tone = float(data.get('tone', 0.5))
    accent = float(data.get('accent', 0.5))
    intonation = int(data.get('intonation', 1))
    
    # Validate
    if not (0 <= pitch <= 1 and 0 <= speed <= 1 and 0 <= quality <= 1 and 
            0 <= tone <= 1 and 0 <= accent <= 1 and intonation in [1, 2, 3, 4]):
        return jsonify({'error': 'Invalid parameter values'}), 400
    
    # Remap pitches; TODO: make this to match ingame sliders
    pitch = int(pitch / 0.0001)
    tone = int(tone * 10000)
    quality = int(quality / 0.0001)
    accent = int(accent / 0.0001)

    formatted_text = formatCommand(1)+formatCommandP(1,pitch)+formatCommandP(2,tone)+formatCommandP(5,quality)+formatCommandP(6,accent)+text
    
    try:
        # Generate audio from text using the tts module
        audio_data = tts.generateText(formatted_text)
        
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