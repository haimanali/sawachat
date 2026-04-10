export async function msgDecryption(encrypted_text64 : string, crypto_key : CryptoKey, iv64 : string) 
{
    const decoder = new TextDecoder();
    
    const cleanIv = String(iv64).replace(/\s/g, '');
    const cleanText = String(encrypted_text64).replace(/\s/g, '');

    const iv = Uint8Array.from(atob(cleanIv), c => c.charCodeAt(0)); 
    const encrypted_text = Uint8Array.from(atob(cleanText), c => c.charCodeAt(0));

    const decrypt_buffer = await window.crypto.subtle.decrypt(
        {name : "AES-GCM", iv : iv},
        crypto_key,
        encrypted_text,
    );

    return decoder.decode(decrypt_buffer);
}