#pragma once
#include <3ds.h>
#include "tomoStructs.h"

typedef struct {
	int unknown; // always 0
	int textInputLen; // length of text * 2
	uint16_t *textInput;
}  ttsInput;

typedef uint doTTS(int *param_1,int param_2,ttsInput *param_3);
static doTTS* ttsFunc = (doTTS*)0x00191e40;

// converts MSBT codes to xml-like text describing the effects applied to the audio
typedef void msbtToText(void* functionTable,char* output,int* outputSize,int unknown,short* msbtData,int msbtDataSize); // unknown is always 0x200; functionTable is always (DAT_00acb5a4 + 0x10);
static msbtToText* msbtToTextFunc = (msbtToText*)0x003d3968;

// converts xml-like text to effect codes used to generate the final output
typedef void textToEffects(int* output,char* text,int textLen,int scaling,int unknown); // last is always 0
static textToEffects* textToEffectsFunc = (textToEffects*)0x007442e4;

// generates the final output based on rawText (text to speak) and effects (effects to apply)
typedef void generateMrk(char* output,int unknown,char* rawText,uint16_t* effects,int unknown2,int unknown3,int unknown4); // unknown=0x1800; unknown2=0x30FD; unknown 3/4=0
static generateMrk* generateMrkFunc = (generateMrk*)0x007414e0;

typedef char getIsMouthOpenAtSampleTime(audioEffectsParams* effects,int sampleTime);
static getIsMouthOpenAtSampleTime* getIsMouthOpenAtSampleTimeFunc = (getIsMouthOpenAtSampleTime*)0x00743b58;

typedef void setVoicePitch(ttsGlobal* effects,int pitch);
static setVoicePitch* setVoicePitchFunc = (setVoicePitch*)0x003912fc;

typedef void setVoiceSpeed(ttsGlobal* effects,int speed);
static setVoiceSpeed* setVoiceSpeedFunc = (setVoiceSpeed*)0x0039130c;

typedef void setVoiceQuality(ttsGlobal* effects,int quality);
static setVoiceQuality* setVoiceQualityFunc = (setVoiceQuality*)0x003912ec;

typedef void setVoiceTone(ttsGlobal* effects,int tone);
static setVoiceTone* setVoiceToneFunc = (setVoiceTone*)0x0039133c;

typedef void setVoiceAccent(ttsGlobal* effects,int accent);
static setVoiceAccent* setVoiceAccentFunc = (setVoiceAccent*)0x0039131c;

// intonation
typedef void setVoiceIntonation(ttsGlobal* effects,int intonation);
static setVoiceIntonation* setVoiceIntonationFunc = (setVoiceIntonation*)0x0039132c;

void setupTTS();

ttsGlobal* getTtsGlobal();