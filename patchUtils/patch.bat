3dstool.exe -xvtf cxi %* --header header --exefs exefs --exh exheader.bin --logo logo --plain plain --romfs romfs
3dstool.exe -xvtf exefs .\exefs --exefs-dir exefsd --header exfsheader
pause
3dstool.exe -cvtf exefs .\exefs --exefs-dir exefsd --header exfsheader
3dstool.exe -cvtf cxi .\patched.cxi --header header --exefs exefs --exh exheader.bin --logo logo --plain plain --romfs romfs --not-encrypt
del plain
del romfs
del exefs
del exfsheader
del header
del logo
del exheader.bin
rmdir /s /q exefsd