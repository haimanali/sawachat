import { z } from 'zod'

export enum IPayloadRequestType
{
    MESSAGE_RECEIVED = "message_received",
    SEND_MESSAGE = "send_message",
    SEND_REQUEST = "send_request",
    VERDICT_REQUEST = "verdict_request_create_room",
    LOAD_ROOMS = "load_rooms",
    LOAD_REQUESTS = "load_requests",
    LOAD_MESSAGES =  "load_messages",
    DELIVER_RECEIVED_MESSAGES = "deliver_received_messages",
    LIMIT = 10,
}


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
    type : z.literal(IPayloadRequestType.LOAD_REQUESTS),
    payload : z.object({
        cursor : z.coerce.date().nullable(),
    }),
});

const load_rooms = z.object({
    type : z.literal(IPayloadRequestType.LOAD_ROOMS),
    payload : z.object({
        cursor : z.coerce.date().nullable(),
    }),
});

const load_messages = z.object({
    type : z.literal(IPayloadRequestType.LOAD_MESSAGES),
    payload : z.object({
        room_public_id : z.string().max(36),
        cursor : z.coerce.date().nullable(),
    }),
});

const deliver_received_messages = z.object({
    type : z.literal(IPayloadRequestType.DELIVER_RECEIVED_MESSAGES)
});

const verdict_req_schema = z.object(
    {
        type : z.literal(IPayloadRequestType.VERDICT_REQUEST),
        payload : z.object({
            username : z.string().min(2).max(16),
            req_public_id : z.string().max(36),
            verdict : z.boolean().default(true),
        }),
    }
);
const send_request_schema = z.object(
    {
        type : z.literal(IPayloadRequestType.SEND_REQUEST),
        payload : z.object({
            username : z.string().min(2).max(16),
        }),
    }
);
const send_message_schema = z.object(
    {
        type : z.literal(IPayloadRequestType.SEND_MESSAGE),
        payload : z.object({
            room_public_id : z.string().max(36),
            msg_content : z.string().min(1).max(300),
            iv : z.string().max(32),
        }),
    }
);

const message_received = z.object({
    type : z.literal(IPayloadRequestType.MESSAGE_RECEIVED),
    payload : z.object({
        msg_public_id : z.string().max(36),
        room_public_id : z.string().max(36),
        s_username : z.string().max(16),
        is_delivered : z.boolean(),
    }),
});

export const action_schema = z.discriminatedUnion("type", [
    load_messages,
    load_rooms,
    load_requests,
    send_message_schema,
    message_received,
    send_request_schema,
    verdict_req_schema,
    deliver_received_messages
]);

export type IActionRequest = z.infer<typeof action_schema>;