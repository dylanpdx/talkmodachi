#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include "mem.h"
#include <3ds.h>
#include "tomoFunc.h"
#include "tomoStructs.h"

enum audioStatus{
	WAITING_FOR_TEXT = 1,
	PROCESSING = 2,
	PROCESSING_FINISHED = 3,
	ERROR = 4,
	TEXT_READY = 5
};

typedef struct{
	volatile enum audioStatus status;
	volatile char bpm, stretch;
	volatile char pitch,speed,quality,tone,accent,intonation;
	int audioSize;
	char* audioData;
	int allocatedSize;
	volatile char language;
	volatile char songDataSize;
	short songData[255];
} audioRenderJob;

#define textDataLoc 0x00b27daa // random unused (hopefully) memory location
audioRenderJob* audioJob = (audioRenderJob*)0x00af340d; // other unused memory location

#define debugDataLoc 0x004110f0

int* ttsPtr = 0x0;
int ttsNumber=0;

/*#ifdef REGION_EU // TODO: this code currently does not work
void initTTSGlobal(){
	ttsGlobal* global = getTtsGlobal();
	if (global == 0x0){
		ttsGlobal* newGlobal = (ttsGlobal*)tmalloc(sizeof(ttsGlobal));
		memset(newGlobal,0,sizeof(ttsGlobal));
		newTtsGlobalFunc(newGlobal);
		setTTSGlobal(newGlobal);
		setupTtsGlobalFunc(newGlobal);
	}
}

void freeTTSGlobal(){
	ttsGlobal* global = getTtsGlobal();
	if (global != 0x0){
		global->vtable->free_ttsClass(global);
		global->vtable->free_ttsGlobal(global);
		setTTSGlobal(0x0);
	}
}
#endif*/

int getSysRegion(){
	#ifdef REGION_US
	return 0x1;
	#elif REGION_EU
	return 0x2;
	#endif
}

int getSysLang(){
	// 1 = English US
	// 2 = French
	// 3 = German
	// 4 = Italian
	// 5 = Spanish
	if (audioJob->language < 1 || audioJob->language > 5)
		while (audioJob->language < 1 || audioJob->language > 5)
		{
			// wait for a valid language to be set. this is a lazy fix since currently languages cannot be switched in runtime
		}
	//if (audioJob->language < 1 || audioJob->language > 5)
		//return 1;
	return audioJob->language;
}

uint16_t* utfTo16(char* in,int* len){
	int inLen = strlen(in)+1;
	*len = inLen*2;
	uint16_t* out = (uint16_t*)tmalloc(*len);
	for (int i = 0; i < inLen; i++){
		out[i] = in[i];
	}
	return out;
}

char* u16toUtf(uint16_t* in,int len){
	char* out = (char*)tmalloc(len/2+1);
	for (int i = 0; i < len/2; i++){
		out[i] = in[i];
	}
	out[len/2] = 0;
	return out;
}

int wcslen(const uint16_t* start)
{
    // NB: start is not checked for nullptr!
    const uint16_t* end = start;
    while (*end != 0)
        ++end;
    return end - start;
}

// Receives UTF-16 string and stores it in memory
uint16_t* utfRecv(uint16_t* in,int* len){
	int inLen = wcslen(in);
	*len = inLen;
	uint16_t* out = (uint16_t*)tmalloc(*len*2);
	for (int i = 0; i <= inLen; i++){
		out[i] = in[i];
	}
	return out;
}

void callTTS(uint16_t* text){
	int textSize = wcslen(text)*2;
	ttsGlobal* ttsGlob = getTtsGlobal();
	RESET_TTSFunc(ttsGlob->mainTtsClass->effects);

	// write text length to debugDataLoc
	//*(int*)debugDataLoc = textSize;
	// write text to debugDataLoc+4
	//memcpy((void*)(debugDataLoc+4),text,textSize);

	setVoicePitchFunc(ttsGlob,audioJob->pitch);
	setVoiceSpeedFunc(ttsGlob,audioJob->speed);
	setVoiceQualityFunc(ttsGlob,audioJob->quality);
	setVoiceToneFunc(ttsGlob,audioJob->tone);
	setVoiceAccentFunc(ttsGlob,audioJob->accent);
	setVoiceIntonationFunc(ttsGlob,audioJob->intonation);

	if (audioJob->audioData != 0x0){
		tfree(audioJob->audioData); // free previous audio data
		audioJob->audioData = 0x0;
	}

	// setup
	setupTTS();

	ttsInput* tts = (ttsInput*)tmalloc(sizeof(ttsInput));
	tts->unknown = 0;
	tts->textInputLen = textSize;
	tts->textInput = text;

	uint r = ttsFunc(ttsPtr,ttsNumber,tts);
	// we have finished rendering the audio
	tfree(tts);

	if (audioJob->status !=ERROR){
		audioJob->status = PROCESSING_FINISHED;
	}
}

void saveTtsSettings(int* ptr){
	ttsPtr = (int*)ptr[0];
	ttsNumber = ptr[1];

	audioJob->status = 0;
	audioJob->audioSize = 0;
	audioJob->audioData = 0x0;
	audioJob->pitch = 50;
	audioJob->speed = 50;
	audioJob->quality = 50;
	audioJob->tone = 50;
	audioJob->accent = 50;
	audioJob->intonation = 0;
}

void mainLoopF(){
	int sz = 0;
	int* ptr = (int*)((int*)ADDR_unknown_ptr)[0];
	int loadedLang = getSysLang();

	audioJob->status = WAITING_FOR_TEXT;
	while(true){
		if (audioJob->status==TEXT_READY){
			audioJob->status = PROCESSING;
			audioJob->audioSize = 0; // reset audio size

			/*#ifdef REGION_EU // TODO: this code currently does not work
			if (loadedLang != getSysLang()){
				freeTTSGlobal();
				loadedLang = 2;
				audioJob->language = loadedLang;
				initTTSGlobal();
			}
			#endif*/

			// save the text data
			int textSize = 0;
			//uint16_t* text = utfTo16((char*)textDataLoc,&textSize);
			uint16_t* text = utfRecv((uint16_t*)textDataLoc,&textSize);

			if (audioJob->songDataSize == 0){
				callTTS(text);
			}else{
				singingParams* effectsDataLoc = tmalloc(0x1000);
				uint16_t* mrkDataLoc = tmalloc(0x1000);
				// zero effectsDataLoc
				memset(effectsDataLoc,0,0x1000);

				setupSingingParamsFunc(effectsDataLoc);
				int bpm = audioJob->bpm;
				int stretch = audioJob->stretch;
				msbtToTextFunc((void*)ptr[4],(char*)textDataLoc,&sz,0x200,(short*)((char*)&audioJob->songData-1),audioJob->songDataSize);
				textToEffectsFunc((int*)effectsDataLoc,(char*)textDataLoc,sz*2,stretch,0); // outputs @ outputvar+0x228
				repairSingingParamsFunc(effectsDataLoc,0);

				effectsDataLoc->bpm = bpm*2;
				effectsDataLoc->field4_0x210 = 1; // root note

				generateMrkFunc((char*)mrkDataLoc,0x1800,(char*)text,(uint16_t*)effectsDataLoc,0x30FD,0,0);
				
				callTTS(mrkDataLoc);

				tfree(effectsDataLoc);
				tfree(mrkDataLoc);
			}

			tfree(text);
		}
	}
}

int audioDataGet(char* inData,int audioDataLen){
	if (audioDataLen==0)
		return 0xc8a0a7f8;
	// add received audio data to the job
	
	if (audioJob->audioData == 0x0){
		audioJob->allocatedSize = audioDataLen*4;
		audioJob->audioData = (char*)tmalloc(audioJob->allocatedSize);
		audioJob->audioSize = 0;
	}

	if (audioJob->audioSize+audioDataLen > audioJob->allocatedSize){
		audioJob->allocatedSize = audioJob->audioSize+audioDataLen;
		audioJob->audioData = (char*)trealloc(audioJob->audioData,audioJob->allocatedSize);
	}

	memcpy(audioJob->audioData+audioJob->audioSize,inData,audioDataLen);
	audioJob->audioSize += audioDataLen;

	return 0xc8a0a7f8;
}