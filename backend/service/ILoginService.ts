import { ILoginRequest } from "../requestFormat";
import { ILoginResponse } from "../responseFormat";


export interface ILoginService
{
    verifySession(session_id : string, username? : string) : Promise<ILoginResponse>;
    userLogin(req_body: ILoginRequest) : Promise<ILoginResponse>
}
