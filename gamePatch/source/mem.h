#pragma once

void* tmalloc(int size);
void tfree(void* ptr);
void* trealloc(void* ptr, int size);