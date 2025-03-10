#pragma once
#define undefined char

#define PADDING(start,end) char padding_##start[(end)-(start)]

typedef struct {
    PADDING(0x0,0x3217);
    short lipSyncData[0x300];
} audioEffectsParams;

typedef struct{
    PADDING(0x0,0x61b7);
    audioEffectsParams *effects;
} effectParamsHolder;

typedef struct {
    PADDING(0x0,0x153);
    effectParamsHolder *ttsInst;
} ttsClass; // ingame size: 0x6a10

typedef struct {
    PADDING(0x0,0x7);
    ttsClass *some_tts_struct;
    undefined field9_0xc;
    undefined field10_0xd;
} ttsGlobal; // ingame size: 0x14