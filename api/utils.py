import socketserver

def findFreePort():
    with socketserver.TCPServer(("localhost", 0), None) as s:
        free_port = s.server_address[1]
    return free_port

def noteToHz(note):
    # Reference note: A4 = 440 Hz
    A4_FREQ = 440.0
    NOTES = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
    # Parse the note and octave
    if len(note) == 2:  # has no accidental
        name, octave = note[0], int(note[1])
        accidental = ''
    elif len(note) == 3 and note[1] == '#': # has accidental, it's sharp
        name, accidental, octave = note[0], '#', int(note[2])
        name += accidental
    else: # this shouldn't happen from the ui
        raise ValueError(f"Invalid note format: {note}")

    if name not in NOTES: # this shouldn't happen from the ui
        raise ValueError(f"Invalid note name: {name}")

    semitone_distance = NOTES[name] - NOTES['A'] + 12 * (octave - 4)
    
    freq = A4_FREQ * (2 ** (semitone_distance / 12))
    return round(freq, 2)