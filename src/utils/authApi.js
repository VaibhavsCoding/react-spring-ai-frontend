const AUTH_API_BASE = "http://localhost:5000/api";

// Updated to use "auth_token" for consistency
export const authHeaders = (includeAuth = true) => {
    const headers = { "Content-Type": "application/json" };
    if (includeAuth) {
        headers["Authorization"] = `Bearer ${localStorage.getItem("auth_token") || ""}`;
    }
    return headers;
};

export const postAuth = async (url, body, includeAuth = true) => {
    const response = await fetch(`${AUTH_API_BASE}${url}`, {
        method: "POST",
        headers: authHeaders(includeAuth),
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error(`Auth API error: ${response.status}`);
    }
    return response.json();
};

export const getAuth = async (url, includeAuth = true) => {
    const response = await fetch(`${AUTH_API_BASE}${url}`, {
        headers: authHeaders(includeAuth)
    });
    if (!response.ok) {
        throw new Error(`Auth API error: ${response.status}`);
    }
    return response.json();
};