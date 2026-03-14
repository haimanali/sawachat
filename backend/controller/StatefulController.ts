import { IncomingMessage } from "http";
import { Duplex } from "stream";

export class StatefulController{

    public static getInstance() : StatefulController 
    {
        if (StatefulController.instance)
            return StatefulController.instance

        StatefulController.instance = new StatefulController ();
        return StatefulController.instance;
    }
    
    public handleUpgrade(req : IncomingMessage, soc : Duplex, buff : Buffer) : void
    {

    }

    private static instance : StatefulController;
    private constructor () 
    {

    }
   

}