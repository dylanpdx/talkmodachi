# Talkmodachi

Getting the full setup for hosting this locally is quite tricky, but these instructions should get you going if you've done software dev and 3DS modding before.

## Requirements
- A legal version of Tomodachi Life US as a cxi. This can be extracted using godmode9.
- A compiled version of [Magikoopa](https://github.com/RicBent/Magikoopa)
- Tool for extracting 3ds files, i.e [3dstool](https://github.com/dnasdw/3dstool)
- Docker

## Setup

First, extract the code.bin and exheader.bin from your cxi file. If you're using 3dstool, the commands needed are
```sh
3dstool -xvtf cxi .\\TomodachiLife.cxi --header header --exefs exefs --exh exheader.bin --logo logo --plain plain --romfs romfs
3dstool -xvtf exefs .\\exefs --exefs-dir exefsd --header exfsheader
```

Place the code.bin (from exefsd folder) and exheader.bin in the gamePatch folder, and open that folder with Magikoopa, then press the build button.

Once built, the code.bin and exheader.bin should now be patched, and can be moved back to where they were extracted from. The CXI needs to be rebuilt now.
The 3dstool commands for that are:
```sh
3dstool -cvtf exefs .\\exefs --exefs-dir exefsd --header exfsheader
3dstool -cvtf cxi .\\US_patched.cxi --header header --exefs exefs --exh exheader.bin --logo logo --plain plain --romfs romfs --not-encrypt
```

You should now have a US_patched.cxi file. Move that to the main folder (where docker-compose.yml is) and then open this directory in the terminal.
Run `docker compose up` and wait until it finishes doing it's thing. 

TODO: Web hosting