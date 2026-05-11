import { IRequestPublic } from "../public/IRequestPublic.js";

// this is for friend requests or rejoin requests
export interface IRequest extends IRequestPublic
{
    readonly request_id : number; // internal database id
    readonly room_id : number;
}