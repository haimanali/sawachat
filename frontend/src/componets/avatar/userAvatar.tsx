import React from "react";
import { UserAvatarProps } from "../../interfaces/UI/props/IUserAvatarProps";

// this component shows the user's profile picture
// if they don't have one, it shows the first letter of their nickname instead
export default function UserAvatar({
    image,
    type, // the base64 string or url for the picture
    mode, // online or offline status
    nickname = "?", 
    size = "44px"
}: UserAvatarProps) {

    const imageSrc = image && typeof image === 'string' && !image.startsWith('data:') 
        ? `data:${type};base64,${image}` 
        : image;

    return (
        <div
            className="user-avatar-container"
            style={{
                position: "relative",
                width: size,
                height: size,
                flexShrink: 0, // Prevents flexbox from squishing your perfectly round avatar
            }}
        >
            {/* --- 1. THE AVATAR (Image or Initial) --- */}
            {image ? (
                <img
                    src={imageSrc}
                    alt={`${nickname}'s avatar`}
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover", // Ensures the image isn't stretched
                        display: "block"
                    }}
                />
            ) : (
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
                        // Dynamically scale font size based on the size prop
                        fontSize: `calc(${typeof size === "number" ? size + "px" : size} * 0.45)`,
                        fontWeight: "bold"
                    }}
                >
                    { nickname.charAt(0).toUpperCase() }
                </div>
            )}

            {/* --- 2. THE STATUS DOT --- */}
            {mode && (
                <span
                    style={{
                        position: "absolute",
                        bottom: "0",
                        right: "0",
                        width: "28%",  // Scales perfectly with whatever size you pass
                        height: "28%",
                        backgroundColor: mode === "online" ? "var(--online)" : "var(--offline)",
                        borderRadius: "50%",
                        // Uses your app's background color to create the cutout effect
                        border: "2px solid var(--bg-main, #ffffff)", 
                        boxSizing: "content-box" // Ensures the border grows outward, not inward
                    }}
                />
            )}
        </div>
    );
}