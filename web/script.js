const apiUrl = 'http://localhost:5000/tts';
const textInput = document.getElementById('textInput');
const generateBtn = document.getElementById('generateBtn');
const status = document.getElementById('status');
const audioPlayer = document.getElementById('audioPlayer');
const toggleControls = document.getElementById('toggleControls');
const controlsContainer = document.getElementById('controlsContainer');
const downloadButton = document.getElementById('downloadButton');

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
	fetch(apiUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestData),
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

// Enter generates
textInput.addEventListener('keydown', function(event) {
	if (event.key === 'Enter' && !event.shiftKey) {
		event.preventDefault();
		generateSpeech();
	}
});

// Toggle playback with button
function togglePlay() {
	if (audioPlayer.paused) {
		audioPlayer.play()
	} else {
		audioPlayer.pause()
	}
}