import { IAiVerdict } from "../../domain/IAiVerdict.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

export interface IAiService
{
    performValidateMessage(content : string, iv : string, enc_key : string, user_id : number) : Promise<IServiceLayerResponse<IAiVerdict>>
}