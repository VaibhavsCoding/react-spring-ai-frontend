const CHAT_API_BASE = "http://localhost:8080/api";

// Already uses "auth_token" – no change needed
export const chatHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}`
});

export const postChat = async (url, body) => {
    const response = await fetch(`${CHAT_API_BASE}${url}`, {
        method: "POST",
        headers: chatHeaders(),
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
    }

    return response.json();
};