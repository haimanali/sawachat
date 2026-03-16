import express, {Express, NextFunction, RequestHandler, Request, Response} from 'express'
import { success, z } from 'zod'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { ILoginService } from '../service/ILoginService.js'
import { ILoginRequest, ISignUpRequest, login_schema, signup_schema } from '../requestFormat.js'
import { ISignUpService } from '../service/ISignUpService.js'
import { ILoginResponse } from '../responseFormat.js'
import { tr } from 'zod/locales'
import { log } from 'console'


export class StatelessController {

    public static getInstance(app : Express, Ilogin_service : ILoginService, Isignup_service : ISignUpService) : StatelessController {
        if (StatelessController.instance) 
            return StatelessController.instance;

        StatelessController.instance = new StatelessController(app, Ilogin_service, Isignup_service);
        return StatelessController.instance;
    }

    private static instance : StatelessController;
    private Ilogin_service : ILoginService;
    private Isignup_service : ISignUpService;
    private app : Express;
    private constructor (app : Express, Ilogin_service : ILoginService, Isignup_service : ISignUpService)
    {
        this.Ilogin_service = Ilogin_service;
        this.Isignup_service = Isignup_service;
        this.app = app;
        this.app.use(cors({
            origin : "http://localhost:5173",
            credentials : true,
            methods : ["POST", "GET", "PUT", "DELETE"],
        }));

        this.app.use(express.json());
        this.app.use(cookieParser());

        this.initRoutes();

        //error middleware
        this.app.use((error : any, req : Request, res : Response, next : NextFunction) => {

            if (req.path.startsWith("/api/"))
            {
                const status = error.status || 500;
                res.status(status).json( {success : false, message : error.message} );
                console.log(error.message);
            }
        });
    }

    private validateJSON(schema : z.ZodSchema) : RequestHandler
    {
        return (req : Request, res : Response, next : NextFunction) => {
            const result = schema.safeParse(req.body);

            if (!result.success)
            {
                const error = new Error("failed to read json");
                (error as any).status = 400;
                next(error);
            }
            else
            {
                req.body = result.data;
                next();
            }

        };
    }

    private errorHandler(fn : Function) {
        return async (req : Request, res : Response, next : NextFunction) => {
            try
            {
                await fn(req, res);
            } 
            catch(error)
            {
                next(error);
            }
        };
    }

    private setCookie(res : Response, auto_login : boolean, session_id : string) : void
    {
        const cookie_options : any = {httponly : true} //add secure...

        if (auto_login)
        {
            cookie_options.maxAge = (14 * 24 * 60 * 60 * 1000); // 14 days
        }

        res.cookie("session_id", session_id, cookie_options);       
    }


    private initRoutes() : void 
    {
        this.app.get("/api/auth/session/check/:username", this.errorHandler(async (req : Request, res : Response) => {

            const session_id = req.cookies.session_id;
            if(!session_id)
                {
                    res.status(200).json( {success : false, log_message : "user doesn't have a session id"} );
                    return;
                }

            const username = ( req.params.username as string ).trim() ;
            const payload : ILoginResponse = await this.Ilogin_service.verifySession(session_id, username); 

            res.status(200).json( payload );
        }));

        this.app.get("/api/auth/session", this.errorHandler(async (req : Request, res : Response) => {

            const session_id = req.cookies.session_id;
            if(!session_id)
                return;
                        
            const payload : ILoginResponse = await this.Ilogin_service.verifySession(session_id);

            res.status(200).json( payload );
            
        }));


        this.app.post("/api/login", this.validateJSON(login_schema), this.errorHandler(async (req : Request, res : Response) => {

                const payload = await this.Ilogin_service.userLogin(req.body);

                if (payload.success)
                {
                    this.setCookie(res, req.body.auto_login, payload.session_id!);
                }

                res.status(200).json( payload );
        }));

        this.app.post("/api/signup", this.validateJSON(signup_schema), this.errorHandler(async (req : Request, res : Response) => {

            const req_body : ISignUpRequest = req.body;
            const result =  await this.Isignup_service.userSignUp(req_body);
            if (!result.success)
            {
                res.status(200).json( result );
                return;
            }
            const payload = 
            await this.Ilogin_service.userLogin(
                {auto_login : true, username : req_body.username, password : req_body.password} as ILoginRequest
            );

            if (payload.success)
            {
                this.setCookie(res, true, payload.session_id!);
            }

            res.status(200).json( payload );
        }));

    }
}
