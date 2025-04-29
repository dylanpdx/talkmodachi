const apiUrl = '/tts';
const textInput = document.getElementById('textInput');
const generateBtn = document.getElementById('generateBtn');
const status = document.getElementById('status');
const audioPlayer = document.getElementById('audioPlayer');
const toggleControls = document.getElementById('toggleControls');
const controlsContainer = document.getElementById('controlsContainer');
const downloadButton = document.getElementById('downloadButton');

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

function getVoiceParameters() {
	return {
		pitch: parseFloat(sliders.pitch.value),
		speed: parseFloat(sliders.speed.value),
		quality: parseFloat(sliders.quality.value),
		tone: parseFloat(sliders.tone.value),
		accent: parseFloat(sliders.accent.value),
		intonation: document.querySelector('input[type=radio][name=intonation]:checked').value
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
	for (const key in sliders) {
		if (sliders.hasOwnProperty(key)) {
			const slider = sliders[key];
			slider.value = Math.random() * (slider.max - slider.min) + slider.min;
		}
	}
}