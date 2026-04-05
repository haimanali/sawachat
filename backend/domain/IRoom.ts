import { IRoomPublic } from "../public/IRoomPublic.js";

export interface IRoom extends IRoomPublic
{
    readonly room_id : number,
}