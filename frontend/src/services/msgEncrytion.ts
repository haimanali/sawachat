// this function handles the actual encryption on the client side before sending to server
export async function msgEncrytion(msg_content : string, crypto_key : CryptoKey)
{
    // we use textencoder to turn the string into bytes
    const encoder = new TextEncoder();

    // we generate a random 12 byte iv for aes-gcm security
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // this is the main web crypto call that does the aes-gcm encryption
    const encrypted_buffer = await window.crypto.subtle.encrypt(
        {name : "AES-GCM", iv : iv},
        crypto_key,
        encoder.encode(msg_content),
    );

    // we convert the buffer and iv to base64 so we can send them over the websocket
    return {
        encrypted_text : btoa(String.fromCharCode.apply(null, new Uint8Array(encrypted_buffer) as any)),
        iv : btoa(String.fromCharCode.apply(null, iv as any)),
    };

}