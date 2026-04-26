#include "tomoFunc.h"
#include "tomoStructs.h"

void setupTTS(){
    #ifndef REGION_JP
    int* ptr = (int*)ADDR_ttsGlobal;
	((void(*)(int*))ADDR_setupFunc)((int*)ptr[0]); // call setup function(?)
    //((void(*)(int*))0x0035adf8)((int*)ptr[0]);
    #endif
}

ttsGlobal* getTtsGlobal(){
    return *((ttsGlobal**)ADDR_ttsGlobal);
}

void setTTSGlobal(ttsGlobal* newGlobal){
    *((ttsGlobal**)ADDR_ttsGlobal) = newGlobal;
}