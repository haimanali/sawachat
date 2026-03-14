import { ISignUpRequest } from "../requestFormat.js";

export interface ISignUpService
{
    userSignUp(req_body : ISignUpRequest) : Promise<void>;
}