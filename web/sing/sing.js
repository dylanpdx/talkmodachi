const notes = [
    /*{"name":"B7","b":false},
    {"name":"A#7","b":true},
    {"name":"A7","b":false},
    {"name":"G#7","b":true},
    {"name":"G7","b":false},
    {"name":"F#7","b":true},
    {"name":"F7","b":false},
    {"name":"E7","b":false},
    {"name":"D#7","b":true},
    {"name":"D7","b":false},
    {"name":"C#7","b":true},
    {"name":"C7","b":false},
    {"name":"B6","b":false},
    {"name":"A#6","b":true},
    {"name":"A6","b":false},
    {"name":"G#6","b":true},
    {"name":"G6","b":false},
    {"name":"F#6","b":true},
    {"name":"F6","b":false},
    {"name":"E6","b":false},
    {"name":"D#6","b":true},
    {"name":"D6","b":false},*/
    {"name":"C#6","b":true},
    {"name":"C6","b":false},
    {"name":"B5","b":false},
    {"name":"A#5","b":true},
    {"name":"A5","b":false},
    {"name":"G#5","b":true},
    {"name":"G5","b":false},
    {"name":"F#5","b":true},
    {"name":"F5","b":false},
    {"name":"E5","b":false},
    {"name":"D#5","b":true},
    {"name":"D5","b":false},
    {"name":"C#5","b":true},
    {"name":"C5","b":false},
    {"name":"B4","b":false},
    {"name":"A#4","b":true},
    {"name":"A4","b":false},
    {"name":"G#4","b":true},
    {"name":"G4","b":false},
    {"name":"F#4","b":true},
    {"name":"F4","b":false},
    {"name":"E4","b":false},
    {"name":"D#4","b":true},
    {"name":"D4","b":false},
    {"name":"C#4","b":true},
    {"name":"C4","b":false},
    {"name":"B3","b":false},
    {"name":"A#3","b":true},
    {"name":"A3","b":false},
    {"name":"G#3","b":true},
    {"name":"G3","b":false},
    {"name":"F#3","b":true},
    {"name":"F3","b":false},
    {"name":"E3","b":false},
    {"name":"D#3","b":true},
    {"name":"D3","b":false},
    {"name":"C#3","b":true},
    {"name":"C3","b":false},
    {"name":"B2","b":false},
    {"name":"A#2","b":true},
    {"name":"A2","b":false},
    {"name":"G#2","b":true},
    {"name":"G2","b":false},
    {"name":"F#2","b":true},
    {"name":"F2","b":false},
    {"name":"E2","b":false},
    {"name":"D#2","b":true},
    {"name":"D2","b":false},
    {"name":"C#2","b":true},
    {"name":"C2","b":false},
    {"name":"B1","b":false},
    {"name":"A#1","b":true},
    {"name":"A1","b":false},
    {"name":"G#1","b":true},
    {"name":"G1","b":false},
    /*{"name":"F#1","b":true},
    {"name":"F1","b":false},
    {"name":"E1","b":false},
    {"name":"D#1","b":true},
    {"name":"D1","b":false},
    {"name":"C#1","b":true},
    {"name":"C1","b":false}*/
]
const gridSelect = document.getElementById('gridSelect');
const bpmInput = document.getElementById('bpmInput');
const canvElement = document.getElementById('canv');
const playButton = document.getElementById('playButton');
const audioPlayer = document.getElementById('audioPlayer');
const previewAudioPlayer = document.getElementById('previewAudioPlayer');
const notesModeButton = document.getElementById('toggleNoteModeButton');
const eventsModeButton = document.getElementById('toggleEventModeButton');
const bendModeButton = document.getElementById('toggleBendModeButton');
const loadingCover = document.getElementById('loadingCover');

const apiUrl = '/tts';
let mode='note'; // note= placing notes, event= placing events

canvElement.oncontextmenu = (e) => {
    return false; // prevent context menu on canvas
};

function genId(){
    return Math.random().toString(36).substr(2, 9);
}

function generateSong(songData){
    loadingCover.classList.remove('hidden');
	fetch(apiUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(songData)
	})
	.then(response => {
        loadingCover.classList.add('hidden');
		if (!response.ok) {
            alert('Error generating song: ' + response.statusText);
			throw new Error('API request failed');
		}
		return response.blob();
	})
    .then(audioBlob => {
		const audioUrl = URL.createObjectURL(audioBlob);
		audioPlayer.src = audioUrl;
		audioPlayer.play();
	})
}

function previewNote(noteName) {
    noteName=noteName.replace('#', '_'); // Replace # with sharp for URL compatibility
    previewAudioPlayer.src = `preview/${encodeURIComponent(noteName)}.mp3`;
    previewAudioPlayer.play()
}

function toggleMode(newmode){
    mode= newmode;

    const eventsMenu = document.getElementById('eventsMenu');
    if (mode === 'event') {
        eventsMenu.classList.remove('hidden');
        notesModeButton.classList.add('yellow');
        eventsModeButton.classList.remove('yellow');
        bendModeButton.classList.add('yellow');
    } else if (mode === 'note') {
        eventsMenu.classList.add('hidden');
        notesModeButton.classList.remove('yellow');
        eventsModeButton.classList.add('yellow');
        bendModeButton.classList.add('yellow');
    } else if (mode === 'bend'){
        eventsMenu.classList.add('hidden');
        notesModeButton.classList.add('yellow');
        eventsModeButton.classList.add('yellow');
        bendModeButton.classList.remove('yellow');
    }
}

toggleMode('note');

async function main(){

    function getGridSize(){
        let gridSize=1;
        switch (gridSelect.value) {
            case '1':
                gridSize = 1;
                break;
            case '1/2':
                gridSize = 1/2;
                break;
            case '1/3':
                gridSize = 1/3;
                break;
            case '1/4':
                gridSize = 1/4;
                break;
            case '1/6':
                gridSize = 1/6;
                break;
            case '1/8':
                gridSize = 1/8;
                break;
            case '1/12':
                gridSize = 1/12;
                break;
            case '1/16':
                gridSize = 1/16;
                break;
        }
        return gridSize;
    }

    function getBpm(){
        return parseInt(bpmInput.value) || 120;
    }

    function setBpm(bpm) {
        bpmInput.value = bpm;
    }

    let scrollY = 0;
    let scrollX = 0;

    const noteWidth = 50;
    const topBuffer = 50; // Space for the header
    const noteHeight = 20;
    const noteX = 0;
    const noteYStart = 0;
    const beatToPixel = 100; // 1 beat = 100 pixels
    const defaultNoteColor = 0xC0C0FF;
    const defaultNoteBendColor = 0x8080FF;
    let placingNote = null;
    let placingOffset = 0;
    let resizingNote = null;
    let editingEvent = null;
    let editingBendPoint = null; // {note:..., bendPointId:...}
    let lastPreviewedNote = null;
    
    const app = new PIXI.Application();
    globalThis.__PIXI_APP__ = app;
    await app.init({ background: '#ffffff', resizeTo: canvElement });
    canvElement.appendChild(app.canvas);

    // Container for the piano roll
    const pianoRollContainer = new PIXI.Container();
    pianoRollContainer.y = topBuffer;
    app.stage.addChild(pianoRollContainer);
    const pianoTrackContainer = new PIXI.Container();
    pianoTrackContainer.x = noteX + noteWidth;
    pianoTrackContainer.interactive = true;
    pianoRollContainer.addChild(pianoTrackContainer);

    const eventHeadersContainer = new PIXI.Container();
    eventHeadersContainer.interactive = true;
    const eventHeadersBg = new PIXI.Graphics();
    eventHeadersBg.beginFill(0xFFFFFF, 0.8);
    eventHeadersBg.drawRect(0, 0, 9999, topBuffer);
    eventHeadersBg.endFill();
    eventHeadersContainer.addChild(eventHeadersBg);
    app.stage.addChild(eventHeadersContainer);

    // Actual notes
    const notesHolder = new PIXI.Container();
    notesHolder.zIndex = 1;
    pianoTrackContainer.addChild(notesHolder);

    const eventsHolder = new PIXI.Container();
    eventsHolder.zIndex = 2;
    pianoTrackContainer.addChild(eventsHolder);

    // Draw notes on the left side
    const trackRect = new PIXI.Graphics();
    notes.forEach((note, index) => {
        const noteY = noteYStart + index * (noteHeight);
        // Draw a rectangle for the note
        const noteRect = new PIXI.Graphics();
        noteRect.beginFill(note.b ? 0x000000 : 0xFFFFFF);
        noteRect.drawRect(noteX, noteY, noteWidth, noteHeight);
        noteRect.endFill();
        pianoRollContainer.addChild(noteRect);
        // track
        trackRect.beginFill(index % 2 === 0 ? 0xDDDDDD : 0xEEEEEE);
        trackRect.drawRect(0, noteY, 9999, noteHeight);
        trackRect.endFill();

        const noteText = new PIXI.Text(note.name, { fontSize: 14, fill: note.b ? 0xFFFFFF : 0x000000 });
        noteText.x = noteX;
        noteText.y = noteY;
        pianoRollContainer.addChild(noteText);
    });

    // play line
    const playLine = new PIXI.Graphics();
    playLine.moveTo(0, 0).lineTo(0, noteHeight*notes.length).stroke({color: 0x00de00, width: 2, alpha: 1});
    playLine.x = 1; // Initial position
    playLine.zIndex = 1; // Ensure it's above other elements
    pianoTrackContainer.addChild(playLine);

    app.ticker.add((delta) => {
        if (audioPlayer && !audioPlayer.paused) {
            playLine.visible = true;
            const currentTime = audioPlayer.currentTime;
            const bpm = getBpm();
            const secondsPerBeat = 60 / bpm;
            const beats = currentTime / secondsPerBeat;
            playLine.x = beats * beatToPixel;
        }else{
            playLine.visible = false;
        }
    });

    pianoTrackContainer.addChild(trackRect);
    const gridLines = new PIXI.Graphics();
    function drawGridLines() {
        const gridSize = getGridSize();
        gridLines.clear();
        for (let i = 0; i < 500; i++) {
            const x = i * (gridSize * beatToPixel);
            gridLines.moveTo(x, 0).lineTo(x, noteHeight*notes.length).stroke({color: 0xCCCCCC, width: 2, alpha: 1});
        }
    }
    pianoTrackContainer.addChild(gridLines);
    drawGridLines();

    gridSelect.addEventListener('change', (event) => {
        drawGridLines();
    });
    
    function createInputAt(x,y,width,height){
        const input = document.createElement('input');
        input.type = 'text';
        input.style.position = 'absolute';
        input.style.left = `${x}px`;
        input.style.top = `${y}px`;
        input.style.zIndex = '1000'; // Ensure it is above other elements
        input.style.width = `${width}px`;
        input.style.height = `${height}px`;
        input.style.border = '0px'
        
        // Add input to the body
        canvElement.appendChild(input);

        return input;

    }

    function addNote(noteIndex,pos,length){
        length = length * beatToPixel;

        // check if there's already a note at this position
        const allNotes = getAllNotesExcept(placingNote);
        const overlappingNote = allNotes.find(othernote => doNotePosOverlap(othernote, pos, length));
        if (overlappingNote) {
            return null;
        }

        const notec = new PIXI.Container();
        const noteRect = new PIXI.Graphics();
        noteRect.beginFill(defaultNoteColor);
        noteRect.drawRect(0, 0, length, noteHeight);
        noteRect.endFill();
        notec.addChild(noteRect);

        const noteBend = new PIXI.Container();
        const noteBendLine = new PIXI.Graphics();
        noteBendLine.x = 0;
        noteBendLine.y = 0;
        noteBend.addChild(noteBendLine);
        noteBend.interactiveChildren = false;
        notec.addChild(noteBend);

        const noteText = new PIXI.Text("La", { fontSize: 14, fill: 0x000000 });
        noteText.x = 0;
        noteText.y = 2;
        notec.addChild(noteText);

        notec._nWidth = length; // store original width
        notec._nRect = noteRect; // store rect for resizing
        notec._nBendLine = noteBendLine;
        notec._bend = [{pos:0,val:0,e:false,id:genId()},{pos:length,val:0,e:false,id:genId()}]; // default bend, pos in pixels, val, e = has been edited, id is unique id
        notec.rerenderBend = function(){
            this._nBendLine.clear();
            let wipLine = this._nBendLine.moveTo(0, noteHeight/2);
            this._bend.forEach((bendi) => {
                const bendY = (noteHeight/2) - (bendi.val * (noteHeight));
                wipLine = wipLine.lineTo(bendi.pos,bendY);
            });
            wipLine.stroke({color: defaultNoteBendColor, width: 3, alpha: 1});
            this._bend.forEach((bendi) => {
                const bendY = (noteHeight/2) - (bendi.val * (noteHeight));
                this._nBendLine.beginFill(defaultNoteBendColor);
                this._nBendLine.drawCircle(bendi.pos, bendY, 2);
                this._nBendLine.endFill();
            });
        }
        notec.fillinBend = function(){
            // if any bend pos's > width, clamp them. if any <0, clamp them; if there's no bend at 0 or width, add them
            let needRerender = false;
            this._bend = this._bend.filter(bendi => {
                if (bendi.pos < 0) {
                    needRerender = true;
                    return false;
                }
                if (bendi.pos > this._nWidth) {
                    needRerender = true;
                    return false;
                }
                return true;
            });
            if (this._bend.length === 0 || this._bend[0].pos > 0) {
                this._bend.unshift({pos:0,val:0,e:false,id:genId()});
                needRerender = true;
            }
            if (this._bend[this._bend.length - 1].pos < this._nWidth) {
                lastVal = this._bend.length > 0 ? this._bend[this._bend.length - 1].val : 0;
                if (lastVal.e)
                    this._bend.push({pos:this._nWidth,val:lastVal,e:false,id:genId()});
                else // instead of pushing a new value, just move the last one
                    this._bend[this._bend.length - 1].pos = this._nWidth;
                needRerender = true;
            }

            if (needRerender)
                this.rerenderBend();
        }
        notec.fillinBend();
        notec.rerenderBend();

        notec.x = pos;
        notec.y = noteIndex * noteHeight;
        notesHolder.addChild(notec);
        notec.interactive = true;

        notec.on('mousedown', (event) => {
            if (mode === 'note'){
                event.stopPropagation(); // Prevent event bubbling
                const localPos = event.data.getLocalPosition(pianoTrackContainer);
                const isResize = (localPos.x - notec.x) >= (notec._nWidth - 5);
                if (!isResize){
                    notec.cursor = 'grabbing';
                    placingOffset = notec.x - localPos.x;
                    placingNote = notec; // reuse placing logic
                }else{
                    notec.cursor = 'ew-resize';
                    resizingNote = notec; // set resizing note
                }
            }
        });

        notec.on('mouseup', (event) => {
            if (!notec._dbc){
                notec._dbc = true; // mark as double-click maybe in progress
                setTimeout(() => { notec._dbc = false; }, 300); // reset after 300ms
            }else{
                startEditingNoteText(notec);
            }
        });

        notec.on('mouseover', (event) => {
            updateNoteHover(notec,event);
        });

        notec.on('mousemove', (event) => {
            updateNoteHover(notec,event);
        });

        notec.on('mouseout', () => {
            if (placingNote != notec && resizingNote != notec) {
                notec.cursor = 'pointer';
            }
        });

        notec.on('rightclick', (event) => {
            event.stopPropagation();
            event.preventDefault(); // Prevent context menu
            // delete the note
            notesHolder.removeChild(notec);
        });

        return notec;
    }

    function addEvent(eventData, pos) {
        if (eventData.name === 'none')
            return; // Skip if none event is selected
        const eventDefinition = events[eventData.name];
        const extraDn=30 + (-10*eventDefinition.i); // extra distance from the bottom of the screen
        const eventContainer = new PIXI.Container();
        const eventLine = new PIXI.Graphics();
        const eventColor=eventDefinition.color || 0xBABABA;
        const text = eventDefinition.ts ? eventDefinition.ts(eventData) : eventDefinition.name;
        // draw a line from the top of the screen to the bottom
        eventLine.moveTo(0, 0).lineTo(0, noteHeight*(notes.length)).stroke({color: eventColor, width: 2, alpha: .5});
        eventLine.x = pos; // position the line at the specified position
        eventContainer.addChild(eventLine);

        const eventHeader = new PIXI.Container();
        eventHeader.interactive = true;
        eventHeader._line = eventLine;
        eventHeader._eventData = eventData;
        const eventHeaderText = new PIXI.Text(text, { fontSize: 14, fill: 0x000000 });
        eventHeader.x = (pos - (eventHeaderText.width / 2))+noteWidth; // center the text
        eventHeader.y = extraDn; // position at the bottom
        const eventHeaderOutline = new PIXI.Graphics();

        // draw a rectangle around the text
        eventHeaderOutline.beginFill(eventColor);
        eventHeaderOutline.lineStyle(2, 0x000000);
        eventHeaderOutline.drawRoundedRect(eventHeaderText.x - 5, eventHeaderText.y - 5, eventHeaderText.width + 10, eventHeaderText.height + 10,10);
        eventHeaderOutline.endFill();
        
        eventHeader.addChild(eventHeaderOutline);
        eventHeader.addChild(eventHeaderText);
        eventHeadersContainer.addChild(eventHeader);

        eventsHolder.addChild(eventContainer);

        // click events
        
        eventHeader.on('mousedown', (event) => {
            event.stopPropagation(); // Prevent event bubbling
            const clickedPos = event.data.getLocalPosition(pianoTrackContainer);
            const eventPos = eventHeader._line.x; // Get the x position of the event line
            editingEvent = eventHeader;
        });

        eventHeader.on('rightclick', (event) => {
            event.stopPropagation();
            event.preventDefault(); // Prevent context menu
            // delete the event
            eventHeadersContainer.removeChild(eventHeader);
            eventsHolder.removeChild(eventContainer);
        });

        eventHeader.on('mouseup', (event) => {
            if (editingEvent === eventHeader) {
                editingEvent = null; // reset editing event
            }
            /*if (!notec._dbc){
                notec._dbc = true; // mark as double-click maybe in progress
                setTimeout(() => { notec._dbc = false; }, 300); // reset after 300ms
            }else{
                startEditingNoteText(notec);
            }*/
        });

        eventHeader.on('mouseover', (event) => {
            // move the header to the top of the hierarchy
            eventHeadersContainer.setChildIndex(eventHeader, eventHeadersContainer.children.length - 1);
        });

        /*eventHeader.on('mouseover', (event) => {

        });

        eventHeader.on('mouseout', () => {

        });*/
    }

    function getNoteText(note){
        for (const child of note.children) {
            if (child instanceof PIXI.Text) {
                return child.text;
            }
        }
        return null;
    }

    function setNoteText(note, text) {
        note.children.forEach(child => {
            if (child instanceof PIXI.Text) {
                child.text = text;
            }
        });
    }

    function stopEditingNoteText(note) {
        if (note._editingInput) {
            const newText = note._editingInput.value.trim();
            if (newText) {
                setNoteText(note, newText);
            }
            canvElement.removeChild(note._editingInput); // remove from DOM
            note._editingInput = null;
        }
    }

    function startEditingNoteText(note) {
        const noteText = getNoteText(note);
        const gpos = note.getGlobalPosition();
        const input = createInputAt(gpos.x, gpos.y, note._nWidth, noteHeight);
        note._editingInput = input;
        input.style.backgroundColor = "#"+defaultNoteColor.toString(16);
        input.value = noteText || '';
        input.focus();
        input.select();

        // handle note end editing events
        input.addEventListener('blur', () => {
            stopEditingNoteText(note);
        });

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                stopEditingNoteText(note);
            }
        });
    }

    function updateNoteHover(note,event){
        if (placingNote === note || resizingNote === note)
            return;
        const localPos = event.data.getLocalPosition(pianoTrackContainer);
        const isResize = (localPos.x - note.x) >= (note._nWidth - 5);
        if (!isResize){
            note.cursor = 'grab';
        }else{
            note.cursor = 'ew-resize';
        }
    }

    function getAllNotes() {
        return notesHolder.children;
    }

    function getAllEvents() {
        return eventHeadersContainer.children.filter(event => event instanceof PIXI.Container && event._line);
    }
    
    function getAllNotesConverted(){
        const cnotes = [];
        getAllNotes().forEach((note) => {
            const noteIndex = Math.floor(note.y / noteHeight);
            const pos = note.x / beatToPixel;
            const durBeats = note._nWidth/beatToPixel;
            //const durSec = (60/ getBpm()) * durBeats;
            const noteName = notes[noteIndex].name;
            const noteText = getNoteText(note);
            cnotes.push({ note: noteName, pos, durBeats,text:noteText });
        });
        return cnotes;
    }

    function getAllEventsConverted() {
        const cevents = [];
        getAllEvents().forEach((event) => {
            const pos = event._line.x / beatToPixel;
            const eventData = event._eventData;
            eventData.pos = pos;
            cevents.push(eventData);
        });
        return cevents;
    }

    function getAllNotesExcept(noteToExclude) {
        const notes = getAllNotes();
        return notes.filter(note => note != noteToExclude);
    }
    function doNotePosOverlap(note1, pos,width) {
        return !(note1.x + note1._nWidth < pos || approxEqual(note1.x + note1._nWidth, pos) ||
                 pos + width < note1.x || approxEqual(pos + width, note1.x));
    }

    function doNotesOverlap(note1, note2) {
        return doNotePosOverlap(note1, note2.x, note2._nWidth);
    }

    function clearAllNoteTints() {
        const allNotes = getAllNotes();
        allNotes.forEach(note => {
            note.tint = 0xFFFFFF; // reset to default color
        });
    }

    // ability to place notes using mouse
    function pianoTrackPointerDown(event) {
        const localPos = event.data.getLocalPosition(pianoTrackContainer);
        let newPos = localPos.x;
        // snap newpos to grid
        const gridSize = getGridSize();
        newPos = Math.round(newPos / (gridSize * beatToPixel)) * (gridSize * beatToPixel);
        newPos = Math.max(0, newPos); // prevent negative positions

        if (mode === 'note'){
            const noteIndex = Math.floor(localPos.y / noteHeight);
            if (noteIndex < 0 || noteIndex >= notes.length) {
                console.warn("Clicked outside of note range");
                return;
            }

            placingNote = addNote(noteIndex, newPos, getGridSize());
            const noteName = notes[noteIndex].name;
            if (lastPreviewedNote !== noteName) {
                previewNote(noteName);
                lastPreviewedNote = noteName;
            }
        }else if (mode === 'event') {
            const eventData = getSelectedEvent();
            addEvent(eventData, newPos);
        }else if (mode === 'bend'){
            // check if there's a note at this x position
            const allNotes = getAllNotes();
            const notec = allNotes.find(note =>localPos.x >= note.x && localPos.x <= (note.x + note._nWidth));
            if (!notec) {
                console.warn("No note at this position to add bend point");
                return;
            }else{
                console.log("Found note for bend point", notec);
            }

            // check if clicked near a bend point
            const bendLocalX = localPos.x - notec.x;
            const bendLocalY = localPos.y - notec.y;
            let selectedBend = null;
            notec._bend.forEach((bendi) => {
                const bendY = (noteHeight/2) - (bendi.val * (noteHeight));
                const dx = bendLocalX - bendi.pos;
                const dy = bendLocalY - bendY;
                const distSq = dx*dx + dy*dy;
                if (distSq <= 25) { // within 5 pixels
                    selectedBend = bendi;
                }
            });
            if (!selectedBend) {
                // when *ADDING* a bend, you need to click on the note itself
                if (bendLocalY >= 0 && bendLocalY <= noteHeight) {
                    // add a new bend point at the clicked position, with val=0
                    let snapBendX = bendLocalX;
                    const gridSize = getGridSize();
                    snapBendX = Math.round(snapBendX / (gridSize * beatToPixel)) * (gridSize * beatToPixel);
                    snapBendX = Math.max(0, Math.min(notec._nWidth, snapBendX)); // clamp to note width

                    // if there's already a bend point at this position, skip
                    for (const bendi of notec._bend) {
                        if (approxEqual(bendi.pos, snapBendX)) {
                            return;
                        }
                    }
                    notec._bend.push({pos:snapBendX,val:0,e:true,id:genId()});
                    notec._bend.sort((a,b) => a.pos - b.pos);
                    notec.rerenderBend();
                    selectedBend = notec._bend.find(bendi => approxEqual(bendi.pos, snapBendX));
                }
            }
            if (selectedBend) {
                if (selectedBend.pos === 0){
                    return; // the first bend point cannot be moved for technical reasons
                }
                editingBendPoint = {note:notec, bendPointId:selectedBend.id};
            }else{
                console.warn("Clicked bend point not found");
                return;
            }
        }
    };

    // while mouse is moving, move the note
    function pianoTrackPointerMove(event) {
        const localPos = event.data.getLocalPosition(pianoTrackContainer);
        const noteIndex = Math.floor(localPos.y / noteHeight);
        if (placingNote){
            
            let newPos = localPos.x+placingOffset;
            // snap newpos to grid
            const gridSize = getGridSize();
            newPos = Math.round(newPos / (gridSize * beatToPixel)) * (gridSize * beatToPixel);
            newPos = Math.max(0, newPos); // prevent negative positions
            // prevent note from overlapping with other notes
            const overlappingNote = getAllNotesExcept(placingNote).find(othernote => doNotePosOverlap(othernote, newPos, placingNote._nWidth));
            clearAllNoteTints();
            if (overlappingNote) {
                overlappingNote.tint = 0xFF7070; // highlight overlapping notes
                newPos = placingNote.x; // reset position to orig
            }

            placingNote.x = newPos;
            if (noteIndex < 0 || noteIndex >= notes.length) {
                console.warn("Moving outside of note range");
                return;
            }
            placingNote.y = noteIndex * noteHeight;

            const noteName = notes[noteIndex].name;
            if (lastPreviewedNote !== noteName) {
                previewNote(noteName);
                lastPreviewedNote = noteName;
            }

        }else if (resizingNote) {
            let width = resizingNote._nWidth;
            width = localPos.x - resizingNote.x;

            // snap width to grid
            const gridSize = getGridSize();
            width = Math.round(width / (gridSize * beatToPixel)) * (gridSize * beatToPixel);

            // clamp width to minimum of 1 beat and max of 1000
            width = Math.max(gridSize*beatToPixel, Math.min(10*gridSize*beatToPixel, width));

            const overlappingNote = getAllNotesExcept(resizingNote).find(othernote => doNotePosOverlap(othernote, resizingNote.x, width));
            clearAllNoteTints();
            if (overlappingNote) {
                overlappingNote.tint = 0xF00000; // highlight overlapping notes
                return;
            }

            resizingNote.children.forEach(child => {
                if (child instanceof PIXI.Graphics) {
                    child.width = width;
                }
            });
            resizingNote._nWidth = width; // update stored width
            resizingNote.fillinBend();
        }else if (editingBendPoint) {
            const bendLocalX = localPos.x - editingBendPoint.note.x;
            const bendLocalY = localPos.y - editingBendPoint.note.y;
            // snap bendLocalX to grid
            let snapBendX = bendLocalX;
            const gridSize = getGridSize();
            snapBendX = Math.round(snapBendX / (gridSize * beatToPixel)) * (gridSize * beatToPixel);
            snapBendX = Math.max(0, Math.min(editingBendPoint.note._nWidth, snapBendX)); // clamp to note width
            for (const bendi of editingBendPoint.note._bend) {
                if (
                    (bendi.id !== editingBendPoint.bendPointId && approxEqual(bendi.pos, snapBendX)) || // do not allow overlap of bend points
                    (bendi.id === editingBendPoint.note._bend[editingBendPoint.note._bend.length - 1].id) // do not allow moving the last bend point in x dir

                ) {
                    snapBendX = editingBendPoint.note._bend.find(bendi => bendi.id === editingBendPoint.bendPointId).pos; // reset to original pos (probably a better way to do this?)
                    break;
                }
            }

            let bendVal = ((noteHeight/2) - bendLocalY) / (noteHeight);
            bendVal = Math.max(-5, Math.min(5, bendVal)); 
            bendVal = Math.round(bendVal); // idk if i'll ever support fractional bends
            const bendPoint = editingBendPoint.note._bend.find(bendi => bendi.id === editingBendPoint.bendPointId);
            if (bendPoint) {
                bendPoint.pos = snapBendX;
                bendPoint.val = bendVal;
                bendPoint.e = true;
                editingBendPoint.note._bend.sort((a,b) => a.pos - b.pos);
                editingBendPoint.note.rerenderBend();
            }
        }
    }

    function pianoTrackPointerUp(event){
        const localPos = event.data.getLocalPosition(pianoTrackContainer);
        const noteIndex = Math.floor(localPos.y / noteHeight);
        clearAllNoteTints();
        if (placingNote)
        {
            if (noteIndex < 0 || noteIndex >= notes.length) {
                console.warn("Clicked outside of note range");
                return;
            }
            placingNote = null;
            placingOffset = 0;
            lastPreviewedNote = null;
        }else if (resizingNote) {
            resizingNote = null;
        }else if (editingBendPoint) {
            editingBendPoint = null;
        }
    }

    function eventHeaderPointerMove(event) {

    }

    function getSongData() {
        const songData = {
            bpm: getBpm(),
            notes: getAllNotesConverted(),
            events: getAllEventsConverted(),
        };
        return songData;
    }

    playButton.addEventListener('click', () => {
        const songData = getSongData();
        generateSong(songData);
    });

    pianoTrackContainer.on('mouseup', pianoTrackPointerUp);
    pianoTrackContainer.on('mousemove',pianoTrackPointerMove)
    pianoTrackContainer.on('mousedown',pianoTrackPointerDown);

    eventHeadersContainer.on('mousemove', event => {
        if (editingEvent) {
            const localPos = event.data.getLocalPosition(eventHeadersContainer);
            const newPos = Math.max(0, localPos.x); // prevent negative positions
            // snap newPos to grid
            const gridSize = getGridSize();
            const snappedPos = Math.round(newPos / (gridSize * beatToPixel)) * (gridSize * beatToPixel);
            editingEvent._line.x = snappedPos; // update the line position
            editingEvent.x = snappedPos - (editingEvent._nWidth / 2) + noteWidth; // center the header text
            app.render();
        }
    });

    // handle scroll wheel
    canvElement.addEventListener('wheel', (event) => {
        event.stopPropagation();
        if (event.deltaY < 0) {
            scrollY += noteHeight*1; // scroll up
        } else {
            scrollY -= noteHeight*1; // scroll down
        }
        scrollY = Math.min(0, scrollY); // prevent underscroll
        // todo: prevent overscroll
        pianoRollContainer.y = scrollY+topBuffer;
        app.render();
    });

}
main();