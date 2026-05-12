export interface UserAvatarProps {
    image?: string;
    type? : string,
    mode?: "online" | "offline"; 
    nickname?: string;
    size?: string | number; 
}