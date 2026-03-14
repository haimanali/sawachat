export async function apiCall(url : string, method = "POST", data : any)
{
    const call = await fetch(url, {
        method: method,
        headers : { "Content-Type" : "application/json" },
        body : JSON.stringify(data)
    });

    if(!call.ok)
    {
        throw Error("fatal error");
    }

    const response = await call.json();
    
    return response;
}