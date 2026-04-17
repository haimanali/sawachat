export async function initKey (rawKey : string) : Promise<CryptoKey>
{
    const encoder = new TextEncoder();

    const bytecode_key = Uint8Array.from(
        rawKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    return await window.crypto.subtle.importKey(
        "raw",
        bytecode_key,
        {name : "AES-GCM"},
        false,
        ["encrypt", "decrypt"],
    );
}