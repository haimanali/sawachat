/**
 * apiCaller.ts — Shared HTTP utility
 * Wraps fetch for all REST API calls to the SawaChat backend.
 * (gp1.pdf REQ-CI.2: non-real-time ops use REST/HTTPS)
 */

export async function apiCall(url: string, method = "POST", data: any): Promise<any> {
    try {
        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        // If the server explicitly returns a 5xx error (e.g. Database Failure, 500 Internal Server Error)
        if (response.status >= 500) {
            window.location.href = `error.html?code=${response.status}_Server_Error`;
            return { success: false, error: "Server Error" }; // Prevent further execution while redirecting
        }

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (err: any) {
        // If the fetch completely fails (e.g. backend is completely down / Network Error)
        if (err.name === "TypeError" || err.message.includes("Failed to fetch")) {
            window.location.href = `error.html?code=Network_Error_DB_Down`;
            return { success: false, error: "Network Error" };
        }
        throw err;
    }
}
