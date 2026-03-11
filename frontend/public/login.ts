import { apiCall } from "./apiCaller.ts";

/*
here you create the login logic get user input and construct a json object of this shape

MUST BE LIKE THIS

{
auto_login : boolean,         ** this is a auto login checkbox like (remmeber me)
username : string,
password : string,
}

then use the apiCall and send the paramters like this (localhost:3000/api/signup, method = "POST", data as A JSON)
the function will return a Object like this

{
success : boolean,
client : {
username : string,
nickname : string,
session_id : string,
}
}
*/

