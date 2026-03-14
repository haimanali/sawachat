import { ILoginRequest } from "../requestFormat.js";
import { ILoginResponse } from "../responseFormat.js";


export interface ILoginService
{
    verifySession(session_id : string, username? : string) : Promise<ILoginResponse>;
    userLogin(req_body: ILoginRequest) : Promise<ILoginResponse>
}
