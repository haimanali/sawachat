import express, { Express, NextFunction, RequestHandler, Request, Response } from 'express'
import { success, z } from 'zod'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { ILoginRequest, ISignUpRequest, login_schema, signup_schema } from '../requestFormat.js'
import { DBConn } from "../repository/DBConn.js";
import { IApiApplication } from '../Application/IApiApplication.js'

export class StatelessController {

    public static getInstance(app: express.Express, Iapp_layer: IApiApplication): StatelessController {
        if (StatelessController.instance)
            return StatelessController.instance;

        StatelessController.instance = new StatelessController(app, Iapp_layer);
        return StatelessController.instance;
    }

    private static instance: StatelessController;
    private app_layer: IApiApplication;
    private app: Express;
    private constructor(app: express.Express, Iapp_layer: IApiApplication) {
        this.app_layer = Iapp_layer;
        this.app = app;

        this.app.use(cors({
            origin: "http://localhost:5173",
            credentials: true,
            methods: ["POST", "GET", "PUT", "DELETE"],
        }));

        this.app.use(express.json());
        this.app.use(cookieParser());

        this.initRoutes();

        //error middleware
        this.app.use((error: any, req: Request, res: Response, next: NextFunction) => {

            if (req.path.startsWith("/api/")) {
                console.log(error.message);

                const status = error.status || 500;
                res.status(status).json({ success: false, message: "Server down" });
            }
        });
    }


    private async transactionHandler(handleData: () => Promise<void>): Promise<void> {
        const conn = await DBConn.beginTransaction()
        try {
            DBConn.runTransaction(conn, async () => {
                await handleData();
            });
            await conn.commit();
        }
        catch (error) {
            await conn.rollback();
            throw Error("something went wrong, please try again later...");
        }
        finally {
            conn.release();
        }
    }

    private errorHandler(fn: Function) {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                await this.transactionHandler(async () => await fn(req, res));
            }
            catch (error) {
                next(error);
            }
        };
    }

    private validateJSON(schema: z.ZodSchema): RequestHandler {
        return (req: Request, res: Response, next: NextFunction) => {
            const result = schema.safeParse(req.body);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed, request has been altered",
                });
            }
            else {
                req.body = result.data;
                next();
            }

        };
    }

    private setCookie(res: Response, auto_login: boolean, session_id: string): void {
        const cookie_options: any = { httponly: true } //add secure...

        if (auto_login) {
            cookie_options.maxAge = (14 * 24 * 60 * 60 * 1000); // 14 days
        }

        res.cookie("session_id", session_id, cookie_options);
    }


    private initRoutes(): void {
        this.app.get("/api/auth/session/check/:username", this.errorHandler(async (req: Request, res: Response) => {

            const session_id = req.cookies.session_id;
            if (!session_id) {
                res.status(401).json({ success: false, log_message: "user doesn't have a session id" });
                return;
            }

            const payload = await this.app_layer.authenticateBySessionID(session_id);

            if (!payload.success) {
                res.status(403).json({ success: false, data: req.params.username, log_message: payload.log_message });
                return;
            }

            if (payload.data!.username !== req.params.username) {
                res.status(400).json({
                    success: false,
                    log_message: "username doesn't match current session",
                });
                return;
            }

            res.status(200).json({
                success: payload.success,
                data: payload.data,
                log_message: payload.log_message,
            });
        }));

        this.app.get("/api/auth/session", this.errorHandler(async (req: Request, res: Response) => {

            const session_id = req.cookies.session_id;
            if (!session_id) {
                res.status(200).json({ success: false, log_message: "no session was found" });
                return;
            }

            const payload = await this.app_layer.authenticateBySessionID(session_id);
            res.status(200).json({
                success: payload.success,
                data: payload.data,
                log_message: payload.log_message,
            });

        }));

        this.app.post("/api/auth/session/logout", this.errorHandler(async (req: Request, res: Response) => {
            const session_id = req.cookies.session_id;
            if (!session_id) {
                res.status(400).json({ success: false, log_message: "no session was found" });
                return;
            }

            const payload = await this.app_layer.logoutUser(session_id);

            res.clearCookie("session_id");
            res.status(200).json(payload);
        }));

        this.app.post("/api/login", this.validateJSON(login_schema), this.errorHandler(async (req: Request, res: Response) => {

            const req_body: ILoginRequest = req.body;
            const payload = await this.app_layer.loginUser(req_body);

            if (payload.success) {
                this.setCookie(res, req.body.auto_login, payload.internal!.session_id);
            }

            res.status(200).json({
                success: payload.success,
                data: payload.data,
                log_message: payload.log_message,
            });
        }));

        this.app.post("/api/signup", this.validateJSON(signup_schema), this.errorHandler(async (req: Request, res: Response) => {

            const req_body: ISignUpRequest = req.body;
            const payload = await this.app_layer.registerUser(req_body);

            if (payload.success) {
                this.setCookie(res, true, payload.internal!.session_id!);
            }

            res.status(200).json({
                success: payload.success,
                data: payload.data,
                log_message: payload.log_message,
            });

        }));

    }
}
