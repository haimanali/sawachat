import { IAiVerdict } from "../../domain/IAiVerdict.js";
import {  IRepositoryLayerResponse } from "../../responseFormat.js";

export interface gRPCrequest
{
    content : string, 
    iv : string, 
    enc_key : string,
}


export interface IAiRepository
{
    sendContentgRPC(request : gRPCrequest) : Promise<IRepositoryLayerResponse<IAiVerdict>>;
} 