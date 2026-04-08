const voicesSelect = document.getElementById('savedVoices');

const presetVoices = {
	youngm:{accent: 25,intonation: 0,pitch: 60,quality: 72,speed: 59,tone: 25},
	youngf:{accent: 25,intonation: 0,pitch: 83,quality: 78,speed: 65,tone: 25},
	adultm:{accent: 25,intonation: 0,pitch: 33,quality: 39,speed: 52,tone: 25},
	adultf:{accent: 25,intonation: 0,pitch: 68,quality: 58,speed: 39,tone: 25},
	oldm:{accent: 25,intonation: 0,pitch: 25,quality: 39,speed: 29,tone: 15},
	oldf:{accent: 42,intonation: 0,pitch: 67,quality: 69,speed: 18,tone: 12}
}

function toggleManageVoices() {
	if (manageVoicesDialog.hasAttribute('open')) {
		manageVoicesDialog.removeAttribute('open');
	} else {
		manageVoicesDialog.setAttribute('open', 'true');
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
			<button class="yellow voiceElem" id="delete-voice">Delete</button>
			<button class="yellow voiceElem" id="share-voice">Share</button>
        </div>
		`
		const voiceDiv = document.createElement('div');
		voiceDiv.innerHTML = voiceHtml;
		const voiceName = voiceDiv.querySelector('.voiceName');
		const voiceImg = voiceDiv.querySelector('.voiceImg');
		const voiceButton = voiceDiv.querySelector('#delete-voice');
		const shareButton = voiceDiv.querySelector('#share-voice');
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
		shareButton.addEventListener('click', function() {
			// Share voice logic
			const voiceData = encodeURIComponent(JSON.stringify(voice));
			const shareUrl = `${window.location.origin}${window.location.pathname}?voice=${voiceData}`;
			prompt("Share this URL to share the voice:", shareUrl);
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