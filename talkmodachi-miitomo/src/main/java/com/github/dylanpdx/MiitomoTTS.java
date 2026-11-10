package com.github.dylanpdx;

import com.github.unidbg.AndroidEmulator;
import com.github.unidbg.Emulator;
import com.github.unidbg.Module;
import com.github.unidbg.arm.ArmSvc;
import com.github.unidbg.arm.backend.Unicorn2Factory;
import com.github.unidbg.arm.context.Arm32RegisterContext;
import com.github.unidbg.linux.android.AndroidEmulatorBuilder;
import com.github.unidbg.linux.android.AndroidResolver;
import com.github.unidbg.linux.android.dvm.VM;
import com.github.unidbg.memory.Memory;
import com.github.unidbg.memory.MemoryBlock;
import com.github.unidbg.pointer.UnidbgPointer;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

public final class MiitomoTTS implements AutoCloseable {
    private static final long BASE = 0x10000;
    // NTTSMiiVoicePlay * __thiscall - NTTSMiiVoicePlay::NTTSMiiVoicePlay(NTTSMiiVoicePlay *this,int param_1,int param_2,char *param_3)
    // param1 = region, param2 = lang, param3 = resources?
    private static final long NTTSMiiVoicePlay_CONSTRUCTOR = 0x01080e08 - BASE;
    // sync speak func
    private static final long NTTSMiiVoicePlay_SPEAK = 0x01082be0 - BASE;
    private static final int NTTSMiiVoicePlay_SIZE = 0x1190; // 0x00626f70 calls '(NTTSMiiVoicePlayOpenSL *)bad_alloc::bad_alloc((bad_alloc *)0x1190);' - just a guess??
    private static final int NTTSMiiVoicePlay_FUNCS = 14;
    private static final int NTTSMiiVoicePlay_OUT_STRUCT = 0x8; // offset
    private static final int NTTSMiiVoicePlay_ISOK = 0x107d; // offset
    private static final int NTTSMiiVoicePlay_VPARAMS = 0x108c;
    private static final int NTTSMiiVoicePlay_OutStruct_SAMPLE_RATE = 0x1fc; // offset
    private static final int NTTSMiiVoicePlay_OutStruct_SoundOutputFunc = 0x264;
    // from 0x019f2d1c, gotten by FUN_01081c5c, which calls ve_ttsResourceLoad
    public enum Lang {
        //JP("jp", 0, 0),
        USENG("useng", 1, 1),
        EUENG("eueng", 2, 1),
        FR("fr", 2, 2),
        CAFR("cafr", 1, 2),
        DE("de", 2, 3),
        IT("it", 2, 4),
        ES("es", 2, 5),
        MXES("mxes", 1, 5),
        KR("kr", 3, 6),
        NL("nl", 2, 7),
        RU("ru", 2, 8),
        PT("pt", 2, 9),
        PTBR("ptbr", 1, 9);

        public final String code;
        final int region;
        final int language;

        Lang(String code, int region, int language) {
            this.code = code;
            this.region = region;
            this.language = language;
        }

        public static Lang fromString(String code) throws Exception {
            for (Lang l : values()) {
                if (l.code.equalsIgnoreCase(code)) return l;
            }
            throw new Exception("not supported lang passed");
        }
    }
    public static final String voicePath = "/data/voice/";
    private final ByteArrayOutputStream wavDat = new ByteArrayOutputStream();
    private final AndroidEmulator emulator;
    private final Module cocos2dcpp;
    private UnidbgPointer playerPtr;
    private int lastBuffer;
    private int buflen;

    public MiitomoTTS(File apk, File rootfs) {
        emulator = AndroidEmulatorBuilder.for32Bit()
                .setProcessName("com.nintendo.zaaa")
                .setRootDir(rootfs)
                .addBackendFactory(new Unicorn2Factory(true))
                .build();
        emulator.getMemory().setLibraryResolver(new AndroidResolver(23));

        VM vm = emulator.createDalvikVM(apk);
        vm.loadLibrary("NuanceVocalizer", false);
        cocos2dcpp = vm.loadLibrary("cocos2dcpp", false).getModule();
    }

    public void init(Lang language, String resourcePath) throws Exception {
        Memory memory = emulator.getMemory();
        // calloc
        playerPtr = memory.malloc(NTTSMiiVoicePlay_SIZE, false).getPointer();
        playerPtr.write(0, new byte[NTTSMiiVoicePlay_SIZE], 0, NTTSMiiVoicePlay_SIZE);

        MemoryBlock resPathStr = memory.malloc(resourcePath.length() + 1, false);
        resPathStr.getPointer().setString(0, resourcePath);
        cocos2dcpp.callFunction(emulator, NTTSMiiVoicePlay_CONSTRUCTOR, playerPtr, language.region, language.language, resPathStr.getPointer()); // basically calls the initializer
        resPathStr.free();

        if (playerPtr.getByte(NTTSMiiVoicePlay_ISOK) == 0) {
            throw new Exception("NTTSMiiVoicePlay_ISOK == 0");
        }
        playerPtr.setPointer(0, abstractWorkaround());
        hookAudioOutput();
    }

    public int getSampleRate() {
        return playerPtr.getPointer(NTTSMiiVoicePlay_OUT_STRUCT).getInt(NTTSMiiVoicePlay_OutStruct_SAMPLE_RATE);
    }

    public byte[] speak(String text, int pitch, int speed, int quality, int tone, int accent, int intonation) {
        int[] values = new int[]{pitch,speed,quality,tone,accent,intonation};
        for (int i = 0; i < values.length; i++) {
            playerPtr.setInt(NTTSMiiVoicePlay_VPARAMS + i * 4L, values[i]);
        }

        wavDat.reset();
        lastBuffer = -1;
        buflen = 0;

        byte[] utf8 = text.getBytes(StandardCharsets.UTF_8);
        Memory memory = emulator.getMemory();

        MemoryBlock data = memory.malloc(utf8.length + 1, false);
        data.getPointer().write(0, utf8, 0, utf8.length);
        data.getPointer().setByte(utf8.length, (byte) 0);
        MemoryBlock str = memory.malloc(12, false); // pretty sure this is the same interface as TL's ttsInput (or w/e it's actually called)
        UnidbgPointer s = str.getPointer();
        s.setInt(0, (utf8.length + 1) | 1);
        s.setInt(4, utf8.length);
        s.setPointer(8, data.getPointer());

        cocos2dcpp.callFunction(emulator, NTTSMiiVoicePlay_SPEAK, playerPtr, s, 0);

        str.free();
        data.free();
        return wavDat.toByteArray();
    }
    private UnidbgPointer abstractWorkaround() {
        // we are creating NTTSMiiVoicePlay which is teeeeeechnically an abstract class and we shouldn't
        // some of the stuff in the abstract vtable calls "FUN_015f1aa8((uint *******)"Pure virtual function called!",0xffd475cb,param_2,param_3);" which calls "abort()" and crashes
        // this is a lazy fix (i think) to make it not do that, but PRs are welcome for a more elegant solution.. if anyone even notices this
        // fwiw in actual code NTTSMiiVoicePlayOpenSL::NTTSMiiVoicePlayOpenSL extends from this and fixes the vtable, but we don't have openSL here
        UnidbgPointer hook = emulator.getSvcMemory().registerSvc(new ArmSvc() {
            @Override
            public long handle(Emulator<?> emu) {
                return 0;
            }
        });
        UnidbgPointer vtable = emulator.getMemory().malloc(NTTSMiiVoicePlay_FUNCS * 4, true).getPointer();
        for (int slot = 0; slot < NTTSMiiVoicePlay_FUNCS; slot++) {
            vtable.setPointer(slot * 4L, hook);
        }
        return vtable;
    }

    private void hookAudioOutput() {
        UnidbgPointer hook = emulator.getSvcMemory().registerSvc(new ArmSvc() {
            @Override
            public long handle(Emulator<?> emu) {
                Arm32RegisterContext ctx = emu.getContext();
                UnidbgPointer buffer = ctx.getR1Pointer();
                int currentBufferLen = ctx.getR2Int();
                int index = ctx.getR3Int();
                int start = (index == lastBuffer && currentBufferLen >= buflen) ? buflen : 0;
                if (buffer != null && currentBufferLen > start) {
                    wavDat.writeBytes(buffer.getByteArray(start, currentBufferLen - start));
                }
                lastBuffer = index;
                buflen = currentBufferLen;
                return 0;
            }
        });
        playerPtr.getPointer(NTTSMiiVoicePlay_OUT_STRUCT).setPointer(NTTSMiiVoicePlay_OutStruct_SoundOutputFunc, hook);
    }

    @Override
    public void close() throws IOException {
        emulator.close();
    }
}
