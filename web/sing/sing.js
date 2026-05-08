const notes = [
    {"name":"C#6","b":true}, // 85
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
    {"name":"C4","b":false}, // 60
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
    {"name":"G1","b":false}, // 31
]
const minMidiNote=31;
const maxMidiNote=85;
const gridSelect = document.getElementById('gridSelect');
const langSelect = document.getElementById('langSelect');
const bpmInput = document.getElementById('bpmInput');
const canvElement = document.getElementById('canv');
const playButton = document.getElementById('playButton');
const audioPlayer = document.getElementById('audioPlayer');
const previewAudioPlayer = document.getElementById('previewAudioPlayer');
const notesModeButton = document.getElementById('toggleNoteModeButton');
const eventsModeButton = document.getElementById('toggleEventModeButton');
const bendModeButton = document.getElementById('toggleBendModeButton');
const loadingCover = document.getElementById('loadingCover');
const saveGenSongButton = document.getElementById('saveGenSongButton');
const saveButton = document.getElementById('saveSongButton');
const loadButton = document.getElementById('loadSongButton');
const importButton = document.getElementById('importButton');
const importDialog = document.getElementById('importDialog');
const completeImportbutton = document.getElementById('completeImportbutton');
const cancelImportbutton = document.getElementById('cancelImportbutton');

const toromaji = document.getElementById('toromaji');
const plustobend = document.getElementById('plustobend');
const dashtobend = document.getElementById('dashtobend');
const rb_nochange = document.getElementById('nochange');
const rb_remspaces = document.getElementById('remspaces');
const rb_keepfirst = document.getElementById('keepfirst');
const rb_keeplast = document.getElementById('keeplast');

saveGenSongButton.disabled = true;
const AudioContext = window.AudioContext || window.webkitAudioContext;
const bMult = 9.68; // must match what's in newSongConverter.py
const chunkCache={}

const apiUrl = '/tts';
let mode='note'; // note= placing notes, event= placing events, bend=placing/editing bend points
let selectedFile=undefined;

canvElement.oncontextmenu = (e) => {
    return false; // prevent context menu on canvas
};

function genId(){
    return Math.random().toString(36).substr(2, 9);
}

function saveCache(){
    // for testing only
    /*const sCache={}
    for (key of Object.keys(chunkCache))
        sCache[key]=new Uint8Array(chunkCache[key])
    sessionStorage.setItem("cache",JSON.stringify(sCache))*/
}

function loadCache(){
    // for testing only
    /*const cache = JSON.parse(sessionStorage.getItem("cache"))
    if (!cache)
        return;
    for (key of Object.keys(cache)){
        const arr = []
        for (n of Object.values(cache[key])){
            arr.push(n)
        }
        chunkCache[key]=new Uint8Array(arr).buffer
    }*/
}

loadCache();

async function generateSong(songData){
    loadingCover.classList.remove('hidden');
	return await fetch(apiUrl, {
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
		return response.arrayBuffer();
	})
}

function saveGeneratedSong(){
    const audioSrc = audioPlayer.src;
    if (!audioSrc) {
        alert('No generated song to download.');
        return;
    }
    const link = document.createElement('a');
    link.href = audioSrc;
    link.download = 'generated_song.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    const scrollBuff = 200;

    const progressBarHeight = 20;

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
    pianoTrackContainer.name = "pianoTrackContainer";
    pianoRollContainer.addChild(pianoTrackContainer);
    pianoRollContainer.name = "pianoRollContainer";

    // progress bar container
    const progressBarBg = new PIXI.Graphics();
    progressBarBg.name = "progressBar"
    progressBarBg.beginFill(0x0,.5);
    progressBarBg.drawRect(0,0,99999,progressBarHeight);
    progressBarBg.endFill();
    progressBarBg.pivot.y = progressBarHeight;
    progressBarBg.position.x = noteWidth
    progressBarBg.position.y = app.canvas.height
    progressBarBg.interactive = true;
    app.stage.addChild(progressBarBg);

    const progressBarThingy = new PIXI.Graphics();
    const thingySize = 20;
    let thingyPos = 0;
    progressBarThingy.name = "progressBarThingy"
    progressBarThingy.beginFill(0x0);
    progressBarThingy.drawRect(0,0,thingySize,progressBarHeight);
    progressBarThingy.endFill();
    progressBarThingy.position.x = 0
    progressBarThingy.position.y = 0
    progressBarBg.addChild(progressBarThingy);
    function setProgressThingyPos(pct){
        thingyPos = pct;
        progressBarThingy.position.x = Math.min(app.canvas.width-progressBarBg.position.x-thingySize,app.canvas.width*pct);
    }
    function updateProgressThingy(){
        setProgressThingyPos(thingyPos);
    }
    window.addEventListener('resize',()=>{
        setTimeout(() => {
            progressBarBg.position.y = app.canvas.height;
            updateProgressThingy();
        }, 10);
    })
    


    const eventHeadersContainer = new PIXI.Container();
    eventHeadersContainer.interactive = true;
    const eventHeadersBg = new PIXI.Graphics();
    eventHeadersBg.beginFill(0xFFFFFF, 0.8);
    eventHeadersBg.drawRect(0, 0, 9999, topBuffer);
    eventHeadersBg.endFill();
    eventHeadersBg.name = "eventHeadersBg";
    eventHeadersContainer.addChild(eventHeadersBg);
    eventHeadersContainer.name = "eventHeadersContainer";
    eventHeadersContainer.x=noteWidth;
    app.stage.addChild(eventHeadersContainer);
    const eventsHolder = new PIXI.Container();
    eventsHolder.name = "eventsHolder";
    eventHeadersContainer.addChild(eventsHolder);

    // Actual notes
    const notesHolder = new PIXI.Container();
    notesHolder.zIndex = 1;
    notesHolder.name = "notesHolder";
    pianoTrackContainer.addChild(notesHolder);

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
        trackRect.zIndex = -1;
        trackRect.interactive = false;
        pianoRollContainer.addChild(trackRect);

        const noteText = new PIXI.Text(note.name, { fontSize: 14, fill: note.b ? 0xFFFFFF : 0x000000 });
        noteText.x = noteX;
        noteText.y = noteY;
        pianoRollContainer.addChild(noteText);
    });

    const trackBg = new PIXI.Graphics(); // for click detection
    trackBg.beginFill(0xFFFFFF, 0);
    trackBg.drawRect(0, 0, 99999, noteHeight*notes.length);
    trackBg.endFill();
    trackBg.interactive = true;
    pianoTrackContainer.addChild(trackBg);

    const notePlacementHelper = new PIXI.Text('', { fontSize: 14, fill: 0x000000, fontStyle:'italic' });
    notePlacementHelper.zIndex = 3;
    pianoTrackContainer.addChild(notePlacementHelper);


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

    function addNote(noteIndex,pos,length,text="La"){
        length = length * beatToPixel;

        // check if there's already a note at this position
        const allNotes = getAllNotesExcept(placingNote);
        const overlappingNote = allNotes.find(othernote => doNotePosOverlap(othernote, pos, length));
        if (overlappingNote) {
            console.warn('Cannot place note here, overlapping with another note.');
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

        const noteText = new PIXI.Text(text, { fontSize: 14, fill: 0x000000, fontWeight: 'bold' });
        noteText.x = 0;
        noteText.y = 2;
        noteText.zIndex = 2;
        notec.addChild(noteText);

        notec._nWidth = length; // store original width
        notec._nRect = noteRect; // store rect for resizing
        notec._nBendLine = noteBendLine;
        notec._bend = [{pos:0,val:0,e:false,id:genId()},{pos:length,val:0,e:false,id:genId()}]; // default bend, pos in pixels, val, e = has been edited, id is unique id
        notec.rerenderBend = function(){
            this._nBendLine.clear();
            let wipLine = this._nBendLine.moveTo(0, noteHeight/2);
            const lastVibratoEvent = getAllEvents().filter(e => e._eventData.name === "vibrato" && e.x <= notec.x).sort((a,b) => b.x - a.x)[0];
            for (let i = 0; i < notec._nWidth; i+=.5) {
                const nextBend = notec._bend.find(b => b.pos >= i);
                const prevBend = [...notec._bend].reverse().find(b => b.pos <= i);
                let val = 0;
                if (nextBend && prevBend) {
                    if (nextBend.pos === prevBend.pos) {
                        val = nextBend.val;
                    } else {
                        const t = (i - prevBend.pos) / (nextBend.pos - prevBend.pos);
                        val = prevBend.val + t * (nextBend.val - prevBend.val);
                    }
                }
                let lastVibratoWidth = 0;
                let lastVibratoRate = 0;
                if (lastVibratoEvent) {
                    lastVibratoWidth = lastVibratoEvent._eventData.vars.width || 0;
                    lastVibratoRate = lastVibratoEvent._eventData.vars.rate || 0;
                }
                // convert to pixels
                const secondsToPixels = (60/getBpm()) * beatToPixel;
                lastVibratoRate = (1000/lastVibratoRate) * secondsToPixels; // convert to pixels
                const sinewave = lastVibratoRate > 0 ? Math.sin((i*Math.PI)/lastVibratoRate) * ((noteHeight*5)*(lastVibratoWidth/9000)) : 0;
                const sinval = sinewave + (val*noteHeight);
                wipLine = wipLine.lineTo(i, (noteHeight/2) - (sinval));
            }
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
                lastBend = this._bend.length > 0 ? this._bend[this._bend.length - 1] : null;
                if (lastBend==null) // this should not happen?
                    return;
                if (lastBend.e)
                    this._bend.push({pos:this._nWidth,val:lastBend.val,e:false,id:genId()});
                else // instead of pushing a new value, just move the last one
                    this._bend[this._bend.length - 1].pos = this._nWidth;
                needRerender = true;
            }

            if (needRerender)
                this.rerenderBend();
        }
        notec.fillinBend();

        notec.changeSize = function(width){
            notec.children.forEach(child => {
                if (child instanceof PIXI.Graphics) {
                    child.width = width;
                }
            });
            notec._nWidth = width; // update stored width
            notec.fillinBend();
        }
        

        notec.x = pos;
        notec.y = noteIndex * noteHeight;
        notesHolder.addChild(notec);
        notec.interactive = true;

        notec.rerenderBend();

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
            setProgressThingyPos((-scrollX)/getMaxScroll());
        });
        return notec;
    }

    function rerenderAllNotes(){
        notesHolder.children.forEach(note => {
            note.rerenderBend();
        });
    }

    function addEvent(eventData, pos) {
        if (eventData.name === 'none')
            return; // Skip if none event is selected
        if (getAllEvents().some((e=>e.x==pos && e._eventData.name==eventData.name)))
            return; // cannot overwrite notes
        const eventDefinition = events[eventData.name];
        const extraDn=30 + (-7*eventDefinition.i); // extra distance from the bottom of the screen
        const eventLine = new PIXI.Graphics();
        const eventColor=eventDefinition.color || 0xBABABA;
        const eventColorBrightness = Math.round(((((eventColor >> 16) & 0xFF) * 299) + (((eventColor >> 8) & 0xFF) * 587) + ( (eventColor & 0xFF) * 114)) / 1000);
        const text = eventDefinition.ts ? eventDefinition.ts(eventData) : eventDefinition.name;
        

        const eventHeader = new PIXI.Container();
        eventHeader.interactive = true;
        eventHeader._line = eventLine;
        eventHeader._eventData = eventData;
        const eventHeaderText = new PIXI.Text(text, { fontSize: 14, fill: eventColorBrightness > 128 ? 0x000000 : 0xFFFFFF });
        eventHeader.x = pos;
        eventHeader.pivot.x = eventHeaderText.width/2;
        eventHeader.y = extraDn; // position at the bottom
        eventHeader._nWidth = eventHeaderText.width;
        const eventHeaderOutline = new PIXI.Graphics();

        // draw a rectangle around the text
        eventHeaderOutline.beginFill(eventColor);
        eventHeaderOutline.lineStyle(2, 0x000000);
        eventHeaderOutline.drawRoundedRect(eventHeaderText.x - 5, eventHeaderText.y - 5, eventHeaderText.width + 10, eventHeaderText.height + 10,10);
        eventHeaderOutline.endFill();
        eventLine.moveTo(0, eventHeaderText.height).lineTo(0, (noteHeight*(notes.length))-eventHeader.y+topBuffer).stroke({color: eventColor, width: 2, alpha: .5});

        eventHeader.addChild(eventHeaderOutline);
        eventHeader.addChild(eventHeaderText);
        eventHeader.addChild(eventLine);
        eventLine.x = eventHeaderText.width/2;
        eventLine.y=0;
        eventsHolder.addChild(eventHeader);

        // click events
        
        eventHeader.on('mousedown', (event) => {
            event.stopPropagation(); // Prevent event bubbling
            editingEvent = eventHeader;
        });

        eventHeader.on('rightclick', (event) => {
            event.stopPropagation();
            event.preventDefault(); // Prevent context menu
            // delete the event
            eventsHolder.removeChild(eventHeader);
            rerenderAllNotes();
        });

        eventHeader.on('mouseup', (event) => {
            if (editingEvent === eventHeader) {
                editingEvent = null; // reset editing event
            }
            rerenderAllNotes();
            /*if (!notec._dbc){
                notec._dbc = true; // mark as double-click maybe in progress
                setTimeout(() => { notec._dbc = false; }, 300); // reset after 300ms
            }else{
                startEditingNoteText(notec);
            }*/
        });

        eventHeader.on('mouseover', (event) => {
            // move the header to the top of the hierarchy
            eventsHolder.setChildIndex(eventHeader, eventsHolder.children.length - 1);
        });

        /*eventHeader.on('mouseover', (event) => {

        });

        eventHeader.on('mouseout', () => {

        });*/

        rerenderAllNotes();
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
        return eventsHolder.children.filter(event => event instanceof PIXI.Container && event._line);
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
            const noteBend = [];
            note._bend.forEach((bendi) => {
                noteBend.push({pos:bendi.pos/beatToPixel, val:notes[noteIndex-bendi.val].name});
            });
            // optimize bend points. TODO: more optimization
            let optimizedBend = [];
            let lastVal = 0;
            for (let i = 0; i < noteBend.length; i++) {
                if (i==0)
                    continue; // first point will always be 0 internally
                /*if (noteBend[i].val == lastVal && i != noteBend.length -1 && noteBend[i+1].val == lastVal){ // this is what I mean by "more optimization" but it's WIP
                    continue;
                }*/
                optimizedBend.push(noteBend[i]);
                lastVal = noteBend[i].val;
            }
            if (optimizedBend.length == 1 && optimizedBend[0].val == noteName){
                optimizedBend = [];
            }
            cnotes.push({ note: noteName, pos, durBeats,text:noteText, bend:optimizedBend});
        });
        return cnotes.sort(function(a,b){
            return a.pos-b.pos
        });
    }

    function getAllEventsConverted() {
        const cevents = [];
        getAllEvents().forEach((event) => {
            const pos = event.x / beatToPixel;
            const eventData = event._eventData;
            eventData.pos = pos;
            cevents.push(eventData);
        });
        return cevents.sort(function(a,b){
            return a.pos-b.pos
        });
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
        if (!audioPlayer.paused){
            audioPlayer.currentTime=(localPos.x / beatToPixel) * (60 / getBpm());
            return;
        }
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
            notePlacementHelper.text = `${noteName}`;
            notePlacementHelper.x = newPos;
            notePlacementHelper.y = (noteIndex-1) * noteHeight;
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
            placingNote.rerenderBend();
            const noteName = notes[noteIndex].name;
            if (lastPreviewedNote !== noteName) {
                previewNote(noteName);
                lastPreviewedNote = noteName;
            }
            notePlacementHelper.text = `${noteName}`;
            notePlacementHelper.x = newPos;
            notePlacementHelper.y = (noteIndex-1) * noteHeight;

        }else if (resizingNote) {
            let width = resizingNote._nWidth;
            width = localPos.x - resizingNote.x;

            // snap width to grid
            const gridSize = getGridSize();
            width = Math.round(width / (gridSize * beatToPixel)) * (gridSize * beatToPixel);
            // clamp width to minimum of 1 beat and max of 900px
            width = Math.max(gridSize*beatToPixel, Math.min(900, width));

            const overlappingNote = getAllNotesExcept(resizingNote).find(othernote => doNotePosOverlap(othernote, resizingNote.x, width));
            clearAllNoteTints();
            if (overlappingNote) {
                overlappingNote.tint = 0xF00000; // highlight overlapping notes
                return;
            }

            resizingNote.changeSize(width)
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
                    (editingBendPoint.bendPointId === editingBendPoint.note._bend[editingBendPoint.note._bend.length - 1].id) || // do not allow moving the last bend point in x dir
                    (bendi.id !== editingBendPoint.bendPointId && approxEqual(bendi.pos, snapBendX)) // do not allow overlap of bend points
                ) {
                    snapBendX = editingBendPoint.note._bend.find(bendi => bendi.id === editingBendPoint.bendPointId).pos; // reset to original pos (probably a better way to do this?)
                    break;
                }
            }

            let bendVal = ((noteHeight/2) - bendLocalY) / (noteHeight);
            bendVal = Math.max(-10, Math.min(10, bendVal)); 
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
        notePlacementHelper.text = '';
        setProgressThingyPos((-scrollX)/getMaxScroll());
    }

    function eventHeaderPointerMove(event) {

    }

    function getSongData() {
        const songData = {
            bpm: getBpm(),
            notes: getAllNotesConverted(),
            events: getAllEventsConverted(),
            lang: langSelect.value
        };
        return songData;
    }

    function getSongDataFromChunk(chunk){
        const songData = {
            bpm: getBpm(),
            notes: chunk.data.notes,
            events: chunk.data.events,
            lang: langSelect.value
        };
        return songData;
    }

    function getMaxNotePos(){
        const songData = getSongData();
        return Math.max(...songData.notes.map(x=>x.pos+x.durBeats))
    }

    function getMaxScroll(){
        return ((getMaxNotePos()*beatToPixel))-scrollBuff;
    }

    playButton.addEventListener('click', async () => {
        if (!audioPlayer.paused){
            audioPlayer.pause();
            return;
        }
        //const songData = getSongData();
        const audioCtx = new AudioContext();
        const chunks = calcChunks();
        for (let i = 0;i<chunks.length;i++){
            if (chunks[i].type != "notes")
                continue;
            const chunkHashBuf= await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(chunks[i])))
            const chunkHash=Array.from(new Uint8Array(chunkHashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
            chunks[i].hash=chunkHash; // it should be safe to do this since we're not re-hashing this.. hopefully...
        }
        const hashes = chunks.filter(c=>c.type=="notes").map(c=>c.hash)
        for (const key of Object.keys(chunkCache)){
            if (!hashes.includes(key)){
                delete chunkCache[key]
            }
        }
        const buffers=[]
        i=0;
        for (chunk of chunks){
            console.log("gen chunk "+i+"/"+chunks.length)
            i++;
            if (chunk.type === 'silence'){
                const durationSec = chunk.length * (60 / getBpm());
                const silentBuffer = audioCtx.createBuffer(1, Math.ceil(durationSec * audioCtx.sampleRate), audioCtx.sampleRate);
                buffers.push(silentBuffer);
            }else{
                let song = undefined;

                if (chunkCache[chunk.hash]){
                    song = chunkCache[chunk.hash]
                }else{
                    const chunkSong = getSongDataFromChunk(chunk)
                    song = await generateSong(chunkSong);
                    chunkCache[chunk.hash]=song;
                    saveCache();
                }
                const songAudio = await audioCtx.decodeAudioData(song.slice(0))
                buffers.push(songAudio)
            }
        }

        const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
        const numChannels = Math.max(...buffers.map(b => b.numberOfChannels));
        const combined = audioCtx.createBuffer(numChannels, totalLength, audioCtx.sampleRate);

        let offset = 0;
        for (const buf of buffers) {
            for (let ch = 0; ch < buf.numberOfChannels; ch++) {
                combined.getChannelData(ch).set(buf.getChannelData(ch), offset);
            }
            offset += buf.length;
        }

        audioPlayer.src = URL.createObjectURL(new Blob([audioBufferToWav(combined)]));
        audioPlayer.play();
        saveGenSongButton.disabled = false;

        //console.log(buffers);
    });

    pianoTrackContainer.on('mouseup', pianoTrackPointerUp);
    pianoTrackContainer.on('mousemove',pianoTrackPointerMove)
    pianoTrackContainer.on('mousedown',pianoTrackPointerDown);

    eventHeadersContainer.on('mousemove', event => {
        if (editingEvent) {
            const localPos = event.data.getLocalPosition(eventsHolder);
            const newPos = Math.max(0, localPos.x); // prevent negative positions
            // snap newPos to grid
            const gridSize = getGridSize();
            const snappedPos = Math.round(newPos / (gridSize * beatToPixel)) * (gridSize * beatToPixel);
            if (getAllEvents().some((e=>e.x==snappedPos && e._eventData.name==editingEvent._eventData.name)))
                return; // cannot overwrite notes
            editingEvent.x = snappedPos;
            rerenderAllNotes();
            app.render();
        }
    });

    
    // handle scroll wheel
    canvElement.addEventListener('wheel', (event) => {
        event.stopPropagation();
        if (event.shiftKey) {
            prevScrollX = scrollX;
            if (event.deltaY < 0) {
                scrollX += beatToPixel*1; // scroll left
            } else {
                scrollX -= beatToPixel*1; // scroll right
            }
            scrollX = Math.min(0, scrollX); // prevent underscroll
            const maxScroll = getMaxScroll();
            if (-scrollX >= maxScroll){
                if (-prevScrollX >= maxScroll)
                    scrollX = maxScroll;
                else
                {
                    scrollX = prevScrollX // prevent overscroll
                    return;
                }
            }
            setProgressThingyPos((-scrollX)/maxScroll)
            pianoTrackContainer.x = noteX + noteWidth + scrollX;
            trackBg.x = noteX - scrollX;
            gridLines.x = -scrollX;
            eventsHolder.x = scrollX;
        }else{
            if (event.deltaY < 0) {
            scrollY += noteHeight*1; // scroll up
            } else {
                scrollY -= noteHeight*1; // scroll down
            }
            scrollY = Math.min(0, scrollY); // prevent underscroll
            // todo: prevent overscroll
            pianoRollContainer.y = scrollY+topBuffer;
        }
        app.render();
    });

    function saveSong(){
        // save to local storage as "song"
        const songData = getSongData();
        localStorage.setItem('song', JSON.stringify(songData));
    }

    function loadSong(){
        const songDataStr = localStorage.getItem('song');
        if (!songDataStr) {
            alert('No saved song found.');
            return;
        }
        const songData = JSON.parse(songDataStr);
        setBpm(songData.bpm || 120);

        // clear existing notes and events
        notesHolder.removeChildren();
        eventsHolder.removeChildren()
        // force update
        app.render();


        // add notes
        songData.notes.forEach(noteData => {
            const noteIndex = notes.findIndex(n => n.name === noteData.note);
            if (noteIndex === -1) {
                console.warn(`Note ${noteData.note} not found in note list.`);
                return;
            }
            const note = addNote(noteIndex, noteData.pos * beatToPixel, noteData.durBeats);
            if (!note) {
                console.warn(`Could not add note ${noteData.note} at pos ${noteData.pos}.`);
                return;
            }
            if (noteData.text) {
                setNoteText(note, noteData.text);
            }
            // set bend points
            if (noteData.bend) {
                note._bend = [{pos:0,val:0,e:false,id:genId()}]; // reset bend points
                noteData.bend.forEach(bendi => {
                    note._bend.push({pos:bendi.pos * beatToPixel,val:noteIndex-notes.findIndex(n => n.name === bendi.val),e:true,id:genId()});
                });
                note._bend.sort((a,b) => a.pos - b.pos);
                note.fillinBend();
                note.rerenderBend();
            }
        });

        // add events
        songData.events.forEach(eventData => {
            addEvent(eventData, eventData.pos * beatToPixel);
        });
    }

    saveButton.addEventListener('click', () => {
        saveSong();
    });
    loadButton.addEventListener('click', () => {
        loadSong();
    });

    function parseEntry(entry){
        entry = entry.trim();
        eq = entry.indexOf('=')
        const key = entry.substring(0,eq);
        const value = entry.substring(eq+1)
        return {"key":key,"value":value}
    }

    importButton.addEventListener('click',()=>{
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = ".ust,.mid"
        input.click();
        input.onchange = async e => { 
            var file = e.target.files[0];
            selectedFile = file;
            showImportDialog();

        }
    })

    completeImportbutton.addEventListener('click',async ()=>{
        importDialog.removeAttribute('open');
        // todo: show "importing..."
        if (selectedFile.name.endsWith(".ust")){

            await handleUstImport(selectedFile);
        }else if (selectedFile.name.endsWith(".mid")){
            await handleMidiImport(selectedFile);
        }
        selectedFile = undefined;
        
    });

    cancelImportbutton.addEventListener('click',()=>{
        selectedFile = undefined;
        importDialog.removeAttribute('open');
    });

    function showImportDialog(){
        importDialog.setAttribute('open', 'true');
    }

    async function handleUstImport(file){
        const txt = await file.arrayBuffer().then(buf => 
            new TextDecoder('shift-jis').decode(buf)
        );
        const j = USTParser.ustToJSON(txt);
        let nn=0;
        let cl = 0;
        for (part of j){
            if (typeof part.section === "number" && "entries" in part){
                // probably a note
                length=-1;
                note=-1;
                lyric=undefined
                for (entry of part.entries._){
                    const parsed = parseEntry(entry)
                    if (parsed.key === "NoteNum"){
                        let parsedNote = parseInt(parsed.value);
                        if (parsedNote > maxMidiNote){
                            parsedNote=maxMidiNote;
                        }
                        const v = maxMidiNote - parsedNote;
                        note=v;
                    }else if (parsed.key === "Length"){
                        length = parseInt(parsed.value)/480;
                    }else if (parsed.key === "Lyric"){
                        lyric = parsed.value;
                    }
                    
                }
                if (length != -1 && note != -1){
                    if (lyric !== "R" && lyric !== "r")
                    {
                        let finalLength = length;
                        const blen = finalLength*bMult;
                        if (blen > 99) // hard limit by the tts engine!
                            finalLength = 98/bMult;
                        if (toromaji.checked)
                            lyric = wanakana.toRomaji(lyric)
                        
                        if (rb_remspaces.checked)
                            lyric = lyric.replaceAll(" ","")
                        else if (rb_keepfirst.checked)
                            lyric = lyric.split(" ")[0]
                        else if (rb_keeplast.checked)
                            lyric = lyric.split(" ").slice(-1)
                        addNote(note, cl * beatToPixel, finalLength,lyric);
                    }
                    nn++;
                    cl+=length
                }
            }else if (part.section === "SETTING"){
                for (const entry of part.entries._){
                    const parsed = parseEntry(entry)
                    if (parsed.key === "Tempo"){
                        setBpm(parseFloat(parsed.value))
                    }
                }
            }
        }
    }

    async function handleMidiImport(file){
        const ab = await file.arrayBuffer();
        const res = MidiParser.parse(new Uint8Array(ab));
        console.log(res)
        // TODO: Don't forget checking the note is valid! (between min/max midi notes)
    }


    async function fixPlusSymbols(){
        const sortedNotes=getAllNotes().sort((a,b)=> a.x-b.x);
        let lastWordNote=undefined;
        let accumSymb=[]
        let failedConversions = 0;

        function testChain(){
            if (lastWordNote != undefined && accumSymb.length > 0){
                const wordToJoin = getNoteText(lastWordNote);
                const sampa = toFlatSampa(wordToJoin)
                if (sampa.length != (accumSymb.length+1)){
                    failedConversions++;
                }else{
                    const lastNote=accumSymb[accumSymb.length-1];
                    for (let i = 0;i<sampa.length;i++){
                        if (i==0)
                            setNoteText(lastWordNote,sampa[i])
                        else
                            setNoteText(accumSymb[i-1],sampa[i])
                    }
                    const possibleOffEvent = getAllEvents().filter(e=>e.x==lastWordNote.x)[0];
                    if (possibleOffEvent){
                        // assume there's already a "phonetic ON event, and delete this OFF event"
                        eventsHolder.removeChild(possibleOffEvent)
                    }else{
                        addEvent({"name":"phonetic","vars":{"state":1}},lastWordNote.x)
                    }
                    
                    addEvent({"name":"phonetic","vars":{"state":0}},lastNote.x+lastNote._nWidth)
                }
                accumSymb = []
            }
        }

        for (note of sortedNotes){
            const text = getNoteText(note);
            if (text!="+"){
                testChain();

                lastWordNote=note;
            }else if (lastWordNote != undefined){
                accumSymb.push(note);
            }
        }
        testChain();
    }

    async function fixMinusSymbols(){
        const sortedNotes=getAllNotes().sort((a,b)=> a.x-b.x);
        let lastWordNote=undefined;
        let accumSymb=[]

        function testChain(){
            if (lastWordNote != undefined && accumSymb.length > 0){
                const firstNote = Math.floor(lastWordNote.y / noteHeight);
                const bendPoses = accumSymb.map(n=>[n.x-lastWordNote.x,firstNote-Math.floor(n.y / noteHeight)])
                const width = accumSymb[accumSymb.length-1]._nWidth;
                const lastPos = accumSymb[accumSymb.length-1].x + width
                for (symb of accumSymb)
                    notesHolder.removeChild(symb);
                lastWordNote.changeSize(lastPos - lastWordNote.x)
                const lastBendNote = bendPoses[bendPoses.length-1][1]
                lastWordNote._bend=[
                    {pos:0,val:0,e:false,id:genId()},
                    ...bendPoses.map(p=>({pos:p[0],val:p[1],e:false,id:genId()})),
                    {pos:width,val:lastBendNote,e:false,id:genId()}
                ]
                lastWordNote.fillinBend();
                lastWordNote.rerenderBend();
                
                accumSymb = []
            }
        }

        for (note of sortedNotes){
            const text = getNoteText(note);
            if (text!="-"){
                testChain();

                lastWordNote=note;
            }else if (lastWordNote != undefined){
                accumSymb.push(note);
            }
        }
        testChain();
    }
    window.test=[fixPlusSymbols,fixMinusSymbols]

    function calcChunks(){
        let chunks=[]
        let currentChunk = {
            notes:[],
            events:[],
        }
        const song = getSongData();
        const notes = song.notes;
        const events = song.events;
        //console.log(song);
        let beat = 0;
        let lastNote=undefined;
        let lastEosPos=-1;
        let lastEventPos=-1;
        
        let eventIdx = 0;

        function commitChunk(){
            const lastEventsOfType={}
            const noteChunks = chunks.filter(c=>c.type=="notes")
            if (noteChunks.length > 0){
                const lastNoteChunk=noteChunks[noteChunks.length-1];
                for (ev of lastNoteChunk.data.events)
                    lastEventsOfType[ev.name] = JSON.parse(JSON.stringify(ev))
            }

            beat=0;
            if (currentChunk.notes.length == 0)
            {
                currentChunk={notes:[],events:[]}
                return; // ???
            }
            const firstNotePos = currentChunk.notes[0].pos
            for (const note of currentChunk.notes){
                note.pos-=firstNotePos;
            }
            for (const event of currentChunk.events){
                event.pos-=firstNotePos;
            }
            for (eot of Object.values(lastEventsOfType)){
                if (!currentChunk.events.some(e=>e.name==eot.name && approxEqual(e.pos,0)))
                    currentChunk.events.push({...eot,pos:0})
            }

            currentChunk.notes.sort((a,b)=>a.pos-b.pos)
            currentChunk.events.sort((a,b)=>a.pos-b.pos)
            chunks.push({"type":"notes",data:currentChunk});
            currentChunk={notes:[],events:[]}
        }

        function commitSilence(length){
            chunks.push({"type":"silence",length:length})
        }

        for (const note of notes){
            if (lastNote && (lastNote.pos+lastNote.durBeats) < note.pos){
                const pauseLen = note.pos - (lastNote.pos+lastNote.durBeats)
                commitChunk();
                commitSilence(pauseLen);
            }else if (!lastNote && note.pos > 0){
                commitSilence(note.pos)
            }

            while (eventIdx < events.length && events[eventIdx].pos <= (note.pos+note.durBeats)) {
                const event = events[eventIdx++];
                if (event.name === "eos" && event.pos !== lastEosPos) {
                    lastEosPos = event.pos;
                    commitChunk();
                } else {
                    currentChunk.events.push(event);
                }
            }
            lastNote=note;
            newbeat=beat+(note.durBeats*bMult)
            if (newbeat > 99){ // hard limit by the tts engine!
                commitChunk();
                newbeat=beat+(note.durBeats*bMult);
            }
            //console.log(note,beat)
            currentChunk.notes.push({...note,beat:beat});
            beat=newbeat
        }
        if (currentChunk.notes.length > 0 || currentChunk.events.length > 0)
        {
            commitChunk();
        }
        return chunks;
    }
}
main();