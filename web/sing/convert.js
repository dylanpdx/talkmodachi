const arpaToSampa={
    "aa":"Q",
    "aa r":"Q@",
    "ae":"{",
    "ae n":"{ n", // or e@0 n
    "ae ng":"{ N",
    "ah":"V",
    "ao":"O:",
    "ao":"O:",
    "ao r":"O@",
    "ax":"@",
    "eh":"e",
    "eh r":"e@",
    "er":"@r",
    "ih":"I",
    "ih ng":"I N",
    "ih r":"I@",
    "iy":"i:",
    "uh":"U",
    "uw":"u:",
    "uw r":"U@",
    "aw":"aU",
    "aw n":"aU n",
    "ay":"aI",
    "ey":"eI",
    "ow":"@U",
    "oy":"OI",
    "b":"b",
    "ch":"tS",
    "d":"d",
    "dh":"D",
    "dx":"4", //  [not in ARPAsing]?
    "el":"@l", // [not in ARPAsing]?
    "f":"f",
    "g":"g",
    "hh":"h",
    "hh y":"C",
    "jh":"dZ",
    "k":"k",
    "l":"l0",
    "l":"l",
    "m":"m",
    "n":"n",
    "ng":"N",
    "p":"p",
    "q":"?",
    "r":"r",
    "s":"s",
    "sh":"S",
    "t":"t",
    "th":"T",
    "v":"v",
    "w":"w",
    "y":"j",
    "z":"z",
    "zh":"Z"
}

const maxKeyLen = Math.max(
  ...Object.keys(arpaToSampa).map(k => k.split(" ").length)
);

function convertSyllable(syl) {
  const phones = syl.split("-");
  const result = [];

  for (let i = 0; i < phones.length; i++) {

    let matched = false;

    // do we have more?
    for (let len = maxKeyLen; len > 0; len--) {

      if (i + len > phones.length) continue;

      const chunk = phones.slice(i, i + len).join(" ");

      if (arpaToSampa[chunk]) { // yes!
        result.push(arpaToSampa[chunk]);
        i += len - 1;
        matched = true;
        break;
      }
    }

    if (!matched) {
      result.push(phones[i]);
    }
  }

  return result.join("");
}

function toSeparatedSampa(inp){
    const words = RiTa.syllables(inp).split(" ");
    let outWords=[]
    for (word of words){
        let outSyllables=[]
        const syllables = word.split("/")
        for (syllable of syllables){
            outSyllables.push(convertSyllable(syllable))
        }
        outWords.push(outSyllables)
    }
    return outWords;
}

function toFlatSampa(inp){
    return toSeparatedSampa(inp).flat();
}