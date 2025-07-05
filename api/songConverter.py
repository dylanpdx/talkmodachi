import struct
from songParser import SongParser

# All notes supported by the engine
validNotes=["G1","G#1","A1","A#1","B1","C2","C#2","D2","D#2","E2","F2","F#2","G2","G#2","A2","A#2","B2","C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3","C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4","C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5","C6"]

noteBuffer=0

def parseSong(text):
    parser = SongParser()
    parser.feed(text)
    return parser.getSong()

def getTag(group,index,args):
    argsCount=len(args)+1
    data = struct.pack("HHHH",0x0E,group,index,argsCount)

    for arg in args:
        # convert the value to the format
        data+=struct.pack(arg["format"],int(arg["value"]))
    data += struct.pack("B",0xCD)+struct.pack("H",0x0A)

    return data

def convertNote(param):
    global noteBuffer
    nlen=1
    if "note" not in param:
        return None
    if "length" in param:
        nlen=int(param["length"])

    if param["note"] not in validNotes:
        return None
    # get note index
    noteIdx=validNotes.index(param["note"])

    tag= getTag(5,0,[
            {"format":"B","value":noteBuffer},
            {"format":"B","value":noteIdx},
            {"format":"B","value":nlen}
        ])
    noteBuffer+=1
    return tag

def convertStretch(param):
    if "mode" not in param:
        return None
    if param["mode"] not in ["vowel","top","last","word"]:
        return None
    intMode = 0
    if param["mode"]=="vowel":
        intMode=0
    elif param["mode"]=="top":
        intMode=1
    elif param["mode"]=="last":
        intMode=2
    elif param["mode"]=="word":
        intMode=3
    return getTag(12,14,[{"format":"B","value":intMode}])

def convertLenFirst(param):
    if "length" not in param:
        return None
    return getTag(12,15,[{"format":"b","value":param["length"]}])

def convertLenSecond(param):
    if "length" not in param:
        return None
    return getTag(12,16,[{"format":"b","value":param["length"]}])

def convertLenThird(param):
    if "length" not in param:
        return None
    return getTag(12,17,[{"format":"b","value":param["length"]}])

def convertLenFourth(param):
    if "length" not in param:
        return None
    return getTag(12,18,[{"format":"b","value":param["length"]}])

def convertVibrato(param):
    if "width" not in param and "rate" not in param:
        return None
    data = b""
    if "rate" in param:
        data+=getTag(12,21,[{"format":"B","value":param["rate"]}])
    if "width" in param:
        data+=getTag(12,20,[{"format":"B","value":param["width"]}])
    return data

conversionHandlers={
    "note":convertNote,
    "vibrato":convertVibrato,
    "stretch":convertStretch,
    "lenfirst":convertLenFirst,
    "lensecond":convertLenSecond,
    "lenthird":convertLenThird,
    "lenfourth":convertLenFourth
}


def convertLyricParams(params):
    global noteBuffer
    noteBuffer=0
    data=b""
    for param in params:
        if param["t"] in conversionHandlers:
            result = conversionHandlers[param["t"]](param["a"])
            if result is not None:
                data+=result
    
    return data
