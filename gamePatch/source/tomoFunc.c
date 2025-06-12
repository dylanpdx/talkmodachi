#include "tomoFunc.h"
#include "tomoStructs.h"

void setupTTS(){
    int* ptr = (int*)ADDR_ttsGlobal;
	((void(*)(int*))ADDR_setupFunc)((int*)ptr[0]); // call setup function(?)
    //((void(*)(int*))0x0035adf8)((int*)ptr[0]);
}

ttsGlobal* getTtsGlobal(){
    return *((ttsGlobal**)ADDR_ttsGlobal);
}