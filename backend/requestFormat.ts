import { z } from 'zod'

//stateless schema
export const login_schema = z.object({
    auto_login : z.boolean().default(false),
    username : z.string().min(2).max(16),
    password : z.string().min(8),
});

export type ILoginRequest = z.infer<typeof login_schema>;


export const signup_schema = z.object({
    username : z.string().min(2).max(16),
    nickname : z.string().max(8),
    password : z.string().min(8),
});

export type ISignUpRequest = z.infer<typeof signup_schema>;

//stateful schema
const load_requests = z.object({
    type : z.literal("load_requests"),
    payload : z.object({
        offset : z.number(),
    }),
});

const load_rooms = z.object({
    type : z.literal("load_rooms"),
    payload : z.object({
        offset : z.number(),
    }),
});

const load_messages = z.object({
    type : z.literal("load_messages"),
    payload : z.object({
        room_public_id : z.string().max(36),
        offset : z.number(),
    }),
});

const accpt_req_schema = z.object(
    {
        type : z.literal("verdict_request_create_room"),
        payload : z.object({
            username : z.string().min(2).max(16),
            req_public_id : z.string().max(36),
            verdict : z.boolean().default(true),
        }),
    }
);
const request_schema = z.object(
    {
        type : z.literal("send_request"),
        payload : z.object({
            username : z.string().min(2).max(16),
        }),
    }
);
const message_schema = z.object(
    {
        type : z.literal("send_message"),
        payload : z.object({
            room_public_id : z.string().min(1),
            msg_content : z.string().min(1).max(200),
        }),
    }
);

export const action_schema = z.discriminatedUnion("type", [
    load_messages,
    load_rooms,
    load_requests,
    message_schema,
    request_schema,
    accpt_req_schema,
]);

export type IActionRequest = z.infer<typeof action_schema>;