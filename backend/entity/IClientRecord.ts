import { IClient } from "../domain/IClient.js";

export interface IClientRecord extends IClient
{
    readonly hash_pass : string,
}