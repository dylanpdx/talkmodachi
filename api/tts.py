import citra
import time
import utils

emu = citra.Citra()
from pydub import AudioSegment
import songConverter
import struct
import subprocess
import os
'''
Status codes:
1 - Emulator is waiting for text
2 - Emulator is processing/generating audio
3 - Emulator finished generating audio and the data is ready
4 - Error
5 - Script has sent over the text data (set after code 1)
'''

# Lazy way to store data the game needs; these memory addresses aren't used by the game (hopefully)
audioRenderJobAddr=0x00af340d
textDataAddr=0x00b27daa
emulatorProcess = None

def readJob():
    structDef = "BBBBBBBBBiIiB"
    structSize = struct.calcsize(structDef)
    data = emu.read_memory(audioRenderJobAddr,structSize)
    unpacked = struct.unpack(structDef,data)
    return {
        "status": unpacked[0],
        "bpm": unpacked[1],
        "stretch": unpacked[2],
        "pitch": unpacked[3],
        "speed": unpacked[4],
        "quality": unpacked[5],
        "tone": unpacked[6],
        "accent": unpacked[7],
        "intonation": unpacked[8],
        "audioSize": unpacked[9],
        "audioData": unpacked[10],
        "allocatedSize": unpacked[11],
        "songDataSize": unpacked[12]
    }

def writeJobRaw(job,songData=None):
    structDef = "BBBBBBBBBiIiB"
    structSize = struct.calcsize(structDef)
    data = struct.pack(structDef,job["status"],job["bpm"],job["stretch"],job["pitch"],job["speed"],job["quality"],job["tone"],job["accent"],job["intonation"],job["audioSize"],job["audioData"],job["allocatedSize"],job["songDataSize"])
    emu.write_memory(audioRenderJobAddr,data)
    if songData is not None:
        emu.write_memory(audioRenderJobAddr+structSize,songData)

def calcFileLength(bytes):
    fLen = len(bytes)
    return fLen / (16000*2)

def waitForStatus(stat, timeout=60):
    current=-1
    start_time = time.time()
    while current != stat:
        time.sleep(0.1)
        current = emu.read_memory(audioRenderJobAddr,1)[0]
        if time.time() - start_time > timeout:
            raise TimeoutError(f"Timed out waiting for status {stat}")

def startEmulator(romname='US'):
    global emulatorProcess

    # create /tmp/user directory if it doesn't exist
    if not os.path.exists("/tmp/user"):
        os.makedirs("/tmp/user/config")
        with open("/config/sdl2-config.ini", "rb") as f:
            with open("/tmp/user/config/sdl2-config.ini", "wb") as f2:
                f2.write(f.read())

    emulatorProcess = subprocess.Popen(['citra', f'/opt/{romname}.cxi', '-u',str(citra.CITRA_PORT)],cwd="/tmp")
    connected = False
    while not connected:
        try:
            waitForStatus(1)
            connected = True
        except TimeoutError:
            pass

def killEmulator():
    global emulatorProcess
    if emulatorProcess is not None:
        emulatorProcess.kill()
        emulatorProcess.wait()
        emulatorProcess = None

def writeJob(bpm,stretch,pitch,speed,quality,tone,accent,intonation,songData):
    writeJobRaw({
        "status": 1,
        "bpm": bpm,
        "stretch": stretch,
        "pitch": pitch,
        "speed": speed,
        "quality": quality,
        "tone": tone,
        "accent": accent,
        "intonation": intonation,
        "audioSize": 0,
        "audioData": 0,
        "allocatedSize": 0,
        "songDataSize": len(songData) if songData is not None else 0
    },songData)

def sendLyric(lyric,pitch=50,speed=50,quality=50,tone=50,accent=50,intonation=0):
    songData = songConverter.convertLyricParams(lyric["params"])
    sendText(lyric["data"],reset=False,pitch=pitch,speed=speed,quality=quality,tone=tone,accent=accent,intonation=intonation,songData=songData,bpm=lyric["bpm"],stretch=lyric["stretch"])

def sendText(text,reset=True,pitch=50,speed=50,quality=50,tone=50,accent=50,intonation=0,songData=None,bpm=120,stretch=50):
    #if reset:
    #    text=text+"\x1b\\mrk=1\\"

    text = text.replace("<bleep>","\x1b\\mrk=6\\").replace("</bleep>","\x1b\\mrk=7\\")
    text = text.replace("<echo>","\x1b\\mrk=4\\").replace("</echo>","\x1b\\mrk=5\\")
    text=text+"\0"
    emu.write_memory(textDataAddr,text.encode('utf-16le'))

    writeJob(bpm,stretch,pitch,speed,quality,tone,accent,intonation,songData) # default values

    emu.write_memory(audioRenderJobAddr,b"\x05") # set status to 5

def convertDataToMp3(data):
    # convert the data to wav
    # signed 16 bit PCM, 16000 Hz, mono -> wav
    audio = AudioSegment(data, sample_width=2, frame_rate=16000, channels=1)
    #return wav bytes

    data = audio.export(format="wav").read() # TODO: mp3?

    return data

def readDebugData():
    debugLoc = 0x004110f0
    debugSize = emu.read_memory(debugLoc,4)
    debugSize = int.from_bytes(debugSize,"little")
    debugData = emu.read_memory(debugLoc+4,debugSize)
    text = debugData.decode('utf-16le').replace("\x1b","*")
    print("Debug data: "+text)

def readRenderedAudio():
    job = readJob()
    data = emu.read_memory(job["audioData"],job["audioSize"])
    return data

def singText(text,pitch=50,speed=50,quality=50,tone=50,accent=50,intonation=0):
    lyrics = songConverter.parseSong(text)
    fullData=b""
    for lyric in lyrics:
        waitForStatus(1)
        sendLyric(lyric,pitch=pitch,speed=speed,quality=quality,tone=tone,accent=accent,intonation=intonation)
        waitForStatus(3)
        #readDebugData()

        data = readRenderedAudio()
        fullData+=data

        emu.write_memory(audioRenderJobAddr,b"\x01") # set status to 1

    print("Length: "+str(calcFileLength(fullData))+"s")
    return convertDataToMp3(fullData)

def generateText(text,pitch=50,speed=50,quality=50,tone=50,accent=50,intonation=0):
    waitForStatus(1)
    sendText(text,pitch=pitch,speed=speed,quality=quality,tone=tone,accent=accent,intonation=intonation)
    waitForStatus(3)

    data = readRenderedAudio()

    emu.write_memory(audioRenderJobAddr,b"\x01") # set status to 1

    print("Length: "+str(calcFileLength(data))+"s")
    
    return convertDataToMp3(data)