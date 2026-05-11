// this is a helper function to make rest api calls to our backend
// it handles things like headers and auto-redirecting on errors
export async function apiCall(url: string, method = "POST", data?: any) {
    const fetchOptions: RequestInit = {
        method: method,
        credentials: "include", // we need this to send cookies
        headers: { "Content-Type": "application/json" },
    };

    // we only send a body if it's not a GET request
    if (data && !(method == "GET")) {
        fetchOptions.body = JSON.stringify(data);
    }

    const call = await fetch(url, fetchOptions);

    // if the server returns an error, we handle it based on the status code
    if (!call.ok) {
        switch (call.status) {
            case 401:
            case 400:
                // redirect to landing page if not authorized
                window.location.href = "/";
                break;
            case 403:
                // redirect to ban page if the user is banned
                const err_data = await call.json();
                const username = err_data.data!.username;
                window.location.href = `/u/${username}/ban`;
                break;
            default:
                // show general error page for other issues
                window.location.href = "/error";
                break;
        }
        return;
    }

    // if everything is okay, we return the json response
    const response = await call.json();
    return response;
}