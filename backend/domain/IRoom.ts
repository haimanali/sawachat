import { IRoomPublic } from "../public/IRoomPublic.js";

// this interface defines a chat room
export interface IRoom extends IRoomPublic
{
    readonly room_id : number;      // internal database id
}