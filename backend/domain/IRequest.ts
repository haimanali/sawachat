import { IRequestPublic } from "../public/IRequestPublic.js";

export interface IRequest extends IRequestPublic
{
    readonly request_id : number,
    readonly room_id? : number,
}