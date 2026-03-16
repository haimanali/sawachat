export async function apiCall(url : string, method = "POST", data? : any)
{
    const fetchOptions : RequestInit = {
        method: method,
        credentials : "include",
        headers : { "Content-Type" : "application/json" },
    };

    if (data && !(method == "GET"))
    {
        fetchOptions.body = JSON.stringify(data);
    }
    
    const call = await fetch(url, fetchOptions);

    if(!call.ok)
    {
        window.location.href = "*";
        throw Error("fatal error");
    }

    const response = await call.json();
    
    return response;
}