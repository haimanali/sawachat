import { IMessagePublic } from "./IMessagePublic.js";

// this is the data we send to the user about a chat room
export interface IRoomPublic 
{
    enc_key : string, // the key used for encryption
    public_id : string, // public id
    room_name : string, // name shown to the user
    room_subname : string, // usually the username of the other person
    created_at : Date, // when it was created
    type : "private" | "group", // chat type
    is_active : boolean, // if the room is active

    last_msg_date : Date | null, // time of last message, can be null if no messages
    last_message_payload : IMessagePublic | null, // preview of last message

    unread_msgs : number, // count of messages not read yet
    actual_is_del? : boolean, // dynamic check if the last message was deleted
}