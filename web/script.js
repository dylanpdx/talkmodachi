const apiUrl = '/tts';
const textInput = document.getElementById('textInput');
const generateBtn = document.getElementById('generateBtn');
const status = document.getElementById('status');
const audioPlayer = document.getElementById('audioPlayer');
const toggleControls = document.getElementById('toggleControls');
const controlsContainer = document.getElementById('controlsContainer');
const downloadButton = document.getElementById('downloadButton');
const voicesSelect = document.getElementById('savedVoices');
const manageVoicesList = document.getElementById('manageVoicesList');
const manageVoicesDialog = document.getElementById('manageVoicesDialog');
const manageVoicesBtn = document.getElementById('manageVoicesBtn');
const voiceLanguageSelect = document.getElementById('languageSelect');

const presetVoices = {
	youngm:{accent: 25,intonation: 0,pitch: 60,quality: 72,speed: 59,tone: 25},
	youngf:{accent: 25,intonation: 0,pitch: 83,quality: 78,speed: 65,tone: 25},
	adultm:{accent: 25,intonation: 0,pitch: 33,quality: 39,speed: 52,tone: 25},
	adultf:{accent: 25,intonation: 0,pitch: 68,quality: 58,speed: 39,tone: 25},
	oldm:{accent: 25,intonation: 0,pitch: 25,quality: 39,speed: 29,tone: 15},
	oldf:{accent: 42,intonation: 0,pitch: 67,quality: 69,speed: 18,tone: 12}
}

// Initialize things for the VM
/*var Module = typeof Module !== 'undefined' ? Module : {};
Module['preRun'] = Module['preRun'] || [];
Module["locateFile"] = function (path,scriptDirectory) {
	return "/assets/" + path;
};

Module['preRun'].push((mod) => {
    mod.FS.mkdir('/share');
	mod.FS.mkdir('/share/user');
	mod.FS.mkdir('/share/user/config');

	// fetch citra.bin and write it to /share
	fetch('/assets/citra')
	.then(response => response.arrayBuffer())
	.then(buffer => {
		const data = new Uint8Array(buffer);
		mod.FS.writeFile('/share/citra', data);
		mod.FS.chmod('/share/citra', 0o755);
	});

	fetch('/assets/config.ini')
	.then(response => response.arrayBuffer())
	.then(buffer => {
		const data = new Uint8Array(buffer);
		mod.FS.writeFile('/share/user/config/sdl2-config.ini', data);
	});

    //mod.FS.writeFile('/share/file', 'test');
});

function sendFileToVM(file) {
	const reader = new FileReader();
	reader.onload = function() {
		const data = new Uint8Array(reader.result);
		Module.FS.writeFile('/share/' + file.name, data);
	};
	reader.readAsArrayBuffer(file);
}

function upload(){
	// read from file input
	const fileInput = document.getElementById('myfile');
	const files = fileInput.files;
	for (let i = 0; i < files.length; i++) {
		sendFileToVM(files[i]);
	}
}*/

// Initialize sliders
const sliders = {
	'pitch': document.getElementById('pitchSlider'),
	'speed': document.getElementById('speedSlider'),
	'quality': document.getElementById('qualitySlider'),
	'tone': document.getElementById('toneSlider'),
	'accent': document.getElementById('accentSlider')
};

for (const slider in sliders) {
	sliders[slider].addEventListener('input', function() {
		voicesSelect.value="";
	});
}

// Toggle controls visibility
toggleControls.addEventListener('click', function() {
	if (controlsContainer.hasAttribute('hidden')) {
		controlsContainer.removeAttribute('hidden');
		toggleControls.textContent = 'Hide Controls';
	} else {
		controlsContainer.setAttribute('hidden', 'true');
		toggleControls.textContent = 'Show Controls';
	}
});

function toggleManageVoices() {
	if (manageVoicesDialog.hasAttribute('open')) {
		manageVoicesDialog.removeAttribute('open');
	} else {
		manageVoicesDialog.setAttribute('open', 'true');
	}
}

function savePreset(){
	// ask for preset name
	const presetName = prompt("Enter a name for the preset:");
	if (!presetName)
		return; // User cancelled
	const voiceParams = getVoiceParameters();
	// hash the voice parameters to create a unique ID
	let voiceId = 0;
	for (const key in voiceParams) {
		if (voiceParams.hasOwnProperty(key)) {
			voiceId = (voiceId << 5) ^ voiceParams[key];
		}
	}
	const presetVoice = {
		name: presetName,
		voice: voiceParams,
		id: voiceId,
	};

	// add to voices
    let voices = loadVoices();
    // remove any existing Miis with the same ID
    voices = voices.filter(voice => voice.id != null && voice.id != presetVoice.id);
    // add the new voice
    voices = voices.concat([presetVoice]);
    saveVoices(voices);
    populateManageVoices();
}


voicesSelect.addEventListener('change', function() {
	const selectedVoice = voicesSelect.value;
	if (selectedVoice.startsWith("default:")){
		const voice = selectedVoice.split(":")[1];
		loadVoiceParameters(presetVoices[voice]);
	}else if (selectedVoice.startsWith("mii:")){
		const miiId = selectedVoice.split(":")[1];
		const voices = loadVoices();
		const voice = voices.find(v => v.id == miiId);
		if (voice) {
			loadVoiceParameters(voice.voice);
		}
		
	}
});

function getVoiceParameters() {
	return {
		pitch: parseFloat(sliders.pitch.value),
		speed: parseFloat(sliders.speed.value),
		quality: parseFloat(sliders.quality.value),
		tone: parseFloat(sliders.tone.value),
		accent: parseFloat(sliders.accent.value),
		intonation: document.querySelector('input[type=radio][name=intonation]:checked').value,
		lang: voiceLanguageSelect.value
	};
}

function generateSpeech() {
	const text = textInput.value.trim();
	
	if (!text) {
		alert('Please enter some text to convert to speech.');
		return;
	}
	
	// Get voice parameters
	const voiceParams = getVoiceParameters();
	
	// Prepare request data
	const requestData = {
		text: text,
		...voiceParams
	};
	
	// Disable button and open output section
	generateBtn.disabled = true;
	document.getElementById('output').removeAttribute('hidden')
	status.innerText = 'Generating speech...';
	
	// Call API
	params=new URLSearchParams(requestData).toString();
	fetch(apiUrl+"?"+params, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('API request failed');
		}
		return response.blob();
	})
	.then(audioBlob => {
		// Create URL for the audio blob
		const audioUrl = URL.createObjectURL(audioBlob);
		
		// Set the audio source and display the player
		audioPlayer.src = audioUrl;
		downloadButton.href = audioUrl;
		audioContainer.removeAttribute('hidden');
		
		// Play the audio automatically
		audioPlayer.play();
		
		// Reset status
		status.innerText = 'Speech generated successfully!';
		generateBtn.disabled = false;
	})
	.catch(error => {
		console.error('Error:', error);
		status.innerText = 'Error generating speech. Please try again.';
		generateBtn.disabled = false;
	});
}

// Toggle playback with button
function togglePlay() {
	if (audioPlayer.paused) {
		audioPlayer.play()
	} else {
		audioPlayer.pause()
	}
}

// Randomize all voice parameters
function randomizeVoiceParameters() {
	voicesSelect.value="";
	for (const key in sliders) {
		if (sliders.hasOwnProperty(key)) {
			const slider = sliders[key];
			slider.value = Math.random() * (slider.max - slider.min) + slider.min;
		}
	}
}

// Load voice parameters
function loadVoiceParameters(voice) {
	for (const key in sliders) {
		if (sliders.hasOwnProperty(key)) {
			const slider = sliders[key];
			slider.value = voice[key];
		}
	}
	// Set intonation radio button
	const intonationRadios = document.querySelectorAll('input[type=radio][name=intonation]');
	for (const radio of intonationRadios) {
		if (radio.value == (voice.intonation+1)) {
			radio.checked = true;
		}
	}
}

function saveVoices(voices){
	// Save voices to local storage
	localStorage.setItem('voices', JSON.stringify(voices));
}

function loadVoices(){
	// Load voices from local storage
	const voices = localStorage.getItem('voices');
	if (voices) {
		return JSON.parse(voices);
	}
	return [];
}

function populateManageVoices(){
	voices = loadVoices();
	// Clear existing options
	manageVoicesList.innerHTML = '';
	if (voices.length == 0){
		const p = document.createElement('p');
		p.textContent = 'No voices saved';
		manageVoicesList.appendChild(p);
		return;
	}
	// Populate the list with saved voices
	for (const voice of voices) {
		voiceHtml = `
		<div class="voice">
			<img src="" class="voiceImg voiceElem" width="50" height="50"/>
			<span class="voiceName voiceElem">Voice 1</span>
			<button class="yellow voiceElem">Delete</button>
        </div>
		`
		const voiceDiv = document.createElement('div');
		voiceDiv.innerHTML = voiceHtml;
		const voiceName = voiceDiv.querySelector('.voiceName');
		const voiceImg = voiceDiv.querySelector('.voiceImg');
		const voiceButton = voiceDiv.querySelector('button');
		voiceName.textContent = voice.name;
		voiceImg.src = voice.imageUrl;
		voiceButton.addEventListener('click', function() {
			// Delete voice logic
			const index = voices.indexOf(voice);
			if (index > -1) {
				voices.splice(index, 1);
				saveVoices(voices);
				populateManageVoices();
			}
		});

		manageVoicesList.appendChild(voiceDiv);

		// remove all with value of "mii:" from voicesSelect
		voicesSelect.querySelectorAll('option[value^="mii:"]').forEach(option => {
			option.remove();
		});
		// add new options to voicesSelect
		for (const voice of voices) {
			const option = document.createElement('option');
			option.value = "mii:" + voice.id;
			option.textContent = voice.name;
			voicesSelect.appendChild(option);
		}
		
	}
}

populateManageVoices();