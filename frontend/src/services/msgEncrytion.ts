export async function msgEncrytion(msg_content : string, crypto_key : CryptoKey)
{
    const encoder = new TextEncoder();

    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encrypted_buffer = await window.crypto.subtle.encrypt(
        {name : "AES-GCM", iv : iv},
        crypto_key,
        encoder.encode(msg_content),
    );

    return {
        encrypted_text : btoa(String.fromCharCode.apply(null, new Uint8Array(encrypted_buffer) as any)),
        iv : btoa(String.fromCharCode.apply(null, iv as any)),
    };

}