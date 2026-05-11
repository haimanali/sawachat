import { IClientPublic } from "../public/IClientPublic.js";

// this interface defines what a user looks like in our system
export interface IClient extends IClientPublic
{
   readonly user_id : number,
}