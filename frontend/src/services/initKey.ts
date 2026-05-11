// this function takes a raw hex string and turns it into a web crypto key object
export async function initKey (rawKey : string) : Promise<CryptoKey>
{
    const encoder = new TextEncoder();

    // we turn the hex string into a byte array
    const bytecode_key = Uint8Array.from(
        rawKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    // we import the bytes as an aes-gcm key so we can use it to encrypt and decrypt
    return await window.crypto.subtle.importKey(
        "raw",
        bytecode_key,
        {name : "AES-GCM"},
        false,
        ["encrypt", "decrypt"],
    );
}