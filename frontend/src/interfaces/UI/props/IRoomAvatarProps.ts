export interface RoomAvatarProps {
    image?: string;
    room_type: "private" | "group";
    room_name?: string;
    size?: string | number;
}
