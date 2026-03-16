import { ISignUpRequest } from "../requestFormat.js";
import { ISignUpResponse } from "../responseFormat.js";

export interface ISignUpService
{
    userSignUp(req_body : ISignUpRequest) : Promise<ISignUpResponse>;
}