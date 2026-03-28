import { IClient } from "../../domain/IClient.js";
import { IServiceLayerResponse } from "../../responseFormat.js";


export interface ILoginService
{
    performUserLogin(session_id : string, username : string, password : string, auto_login : boolean) : Promise<IServiceLayerResponse<IClient>>
}
