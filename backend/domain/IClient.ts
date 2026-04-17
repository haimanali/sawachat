import { IClientPublic } from "../public/IClientPublic.js";

export interface IClient extends IClientPublic
{
    readonly user_id : number,
}