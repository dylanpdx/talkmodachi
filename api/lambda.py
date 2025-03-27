import sys
import json
import tts
import base64
from io import BytesIO

#UNUSED

def handler(event, context):
    if "body" not in event:
        return {
            "statusCode": 400,
            "body": "Bad Request"
        }
    
    data = json.loads(event["body"])

    if "text" not in data:
        return {
            "statusCode": 400,
            "body": "Bad Request"
        }

    text = data["text"].replace('\n', '')
    pitch = int(data.get('pitch', 50))
    speed = int(data.get('speed', 50))
    quality = int(data.get('quality', 50))
    tone = int(data.get('tone', 50))
    accent = int(data.get('accent', 50))
    intonation = int(data.get('intonation', 1))

    if not (0 <= pitch <= 100 and 0 <= speed <= 100 and 0 <= quality <= 100 and 
            0 <= tone <= 100 and 0 <= accent <= 100 and intonation in [1, 2, 3, 4]):
        return {
            "statusCode": 400,
            "body": "Bad Request"
        }
    intonation = intonation - 1 # convert to 0-based index

    formatted_text = text
    try:
        tts.startEmulator()
        audio_data = None
        if "<lyric" not in text:
            # Generate audio from text using the tts module
            audio_data = tts.generateText(formatted_text, pitch, speed, quality, tone, accent, intonation)
        else:
            formatted_text = formatted_text.replace("\n","").replace("\t","").strip()
            audio_data = tts.singText(formatted_text, pitch, speed, quality, tone, accent, intonation)
        tts.killEmulator()
        # Create a BytesIO object to serve the audio data
        audio_buffer = BytesIO(audio_data)
        audio_buffer.seek(0)
        
        # Return the audio file
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "audio/wav"
            },
            "body": base64.b64encode(audio_data).decode("utf-8"),
            "isBase64Encoded": True
        }
        
    except Exception as e:
        return "Internal Server Error"