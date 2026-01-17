import { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load token on app start
    useEffect(() => {
        const storedToken = localStorage.getItem("jwtToken");
        setToken(storedToken);
        setLoading(false);
    }, []);

    // Sync token changes across tabs
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === "jwtToken") {
                setToken(e.newValue);
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const login = (newToken) => {
        localStorage.setItem("jwtToken", newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("user");
        sessionStorage.clear();
        setToken(null);
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                login,
                logout,
                isAuthenticated: !!token,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
};
