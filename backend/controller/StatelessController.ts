import express, {Express, NextFunction, RequestHandler, Request, Response} from 'express'
import { success, z } from 'zod'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { ILoginService } from '../service/ILoginService'
import { ILoginRequest, ISignUpRequest, login_schema, signup_schema } from '../requestFormat'
import { ISignUpService } from '../service/ISignUpService'
import { REPLCommand } from 'repl'


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
        this.app.use(express.static("frontend/public"));
        this.app.use(cors({
            origin : "localhost:3000",
            methods : ["post", "get", "put", "delete"],
        }));

        this.app.use(express.json());
        this.app.use(cookieParser());

        this.initRoutes();
        //error middleware
        this.app.use((error : Error, req : Request, res : Response, next : NextFunction) => {

            if (req.path.startsWith("/api/"))
            {
                res.status(500).json( {success : false, message : error.message} );
            }
            else
            {
                res.status(500).sendFile(path.resolve("frontend/private/error.html"));
            }

        });
    }

    private validateJSON(schema : z.ZodSchema) : RequestHandler
    {
        return (req : Request, res : Response, next : NextFunction) => {
            const result = schema.safeParse(req.body);

            if (!result.success)
            {
                next(new Error("failed to read json"));
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


    private initRoutes() : void 
    {
        try {

        } catch (error) {
            
        }
        this.app.get("/", this.errorHandler(async (req : Request, res : Response) => {

            const session_id = req.cookies.session_id;

            if (session_id)
            {
                const result = await this.Ilogin_service.verifySession(session_id);
                if (result.success)
                {
                    res.redirect(`/${result.username}`);
                    return;
                }
            }

            res.sendFile(path.resolve("frontend/public/index.html"));
        }));

        this.app.get("/:page", this.errorHandler(async (req : Request, res : Response) => {
            const target = ((req.params.page) as string).trim();
            const site_pages = ["login", "signup"];

            if(site_pages.includes(target))
            {
                res.sendFile(path.resolve(`frontend/public/${target}.html`));
            }
            else
            {
                const session_id = req.cookies.session_id;
                if(session_id)
                {
                    const result = await this.Ilogin_service.verifySession(session_id, target)
                    if(result.success)
                    {
                        res.sendFile(path.resolve("frontend/private/home.html"));
                        return;
                    }
                }
                res.redirect("/login");
            }
        }));

        this.app.post("/api/login", this.validateJSON(login_schema), this.errorHandler(async (req : Request, res : Response) => {

                const payload = await this.Ilogin_service.userLogin(req.body);
                const cookie_options : any = {httponly : true} //add secure...

                if (req.body.auto_login)
                {
                    cookie_options.maxAge = (14 * 24 * 60 * 60 * 1000); // 14 days
                }

                res.cookie("session_id", payload.session_id, cookie_options);
                res.json( payload );

        }));

        this.app.post("/api/signup", this.validateJSON(signup_schema), this.errorHandler(async (req : Request, res : Response) => {

            const req_body : ISignUpRequest = req.body;

            await this.Isignup_service.userSignUp(req_body);
            const payload = 
            await this.Ilogin_service.userLogin(
                {auto_login : true, username : req_body.username, password : req_body.password} as ILoginRequest
            );

            if (!payload.success)
                res.status(400).json( {success : false, message : "fatal error"} );

            res.json( payload );
        }));

    }
}
