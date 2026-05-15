# Internals

This is documentation on what I was able to reverse engineer from the TTS.

The Voices used for Miis are based on Nuance, specifically "Vocalizer for Automotive", a TTS system that was used a lot for GPS in cars, voice assistants, etc. It's also famously the original voice of Siri on iPhones.

Nuance, by default, doesn't have certain functions that Miis use, so Nintendo extended it into something called NTTSMiiVoice, which adds more functionality, like singing, the voice settings for individual miis, and effects like echo.
It is unclear what NTTS stands for, but I can guess it's Nintendo Text to speech.
This is what's used in Tomodachi Life and Miitomo, although the Japanese version of Tomodachi life uses an older TTS called SharpTTS, that only supports Japanese, and sounds much different.

When a Mii is speaking, the voice is first generated using Nuance, and after that, the audio is further processed by NTTSMiiVoice. For more advanced things like singing, it's guided through special characters in the text that affect how the output from Nuance is modified, such as speaking a certain word at a certain pitch. A lot of Nintendo's changes are very advanced, it looks like they implemented an entire system similar to Vocaloid, because there's a lot of those special text tags, like adding Chorus, Vibrato, changing how a word's syllables are emphesized, smoothing the pitch, etc. Of course, it's not exactly the same, but it's close. A lot of that functionality is not used in the final game, however, because the only thing you can change in a song is the words, and not the notes or how it's sung.

The new Tomodachi Life game for the switch replaced Nuance with another system called NeoSpeech VoiceText, but everything else is mostly the same. Reverse engineering of that is still in progress.

Very little is known about the development of NTTSMiiVoice, but we can guess it was created specifically for Tomodachi life, as a lot of the functionality is specific to the options offered by the game (like voice pitch/speed/etc.), and after that it was used for other games where the Mii speak, like Miitomo.