// this is the user information that is safe to share with others
export interface IClientPublic
{
    username : string, // the unique user id
    nickname : string, // the name shown to others
    avatar : string, // the profile picture URL or base64
    avatar_type : string,
}