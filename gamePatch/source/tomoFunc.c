#include "tomoFunc.h"
#include "tomoStructs.h"

void setupTTS(){
    int* ptr = (int*)0x00acb54c;
	((void(*)(int*))0x003914e8)((int*)ptr[0]); // call setup function(?)
    //((void(*)(int*))0x0035adf8)((int*)ptr[0]);
}

ttsGlobal* getTtsGlobal(){
    return *((ttsGlobal**)0x00acb54c);
}