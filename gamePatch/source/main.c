#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include "mem.h"
#include <3ds.h>

typedef struct {
	int eTextFormat; // always 0
	int ulTextLength; // length of text * 2
	uint16_t *szInText;
}  ttsInput;

typedef struct{
	volatile char status; // 1=waiting for text, 2=processing, 3=finished, 4=error, 5=text ready
	int audioSize;
	char* audioData;
	int allocatedSize;
} audioRenderJob;

#define textDataLoc 0x00b27daa // random unused (hopefully) memory location
audioRenderJob* audioJob = (audioRenderJob*)0x008c00e4; // other unused memory location

int* ttsPtr = 0x0;
int ttsNumber=0;

typedef uint doTTS(int *param_1,int param_2,ttsInput *param_3); // no documentation online, so i'm winging it
doTTS* f = (doTTS*)0x00191e40;

void callTTS(char* text){

	if (audioJob->audioData != 0x0){
		tfree(audioJob->audioData); // free previous audio data
		audioJob->audioData = 0x0;
	}

	// setup
	int* ptr = (int*)0x00acb54c;
	((void(*)(int*))0x003914e8)((int*)ptr[0]); // call setup function(?)
	//((void(*)(int*))0x0035adf8)((int*)ptr[0]);

	int len = strlen(text)+1; // include null terminator
	ttsInput* tts = (ttsInput*)tmalloc(sizeof(ttsInput));
	tts->eTextFormat = 0;
	tts->ulTextLength = len*2;
	tts->szInText = (uint16_t*)tmalloc(len*2);
	for (int i = 0; i < len; i++){
		tts->szInText[i] = text[i];
	}

	uint r = f(ttsPtr,ttsNumber,tts);
	// we have finished rendering the audio
	tfree(tts->szInText);
	tfree(tts);


	if (audioJob->status !=4){
		audioJob->status = 3;
	}
}

void saveTtsSettings(int* ptr){
	ttsPtr = (int*)ptr[0];
	ttsNumber = ptr[1];

	audioJob->status = 0;
	audioJob->audioSize = 0;
	audioJob->audioData = 0x0;
}

void mainLoopF(){
	audioJob->status = 1;
	while(true){
		if (audioJob->status==5){
			audioJob->status = 2;
			audioJob->audioSize = 0; // reset audio size
			callTTS((char*)textDataLoc);
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