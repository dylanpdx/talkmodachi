package com.github.dylanpdx;

import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception {

        String text = "hello";
        MiitomoTTS.Lang language = MiitomoTTS.Lang.USENG;
        String filename = "test.wav";

        int pitch = 50;
        int speed = 50;
        int quality = 50;
        int tone = 50;
        int accent = 50;
        int intonation = 0;

        if (args.length > 0)
            language = MiitomoTTS.Lang.fromString(args[0]);
        if (args.length > 1)
            filename = args[1];
        if (args.length > 2)
            text = args[2];
        if (args.length > 3)
            pitch = Integer.parseInt(args[3]);
        if (args.length > 4)
            speed = Integer.parseInt(args[4]);
        if (args.length > 5)
            quality = Integer.parseInt(args[5]);
        if (args.length > 6)
            tone = Integer.parseInt(args[6]);
        if (args.length > 7)
            accent = Integer.parseInt(args[7]);
        if (args.length > 8)
            intonation = Integer.parseInt(args[8]);

        File out = new File(filename);

        File apk = new File("com.nintendo.zaaa_2.4.0.apk");
        File ttsfs = new File("ttsfs");
        if (!apk.isFile()) {
            throw new Exception("apk missing?");
        }
        if (!new File(ttsfs, "data/voice/common").isDirectory()) {
            // todo: dump from urls
            throw new Exception("todo");
        }

        try (MiitomoTTS tts = new MiitomoTTS(apk, ttsfs)) {
            tts.init(language, MiitomoTTS.voicePath);
            writeWav(out, tts.speak(text, pitch,speed,quality,tone,accent,intonation), tts.getSampleRate());
        }
    }

    private static void writeWav(File out, byte[] pcm, int sampleRate) throws IOException {
        InputStream b_in = new ByteArrayInputStream(pcm);
        AudioFormat format = new AudioFormat(sampleRate, 16, 1, true, false);
        AudioInputStream stream = new AudioInputStream(b_in, format,pcm.length);
        AudioSystem.write(stream, AudioFileFormat.Type.WAVE, out);
    }
}
