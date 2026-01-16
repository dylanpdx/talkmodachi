#pragma once
#include <3ds.h>
#include "tomoStructs.h"

#ifdef REGION_US
#define ADDR_unknown_ptr 0x00acb5a4
#define ADDR_ttsGlobal 0x00acb54c
#define ADDR_setupFunc 0x003914e8
#define ADDR_doTTS 0x00191e40
#define ADDR_msbtToText 0x003d3968
#define ADDR_textToEffects 0x007442e4
#define ADDR_generateMrk 0x007414e0
#define ADDR_getIsMouthOpenAtSampleTime 0x00743b58
#define ADDR_setVoicePitch 0x003912fc
#define ADDR_setVoiceSpeed 0x0039130c
#define ADDR_setVoiceQuality 0x003912ec
#define ADDR_setVoiceTone 0x0039133c
#define ADDR_setVoiceAccent 0x0039131c
#define ADDR_setVoiceIntonation 0x0039132c
#define ADDR_setupSingingParams 0x00741654
#define ADDR_repairSingingParams 0x00744bd0
#define ADDR_RESET_TTS 0x001be020
#elif REGION_EU
#define ADDR_unknown_ptr 0x00acd5a4 // TODO: verify this address
#define ADDR_ttsGlobal 0x00acd54c
#define ADDR_newTtsGlobal 0x00107230 // new() for ttsGlobal
#define ADDR_setupTtsGlobal 0x00107180 // setup function for ttsGlobal
#define ADDR_setupFunc 0x00391788
#define ADDR_doTTS 0x00191ef0
#define ADDR_msbtToText 0x003d3c9c
#define ADDR_textToEffects 0x00744ecc
#define ADDR_generateMrk 0x007420c8
#define ADDR_getIsMouthOpenAtSampleTime 0x00744740
#define ADDR_setVoicePitch 0x0039159c
#define ADDR_setVoiceSpeed 0x003915ac
#define ADDR_setVoiceQuality 0x0039158c
#define ADDR_setVoiceTone 0x003915dc
#define ADDR_setVoiceAccent 0x003915bc
#define ADDR_setVoiceIntonation 0x003915cc
#define ADDR_setupSingingParams 0x0074223c
#define ADDR_repairSingingParams 0x007457b8
#define ADDR_RESET_TTS 0x001be0d0
#elif REGION_KR

#endif

typedef struct {
	int unknown; // always 0
	int textInputLen; // length of text * 2
	uint16_t *textInput;
}  ttsInput;

#ifdef REGION_EU
typedef void newTtsGlobal(ttsGlobal* ttsGlob);
static newTtsGlobal* newTtsGlobalFunc = (newTtsGlobal*)ADDR_newTtsGlobal;

typedef void setupTtsGlobal(ttsGlobal* ttsGlob);
static setupTtsGlobal* setupTtsGlobalFunc = (setupTtsGlobal*)ADDR_setupTtsGlobal;
#endif

typedef uint doTTS(int *param_1,int param_2,ttsInput *param_3);
static doTTS* ttsFunc = (doTTS*)ADDR_doTTS;

// converts MSBT codes to xml-like text describing the effects applied to the audio
typedef void msbtToText(void* functionTable,char* output,int* outputSize,int unknown,short* msbtData,int msbtDataSize); // unknown is always 0x200; functionTable is always (DAT_00acb5a4 + 0x10);
static msbtToText* msbtToTextFunc = (msbtToText*)ADDR_msbtToText;

// converts xml-like text to effect codes used to generate the final output
typedef void textToEffects(int* output,char* text,int textLen,int scaling,int unknown); // last is always 0
static textToEffects* textToEffectsFunc = (textToEffects*)ADDR_textToEffects;

// generates the final output based on rawText (text to speak) and effects (effects to apply)
typedef void generateMrk(char* output,int unknown,char* rawText,uint16_t* effects,int unknown2,int unknown3,int unknown4); // unknown=0x1800; unknown2=0x30FD; unknown 3/4=0
static generateMrk* generateMrkFunc = (generateMrk*)ADDR_generateMrk;

typedef char getIsMouthOpenAtSampleTime(audioEffectsParams* effects,int sampleTime);
static getIsMouthOpenAtSampleTime* getIsMouthOpenAtSampleTimeFunc = (getIsMouthOpenAtSampleTime*)ADDR_getIsMouthOpenAtSampleTime;

typedef void setVoicePitch(ttsGlobal* effects,int pitch);
static setVoicePitch* setVoicePitchFunc = (setVoicePitch*)ADDR_setVoicePitch;

typedef void setVoiceSpeed(ttsGlobal* effects,int speed);
static setVoiceSpeed* setVoiceSpeedFunc = (setVoiceSpeed*)ADDR_setVoiceSpeed;

typedef void setVoiceQuality(ttsGlobal* effects,int quality);
static setVoiceQuality* setVoiceQualityFunc = (setVoiceQuality*)ADDR_setVoiceQuality;

typedef void setVoiceTone(ttsGlobal* effects,int tone);
static setVoiceTone* setVoiceToneFunc = (setVoiceTone*)ADDR_setVoiceTone;

typedef void setVoiceAccent(ttsGlobal* effects,int accent);
static setVoiceAccent* setVoiceAccentFunc = (setVoiceAccent*)ADDR_setVoiceAccent;

typedef void setVoiceIntonation(ttsGlobal* effects,int intonation);
static setVoiceIntonation* setVoiceIntonationFunc = (setVoiceIntonation*)ADDR_setVoiceIntonation;

typedef void setupSingingParams(singingParams* singingParams);
static setupSingingParams* setupSingingParamsFunc = (setupSingingParams*)ADDR_setupSingingParams;

typedef void repairSingingParams(singingParams* singingParams,int unknown);
static repairSingingParams* repairSingingParamsFunc = (repairSingingParams*)ADDR_repairSingingParams;

typedef void RESET_TTS(audioEffectsParams* effects);
static RESET_TTS* RESET_TTSFunc = (RESET_TTS*)ADDR_RESET_TTS;

void setupTTS();

ttsGlobal* getTtsGlobal();
void setTTSGlobal(ttsGlobal* newGlobal);