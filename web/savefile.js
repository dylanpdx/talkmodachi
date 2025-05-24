const miiRenderApi = "mii-unsecure.ariankordi.net"

const fileLoader = document.getElementById("savefileload");
fileLoader.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const data = e.target.result;
            getMiis(data,false);
        };
        reader.readAsArrayBuffer(file);
    }
});

function loadSave() {
    document.getElementById("savefileload").click();
}


function getMiis(data,isJP){ // ArrayBuffer
    // TODO: figure out how JP save files are structured
    // Referenced https://github.com/makinori/tomodachi-life-family-tree/blob/5b685b29232c178af43fc1a53bcc119318df38ea/src/classes/SaveFileReader.ts#L165
    const nameAddress = this.region == isJP ? 0x1c5a : 0x1c8a;
    const miiAddress = this.region == isJP ? 0x0 : 0x1c70;
    const miiStructLen = this.region == isJP ? 0x0 : 0x660;
    const voiceOffset = this.region == isJP ? 0x0 : miiAddress+0x10a;
    const miiIdOffset = this.region == isJP ? 0x0 : miiAddress+0xC;
    reader = new dcodeIO.ByteBuffer();
    reader.append(data);
    miis=[];
    for (let i = 0; i < 100; i++) {
        const nicknameBytes = reader.readBytes(20,nameAddress+i*miiStructLen).toArrayBuffer();
        if (new Uint8Array(nicknameBytes).every(b => b == 0)) {
			break; // no more Miis!
        }
        const miiData = reader.readBytes(0x60, miiAddress + i * miiStructLen).toArrayBuffer();

        // convert from utf16 to utf8
        const nickname = new TextDecoder("utf-16").decode(nicknameBytes).replaceAll("\0",""); // remove null terminators
        
        // convert to base64
        const miiBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(miiData)));
        const miiId = reader.readUint32(miiIdOffset + i * miiStructLen);
        voiceData = {
            pitch: reader.readUint8(voiceOffset + i * miiStructLen),
            speed: reader.readUint8(voiceOffset + i * miiStructLen + 1),
            quality: reader.readUint8(voiceOffset + i * miiStructLen + 2),
            tone: reader.readUint8(voiceOffset + i * miiStructLen + 3),
            accent: reader.readUint8(voiceOffset + i * miiStructLen + 4),
            intonation: reader.readUint8(voiceOffset + i * miiStructLen + 5),
        }
        const miiStudioData = ver3StoreDataToStudioURLData(new Uint8Array(miiData));
        const miiStudioDataHex = bytesToHex(miiStudioData);
        const miiUrl = `https://studio.mii.nintendo.com/miis/image.png?data=${miiStudioDataHex}&type=face&expression=normal&width=270&bgColor=FFFFFF00&clothesColor=default&cameraXRotate=0&cameraYRotate=0&cameraZRotate=0&characterXRotate=0&characterYRotate=0&characterZRotate=0&lightDirectionMode=none&instanceCount=1&instanceRotationMode=model`

        const xmii = {
            name: nickname,
            id: miiId,
            mii: miiBase64,
            imageUrl: miiUrl,
            voice: voiceData,
        }
        miis.push(xmii);
    }

    // add to voices
    let voices = loadVoices();
    // remove any existing Miis with the same ID
    const miiIds = miis.map(m => m.id);
    voices = voices.filter(voice => voice.id == null || !miiIds.includes(voice.id));
    // add the new Mii
    voices = voices.concat(miis);
    saveVoices(voices);
    populateManageVoices();
}