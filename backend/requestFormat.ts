import { z } from 'zod'

export const login_schema = z.object({
    auto_login : z.boolean().default(false),
    username : z.string(),
    password : z.string(),
});

export type ILoginRequest = z.infer<typeof login_schema>;


export const signup_schema = z.object({
    username : z.string(),
    nickname : z.string(),
    password : z.string(),
});

export type ISignUpRequest = z.infer<typeof signup_schema>;