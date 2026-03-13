/**
 * apiCaller.ts — Shared HTTP utility
 * Wraps fetch for all REST API calls to the SawaChat backend.
 * (gp1.pdf REQ-CI.2: non-real-time ops use REST/HTTPS)
 */

export async function apiCall(url: string, method = "POST", data: any): Promise<any> {
    const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}
