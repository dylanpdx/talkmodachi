#pragma once
#define undefined char
typedef unsigned char    byte;

#define PADDING(start,end) char padding_##start[(end)-(start)]

typedef struct {
    PADDING(0x0,0x3217);
    short lipSyncData[0x300];
} audioEffectsParams;

typedef struct {
    void* vtable;
    PADDING(0x4,0x61b7);
    audioEffectsParams *effects;
} ttsClass; // ingame size: 0x6a10

typedef struct {
    PADDING(0x0,0x7);
    ttsClass *mainTtsClass;
    undefined field9_0xc;
    undefined field10_0xd;
} ttsGlobal; // ingame size: 0x14

typedef struct {
    int effectCodes[131];
    short bpm;
    undefined field2_0x20e;
    undefined field3_0x20f;
    float field4_0x210;
    undefined field5_0x214;
    undefined field6_0x215;
    undefined field7_0x216;
    undefined field8_0x217;
    undefined field9_0x218;
    undefined field10_0x219;
    undefined field11_0x21a;
    undefined field12_0x21b;
    undefined field13_0x21c;
    undefined field14_0x21d;
    undefined field15_0x21e;
    undefined field16_0x21f;
    undefined field17_0x220;
    undefined field18_0x221;
    undefined field19_0x222;
    undefined field20_0x223;
    byte field21_0x224;
    undefined field22_0x225;
    ushort field26_0x226_for_19;
    short field24_0x228;
    short field25_0x22a;
    short field26_0x22c;
    short field27_0x22e;
    byte field28_0x230;
} singingParams;