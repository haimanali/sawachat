import { z } from 'zod'

export const login_schema = z.object({
    auto_login : z.boolean().default(false),
    username : z.string(),
    password : z.string(),
});

export type ILoginRequest = z.infer<typeof login_schema>;