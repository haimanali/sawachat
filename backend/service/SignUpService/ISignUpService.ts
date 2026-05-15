import { IClient } from "../../domain/IClient.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

export interface ISignUpService
{
    performUserSignUp(username : string, nickname : string, password : string) : Promise<IServiceLayerResponse<IClient>>;
    // checks if a username is taken (includes banned accounts — they cannot be re-registered)
    performCheckUsernameAvailability(username: string): Promise<IServiceLayerResponse>;
}