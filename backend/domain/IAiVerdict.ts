export interface IAiVerdict
{
    label : string,
    score : number,
    is_toxic : boolean,

    total_strike? : number,
}