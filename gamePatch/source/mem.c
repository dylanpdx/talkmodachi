#include "mem.h"
#include <string.h>

#define MALLOC_ADDR 0x00129778
#define FREE_ADDR 0x0011da30

void* tmalloc(int size){
    void* ptr = ((void*(*)(int))MALLOC_ADDR)(size);
    return ptr;
}

void tfree(void* ptr){
    ((void(*)(void*))FREE_ADDR)(ptr);
}

void* trealloc(void* ptr, int size){
    // no address for this one, so we have to implement it ourselves
    void* newPtr = tmalloc(size);
    memcpy(newPtr, ptr, size);
    tfree(ptr);
    return newPtr;
}