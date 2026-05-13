import React, { useEffect, useState, useRef } from "react";
import { UserAvatarProps } from "../../interfaces/UI/props/IUserAvatarProps";

/**
 * UserAvatar Component
 * Handles: Base64 images, loading states, and fallback to initials.
 */
export default function UserAvatar({
    image,
    type,
    mode,
    nickname = "?",
    size = "44px"
}: UserAvatarProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    const imageSrc = image ? `data:${type};base64,${image}` : undefined;

    // Reset states and check cache whenever the image prop changes
    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);

        // If image exists and is already in browser cache, it might be 'complete' 
        // before the first render finishes. This prevents the "stuck" loading ring.
        if (imgRef.current?.complete) {
            setIsLoaded(true);
        }
    }, [image]);

    return (
        <div
            className="user-avatar-container"
            style={{
                position: "relative",
                width: size,
                height: size,
                flexShrink: 0,
            }}
        >
            {/* --- 1. LOADING STATE --- */}
            {/* Show white ring if image exists but isn't ready yet */}
            {image && !isLoaded && !hasError && (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        backgroundColor: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <div style={{
                        width: "40%",
                        height: "40%",
                        border: "2px solid #ffffff",
                        borderRadius: "50%",
                        opacity: 0.8
                    }} />
                </div>
            )}

            {/* --- 2. THE IMAGE --- */}
            {image && !hasError && (
                <img
                    ref={imgRef}
                    src={imageSrc}
                    alt={`${nickname}'s avatar`}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setHasError(true)}
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                        // Keep the img tag in DOM for loading, but hide visually until ready
                        display: isLoaded ? "block" : "none" 
                    }}
                />
            )}

            {/* --- 3. INITIALS FALLBACK --- */}
            {/* Show if: there is no image OR the image failed to load (onError) */}
            {(!image || hasError) && (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        backgroundColor: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: `calc(${typeof size === "number" ? size + "px" : size} * 0.45)`,
                        fontWeight: "bold"
                    }}
                >
                    {nickname.charAt(0).toUpperCase()}
                </div>
            )}

            {/* --- 4. THE STATUS DOT --- */}
            {mode && (
                <span
                    style={{
                        position: "absolute",
                        bottom: "0",
                        right: "0",
                        width: "28%",
                        height: "28%",
                        backgroundColor: mode === "online" ? "var(--online)" : "var(--offline)",
                        borderRadius: "50%",
                        border: "2px solid var(--bg-main, #ffffff)",
                        boxSizing: "content-box"
                    }}
                />
            )}
        </div>
    );
}