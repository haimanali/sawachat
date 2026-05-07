import React from "react";
import { RoomAvatarProps } from "../../interfaces/UI/props/IRoomAvatarProps";


export default function RoomAvatar({
    image,
    room_type,
    room_name = "?",
    size = "44px"
}: RoomAvatarProps) {
    
    const firstLetter = room_name.charAt(0).toUpperCase();
    const bgColor = room_type === "group" ? "var(--secondary)" : "var(--primary)";

    return (
        <div 
            className="room-avatar" 
            style={{
                width: size,
                height: size,
                flexShrink: 0,
                borderRadius: "50%",
                overflow: "hidden"
            }}
        >
            {image ? (
                <img
                    src={image}
                    alt={`${room_name} avatar`}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover", // Prevents image stretching
                        display: "block"
                    }}
                />
            ) : (
                <div 
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: bgColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        // Dynamically scale font size so it always looks good, no matter the container size
                        fontSize: `calc(${typeof size === "number" ? size + "px" : size} * 0.45)`,
                        fontWeight: "bold"
                    }}
                >
                    {firstLetter}
                </div>
            )}
        </div>
    );
}