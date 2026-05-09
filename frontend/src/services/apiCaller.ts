export async function apiCall(url: string, method = "POST", data?: any) {
    const fetchOptions: RequestInit = {
        method: method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    };

    if (data && !(method == "GET")) {
        fetchOptions.body = JSON.stringify(data);
    }

    const call = await fetch(url, fetchOptions);

    if (!call.ok) {
        switch (call.status) {
            case 401:
            case 400:
                window.location.href = "/";
                break;
            case 403:
                const err_data = await call.json();
                const username = err_data.data!.username;
                window.location.href = `/u/${username}/ban`;
                break;
            default:
                window.location.href = "/error";
                break;
        }
        return;
    }

    const response = await call.json();

    return response;
}

/*
{
    success : bool,
    data : T,
    log_message : string,
}

*/