// this interface defines what the ai returns after checking a message
export interface IAiVerdict
{
    label : string, // the category like toxic or clean
    score : number, // how sure the ai is about its choice
    is_toxic : boolean, // if we should hide this message

    total_strike? : number, // how many bad messages the user has sent so far
}