import ttsCommands
import utils

def convertSongToTTS(data):
    bpm = data.get('bpm', 120)
    # sort notes by position
    notes = data.get('notes', [])
    events = data.get('events', [])
    notes.sort(key=lambda x: x['pos'])
    events.sort(key=lambda x: x['pos'])

    songTimeline = []
    # this will hold a flat list of the sequence of events in the song
    # pause: {'type':'pause','length':1}
    # note: {'type':'note','note':'G7','length':1, 'text': 'La'}
    # pauses are added automatically between notes
    for note in notes:
        note["posSec"] = note['pos'] * 60 / bpm
        note['durSec'] = note['durBeats'] * 60 / bpm
        if 'bend' in note:
            for bend in note['bend']:
                bend["pos"] = note['pos'] + bend['pos']
                bend['posSec'] = bend['pos'] * 60 / bpm
        # add pause if the first note is not at position 0
        if len(songTimeline) == 0 and note['posSec'] > 0:
            songTimeline.append({'type': 'pause', 'length': note['posSec'], 'posSec': 0})
        elif len(songTimeline) > 0:
            # if there is a pause between the last note and this one, add it
            lastNote = songTimeline[-1]
            if lastNote['type'] == 'note' and note['posSec'] > lastNote['posSec'] + lastNote['length']:
                plen = note['posSec'] - (lastNote['posSec'] + lastNote.get('length', 1))
                ppos = lastNote['posSec'] + lastNote.get('length', 1)
                # if pause is less than 1 beat, skip it
                if plen >= 1 / bpm:
                    songTimeline.append({'type': 'pause', 'length': plen, 'posSec': ppos})
        ## add note

        # convert note to hz
        note['note'] = int(utils.noteToHz(note['note']))

        songTimeline.append({'type': 'note', 'note': note['note'], 'length': note['durSec'], 'posSec': note['posSec'], 'text': note['text']})
        if 'bend' in note:
            noteBends = note['bend']
            for bend in noteBends:
                songTimeline.append({'type': 'bend', 'note': int(utils.noteToHz(bend['val'])), 'posSec': bend['posSec']})
        # todo: add bends if they exist

    for event in events:
        event["type"] = "event"
        event["posSec"] = event['pos'] * 60 / bpm
        songTimeline.append(event)
    # sort the timeline by position, prioritize events over notes
    
    songTimeline.sort(key=lambda x: x['posSec']-(0.001 if x['type'] == 'event' else 0))

    # convert to TTS format
    ttsSong=\
        ttsCommands.formatCommand("rate",74)+\
        ttsCommands.formatMrkCommand(5) + \
        ttsCommands.command_setBeatSize(bpm*200) + \
        ttsCommands.command_setVoicePitch(10000) + \
        ttsCommands.command_setAccent(0) + \
        ttsCommands.formatCommandP(8,10000) + \
        ttsCommands.command_setPitchSmoothing(20) + \
        ttsCommands.command_setPitchModWidth(0) + \
        ttsCommands.command_setPitchModRate(0) + \
        ttsCommands.formatCommandP(13,0) + \
        ttsCommands.command_setEchoGain(0) + \
        ttsCommands.command_setEchoDelay(10000) + \
        ttsCommands.command_setAllChorusVoices(10000) + \
        ttsCommands.formatMrkCommand(9)
    # TL default pitch is 10000
    beat=0
    totalEvents= len(songTimeline)
    currentEvent=0
    currentSecondaryEvent=0
    lenDiv = (bpm/60)*1000
    bDiv = (bpm/60)*10
    lastNotePosSec = 0
    lastNoteBeat = 0
    while currentEvent < totalEvents:
        for i in range(currentEvent,totalEvents):
            event = songTimeline[i]
            print("Processing event:",event)
            if event['type'] == 'note':
                print("Current beat:",beat)
                newbeat=beat+(bDiv*event['length'])
                if beat==0 and newbeat > 99:
                    raise Exception("First note exceeds 99 beats, cannot convert",newbeat)
                if newbeat > 99: # todo: OR EOS event
                    beat=0
                    break
                print("Note at beat",beat,"with note",event['note'])
                ttsSong += ttsCommands.command_setSingPitch(beat,event['note'])
                lastNoteBeat = beat
                beat = newbeat
                lastNotePosSec = event['posSec']
                currentEvent = i + 1
            elif event['type'] == 'bend':
                # calculate bend position in beats
                bendBeat = lastNoteBeat+int((((event['posSec']-lastNotePosSec)/2) * bDiv))
                print("Bend at beat",bendBeat,"with note",event['note'])
                if bendBeat >= 100:
                    raise Exception("Bend exceeds 99 beats when it shouldn't")
                ttsSong += ttsCommands.command_setSingPitch(bendBeat,event['note'])
                currentEvent = i + 1
            elif event['type'] == 'pause':
                beat=0
                currentEvent = i + 1 # the actual pause command is handled later
                break # a pause counts as an eos event, so we break here
            elif event['type'] == 'event':
                currentEvent = i + 1
        for i in range(currentSecondaryEvent,currentEvent):
            event = songTimeline[i]
            if event['type'] == 'note':
                ttsSong += ttsCommands.command_setNextWordLength(int(event['length'] * lenDiv)) + \
                ttsCommands.formatMrkCommand(30) + " " + event['text'] + ttsCommands.formatMrkCommand(31)
            elif event['type'] == 'pause':
                ttsSong += ttsCommands.command_createPause(int(event['length'] * lenDiv))
            elif event['type'] == 'event':
                vars = event['vars']
                if event['name'] == 'vibrato':
                    width = int(vars.get('width', 0))
                    rate = int(vars.get('rate', 0))
                    ttsSong += ttsCommands.command_setPitchModWidth(width) + \
                               ttsCommands.command_setPitchModRate(rate)
                elif event['name'] == 'chorus':
                    v1ratio = int(vars.get('v1ratio', 0))
                    v2ratio = int(vars.get('v2ratio', 0))
                    v3ratio = int(vars.get('v3ratio', 0))
                    ttsSong += ttsCommands.command_setChorusVoices(v1ratio+10000, v2ratio+10000, v3ratio+10000)
            currentSecondaryEvent = currentEvent
    ttsSong += ttsCommands.formatCommand("pause",5) + ttsCommands.formatCommandP(21,1000)+ttsCommands.formatCommand("eos",0)
    print("Converted song to TTS format with", len(songTimeline), "events.")
    return ttsSong