def formatCommandP(commandCode,param):
    commandCode = int(commandCode)
    param = int(param)
    return f"\x1b\\mrk={commandCode}{param:>07}\\"

def formatCommand(commandName,commandCode):
    commandCode = int(commandCode)
    return f"\x1b\\{commandName}={commandCode}\\"

def formatMrkCommand(commandCode):
    return formatCommand("mrk", commandCode)

def command_setVoicePitch(pitchSetting):
    return formatCommandP(1, pitchSetting)

def command_setSingPitch(offset,pitchInHz): # the format is mrk=XXYYYYY; X = offset, y=pitch
    if offset < 0 or offset > 99:
        raise ValueError("Offset must be between 0 and 99")
    offset = int(offset)*100000
    pitchInHz = int(pitchInHz)+offset
    return formatCommandP(2, pitchInHz)

def command_setAccent(accent):
    return formatCommandP(6, accent)

def command_setPitchSmoothing(smoothing):
    return formatCommandP(7, smoothing)

def command_setBeatSize(bsize):
    return formatCommandP(10, bsize)

def command_setPitchModWidth(mw):
    return formatCommandP(11, mw)

def command_setPitchModRate(mr):
    return formatCommandP(12, mr)

def command_setNextWordLength(length):
    return formatCommandP(15, length)

def command_setEchoGain(eg):
    return formatCommandP(18, eg)

def command_setEchoDelay(ed):
    return formatCommandP(19, ed)

def command_createPause(length):
    return formatCommand("pause",0) + formatCommandP(21,length)

def command_setChorusVoice(voice, ratio):
    if voice == 0:
        return formatCommandP(20, ratio)
    elif voice == 1:
        return formatCommandP(22, ratio)
    elif voice == 2:
        return formatCommandP(23, ratio)
    
def command_setAllChorusVoices(ratio):
    return command_setChorusVoice(0, ratio) + \
           command_setChorusVoice(1, ratio) + \
           command_setChorusVoice(2, ratio)

def command_setChorusVoices(ratio1, ratio2, ratio3):
    return command_setChorusVoice(0, ratio1) + \
           command_setChorusVoice(1, ratio2) + \
           command_setChorusVoice(2, ratio3)