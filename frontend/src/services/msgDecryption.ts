// this function handles decrypting messages on the client side
export async function msgDecryption(encrypted_text64 : string, crypto_key : CryptoKey, iv64 : string) 
{
    // we use textdecoder to turn the bytes back into a readable string
    const decoder = new TextDecoder();
    
    // we clean the base64 strings just in case there are spaces
    const cleanIv = String(iv64).replace(/\s/g, '');
    const cleanText = String(encrypted_text64).replace(/\s/g, '');

    // we convert the base64 strings back into byte arrays
    const iv = Uint8Array.from(atob(cleanIv), c => c.charCodeAt(0)); 
    const encrypted_text = Uint8Array.from(atob(cleanText), c => c.charCodeAt(0));

    // this is the main web crypto call that decrypts the message
    const decrypt_buffer = await window.crypto.subtle.decrypt(
        {name : "AES-GCM", iv : iv},
        crypto_key,
        encrypted_text,
    );

    // we return the final decoded plain text
    return decoder.decode(decrypt_buffer);
}