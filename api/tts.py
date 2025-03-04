import citra
import time
emu = citra.Citra()
from pydub import AudioSegment

'''
Status codes:
1 - Emulator is waiting for text
2 - Emulator is processing/generating audio
3 - Emulator finished generating audio and the data is ready
4 - Error
5 - Script has sent over the text data (set after code 1)
'''

# Lazy way to store data the game needs; these memory addresses aren't used by the game (hopefully)
audioRenderJobAddr=0x008c00e4
textDataAddr=0x00b27daa

def calcFileLength(bytes):
    fLen = len(bytes)
    return fLen / (16000*2)

def waitForStatus(stat):
    current=-1
    while current != stat:
        time.sleep(0.1)
        current = emu.read_memory(audioRenderJobAddr,1)[0]

def sendText(text,reset=True):
    text=text+"\0"
    if reset:
        text="\x1b\\mrk=1\\"+text
    emu.write_memory(textDataAddr,text.encode('utf-8'))
    emu.write_memory(audioRenderJobAddr,b"\x05") # set status to 5

def convertDataToMp3(data):
    # convert the data to wav
    # signed 16 bit PCM, 16000 Hz, mono -> wav
    audio = AudioSegment(data, sample_width=2, frame_rate=16000, channels=1)
    #return wav bytes

    data = audio.export(format="wav").read() # TODO: mp3?

    return data

emu.write_memory(audioRenderJobAddr,b"\x01") # set status to 1

def generateText(text):
    waitForStatus(1)
    sendText(text)
    waitForStatus(3)

    datalen = int.from_bytes(emu.read_memory(audioRenderJobAddr+4,4),"little") # read length of data we generated
    dataPtr = int.from_bytes(emu.read_memory(audioRenderJobAddr+8,4),"little") # read pointer to data

    data = emu.read_memory(dataPtr,datalen) # read the actual data

    emu.write_memory(audioRenderJobAddr,b"\x01") # set status to 1

    print("Length: "+str(calcFileLength(data))+"s")
    
    return convertDataToMp3(data)