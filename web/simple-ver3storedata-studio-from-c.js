/*

Retrieved from: https://gist.github.com/ariankordi/e6e66b8b03b1424d6e4e489fd9dd83bf

*/

// @ts-check

/* eslint @stylistic/indent: ['error', 4] -- Define indent rules. */

/**
 * Convert 3DS/Wii U format Mii data (Ver3StoreData/FFLStoreData) to
 * struct format used on studio.mii.nintendo.com before obfuscation.
 * @param {Uint8Array} dst - 46-byte destination raw studio data (unobfuscated / charInfoStudio).
 * @param {Uint8Array} src - 96-byte source Ver3StoreData.
 */
function ver3StoreDataToCharInfoStudio(dst, src) {
    // Color indices need to be converted using Ver3 tables: https://github.com/Genwald/MiiPort/blob/4ee38bbb8aa68a2365e9c48d59d7709f760f9b5d/include/convert_mii.h#L8
    // A shortcut that is equivalent to the tables is used in this snippet.

    dst[0] = src[0x42] >> 3 & 7;
    dst[1] = src[0x42] & 7;
    dst[2] = src[0x2f];
    dst[3] = src[0x35] >> 5;
    dst[4] = ((src[0x35] & 1) << 2) | src[0x34] >> 6;
    dst[5] = src[0x36] & 0x1f;
    dst[6] = src[0x35] >> 1 & 0xf;
    dst[7] = src[0x34] & 0x3f;
    dst[8] = ((src[0x37] & 1) << 3) | src[0x36] >> 5;
    dst[9] = src[0x37] >> 1 & 0x1f;
    dst[10] = src[0x39] >> 4 & 7;
    dst[0xb] = src[0x38] >> 5;
    dst[0xc] = src[0x3a] & 0x1f;
    dst[0xd] = src[0x39] & 0xf;
    dst[0xe] = src[0x38] & 0x1f;
    dst[0xf] = ((src[0x3b] & 1) << 3) | src[0x3a] >> 5;
    dst[0x10] = src[0x3b] >> 1 & 0x1f;
    dst[0x11] = src[0x30] >> 5;
    dst[0x12] = src[0x31] >> 4;
    dst[0x13] = src[0x30] >> 1 & 0xf;
    dst[0x14] = src[0x31] & 0xf;
    dst[0x15] = src[0x19] >> 2 & 0xf;
    dst[0x16] = src[0x18] & 1;
    dst[0x17] = src[0x44] >> 4 & 7;
    dst[0x18] = (src[0x45] & 7) * 2 | src[0x44] >> 7;
    dst[0x19] = src[0x44] & 0xf;
    dst[0x1a] = src[0x45] >> 3;
    dst[0x1b] = src[0x33] & 7;
    dst[0x1c] = src[0x33] >> 3 & 1;
    dst[0x1d] = src[0x32];
    dst[0x1e] = src[0x2e];
    dst[0x1f] = src[0x46] >> 1 & 0xf;
    dst[0x20] = src[0x46] & 1;
    dst[0x21] = ((src[0x47] & 3) << 3) | src[0x46] >> 5;
    dst[0x22] = src[0x47] >> 2 & 0x1f;
    dst[0x23] = src[0x3f] >> 5;
    dst[0x24] = ((src[0x3f] & 1) << 2) | src[0x3e] >> 6;
    dst[0x25] = src[0x3f] >> 1 & 0xf;
    dst[0x26] = src[0x3e] & 0x3f;
    dst[0x27] = src[0x40] & 0x1f;
    dst[0x28] = ((src[0x43] & 3) << 2) | src[0x42] >> 6;
    dst[0x29] = src[0x40] >> 5;
    dst[0x2a] = src[0x43] >> 2 & 0x1f;
    dst[0x2b] = ((src[0x3d] & 1) << 3) | src[0x3c] >> 5;
    dst[0x2c] = src[0x3c] & 0x1f;
    dst[0x2d] = src[0x3d] >> 1 & 0x1f;

    // All fields have been set, so the struct does not need memset.

    // Attempt to convert Ver3 colors to common colors.
    if (dst[0x1b] == 0) {
        dst[0x1b] = 8; // Map 0 to 8.
    }
    // Beard and eyebrow color are treated like hair color.
    if (dst[0] == 0) {
        dst[0] = 8;
    }
    if (dst[0xb] == 0) {
        dst[0xb] = 8;
    }

    dst[0x24] = dst[0x24] + 19; // Offset mouth color by 19.
    dst[4] = dst[4] + 8; // Offset eye color by 8.

    // Handle glass color.
    if (dst[0x17] == 0) {
        dst[0x17] = 8;
    } else if (dst[0x17] < 6) {
        dst[0x17] = dst[0x17] + 13;
    }
}

/**
 * Obfuscation code from: https://mii-studio.akamaized.net/static/js/editor.pc.46056ea432a4ef3974af.js
 * Search ".prototype.encode".
 * @param {Uint8Array} dst - 47-byte destination.
 * @param {Uint8Array} src - 46-byte source data before obfuscation.
 * @param {number} [seed] - Random byte value to use for obfuscation.
 */
function studioURLObfuscationEncode(dst, src, seed = 0) {
    // Store the seed at index 0 of destination.
    dst[0] = seed;
    // Use seed as initial previous value.
    let previous = seed;
    // iterate over the source array length
    for (let i = 0; i < 46; i++) { // 46 = sizeof(charInfoStudio)
        const current = src[i];
        // XOR the current value with the previous one, add 7, then take modulo 256
        dst[i + 1] = (7 + (current ^ previous)) % 256;
        // update the previous value to the current encoded value
        previous = dst[i + 1];
    }
}

/**
 * Convert 3DS/Wii U format Mii data (Ver3StoreData/FFLStoreData) to
 * struct format used on studio.mii.nintendo.com before obfuscation.
 * @param {Uint8Array} src - 96-byte input Ver3StoreData.
 * @param {number} [seed] - Initial seed for obfuscation. Set to 0.
 * @returns {Uint8Array} Converted Studio data with obfuscation to be used in a URL.
 */
function ver3StoreDataToStudioURLData(src, seed = 0) {
    const studioDataRaw = new Uint8Array(46); // Studio data without obfuscation.
    // Convert to raw data.
    ver3StoreDataToCharInfoStudio(studioDataRaw, src);
    const dst = new Uint8Array(47); // Obfuscated studio data.
    // Add obfuscation.
    studioURLObfuscationEncode(dst, studioDataRaw, seed);
    return dst;
}

// == Testing ==

/**
 * Data for testing conversion from Ver3StoreData
 * to studio URL data, obfuscated with seed 0.
 * Every array is an array with two elements
 * element 1 = Base64 Ver3StoreData, element 2 = hex studio data
 * @type {Array<{src: string, dst: string}>}
 */
const testVer3StoreDataToStudioSeed0 = [
    // "Jasmine", from NNID: JasmineChlora
    {
        src:
        'AwAAQKBBOMSghAAA27iHMb5gKyoqQgAAWS1KAGEAcwBtAGkAbgBlAAAAAAAAABw3EhB7ASFuQxwNZMcYAAgegg0AMEGzW4JtAABvAHMAaQBnAG8AbgBhAGwAAAAAAJA6',
        dst: '000d142a303f434b717a7b84939ba6b2bbbec5cbc9d0e2ea010d15252b3250535960736f726870757f8289a0a7aeb1'
    },
    // "All" from Exzap's FFL_ODB.
    {
        src: 'AwAAQAAAAAAAAAAA2JXdtJBltjwAAAAAAEBBAGwAbAAAAEEATQBFAAAAAAAAAGN/RmVrASdogyX1NEYUoQAXijAABSk1UklQRQBYAAAAAAAAAAAAAAAAAAAAAAA=',
        dst: '000f11757d7c8689b5c0d9e1edf2fdeff4050e0f131d242b424d4f4c545b375b666e736e7169736b828d93a0acb4bb'
    },
    // "Aiueome" from Super Mario Maker Wii U binary.
    {
        src: 'AwEAMAAAAAAAAAAA2sZrOqTA4fgk3wAAABBBAGkAdQBlAG8AbQBlAAAAAAAAAH9/JwAuCXPOgxfsCIUfDyUY0GUAO0K2oxFSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGUq',
        dst: '000e14727b79818dc5d0e2e9f5f7061124323a4149505b6279858aa5abb1a6e0eff5ecff001a19081423273e3d3932'
    },
    // Guest A. Create ID may be inaccurate, but studio result is same.
    {
        src: 'AwEAMAAAAAAAAAAAgAAAAOz/gtIAAAAAABBuAG8AIABuAGEAbQBlAAAAAAAAAEBAgQBEAAJoRBgGNEYUgRIXaA0AACkAUkhQAAAAAAAAAAAAAAAAAAAAAAAAAAAAALQV',
        dst: '000f165d6574777a7f848f93a2abb6b7bcbdc0c7ced5d8dfdee1e8e9e8efb2f9040b100b0f232e4054575e5b666e6e'
    }
];

// Utility: Base64 -> U8, Hex -> U8, U8 -> Hex

/**
 * Base64 -> U8 / https://stackoverflow.com/a/41106346
 * @param {string} base64 - Input Base64 data to decode.
 * @returns {Uint8Array} Decoded input data.
 */
const base64ToBytes = base64 => Uint8Array.from(atob(base64), c => c.charCodeAt(0));
/**
 * Hex -> U8 / https://gist.github.com/themikefuller/608202bde24077990c0539f960b79fe4 (hex2string)
 * @param {string} hex - Input hex data to decode.
 * @returns {Uint8Array} Decoded input data.
 */
const hexToBytes = hex => new Uint8Array((hex.match(/.{1,2}/g) || [])
    .map((/** @type {string} */ byte) => parseInt(byte, 16)));
/**
 * U8 -> Hex / https://www.xaymar.com/articles/2020/12/08/fastest-uint8array-to-hex-string-conversion-in-javascript/
 * @param {Array<number>|Uint8Array} bytes - Input data to encode.
 * @returns {string} Hexadecimal representation of `buffer`.
 */
const bytesToHex = bytes => Array.prototype.map.call(bytes,
    (/** @type {{ toString: (arg0: number) => string; }} */ x) => x.toString(16).padStart(2, '0')).join('');

/**
 * Run conversion tests for {@link ver3StoreDataToStudioURLData}.
 * @param {Array<{src: string, dst: string}>} [testData] - Expected test data ({@link testVer3StoreDataToStudioSeed0}).
 */
function testVer3StoreDataToStudioURLData(testData = testVer3StoreDataToStudioSeed0) {
    for (const [index, { src, dst }] of testData.entries()) {
        // Gather source and destination Uint8Arrays.
        const srcBytes = base64ToBytes(src);
        const expectedDstBytes = hexToBytes(dst);
        // Perform conversion with seed of 0.
        const actualDstBytes = ver3StoreDataToStudioURLData(srcBytes, 0);
        // Convert to hex.
        const actualHex = bytesToHex(actualDstBytes);
        const expectedHex = bytesToHex(expectedDstBytes);
        // Use console.assert to verify.
        console.assert(
            actualHex === expectedHex,
            `Test case #${index + 1} failed.\nExpected: ${expectedHex}\nActual:   ${actualHex}`
        );
    }
    console.debug('testVer3StoreDataToStudioURLData: Tests finished.');
}

//testVer3StoreDataToStudioURLData();
