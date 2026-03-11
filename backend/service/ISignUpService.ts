import { ISignUpRequest } from "../requestFormat";

export interface ISignUpService
{
    userSignUp(req_body : ISignUpRequest) : Promise<void>;
}