import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Login.css";

function Login() {
    const navigate = useNavigate();
    const inputRef = useRef();
    const { login } = useAuth(); // ✅ use AuthContext

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [locked, setLocked] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [deviceFingerprint, setDeviceFingerprint] = useState("");
    const [deviceInfo, setDeviceInfo] = useState({ os: "Unknown", browser: "Unknown" });

    // 🌍 Fetch location
    const fetchLocation = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/geo");
            if (!res.ok) throw new Error();
            return await res.json();
        } catch {
            return { ip: "unknown", city: "unknown", country: "unknown" };
        }
    };

    // 🧠 Detect OS + browser
    const detectDeviceInfo = useCallback(() => {
        const ua = navigator.userAgent;
        let os = "Unknown OS";
        let browser = "Unknown Browser";

        if (ua.includes("Win")) os = "Windows";
        else if (ua.includes("Mac")) os = "MacOS";
        else if (ua.includes("Linux")) os = "Linux";
        else if (/Android/i.test(ua)) os = "Android";
        else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";

        if (ua.includes("Edg")) browser = "Edge";
        else if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Safari")) browser = "Safari";
        else if (ua.includes("Firefox")) browser = "Firefox";

        return { os, browser };
    }, []);

    // 🔧 Fingerprint
    const generateFingerprint = useCallback(() => {
        const { width, height } = window.screen;
        const data =
            navigator.userAgent +
            navigator.language +
            width +
            height +
            Intl.DateTimeFormat().resolvedOptions().timeZone;
        return btoa(data).substring(0, 32);
    }, []);

    useEffect(() => {
        setDeviceFingerprint(generateFingerprint());
        setDeviceInfo(detectDeviceInfo());
    }, [detectDeviceInfo, generateFingerprint]);

    // ⏳ Lock countdown
    useEffect(() => {
        if (!locked || remaining <= 0) return;

        const timer = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setLocked(false);
                    setError("");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [locked, remaining]);

    // 👁️ Toggle password
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.type = showPassword ? "text" : "password";
        }
    }, [showPassword]);

    // 🔐 LOGIN HANDLER
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        const geo = await fetchLocation();

        const payload = {
            email: formData.email,
            password: formData.password,
            userAgent: navigator.userAgent,
            deviceName: `${deviceInfo.os} - ${deviceInfo.browser}`,
            deviceOs: deviceInfo.os,
            deviceFingerprint,
            registrationSource: "Web",
            ipAddress: geo.ip,
            geoCity: geo.city,
            geoCountry: geo.country,
        };

        try {
            const res = await fetch("http://localhost:5000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.locked) {
                setLocked(true);
                setRemaining(data.remainingSeconds || 60);
                setError(`Account locked. Try again in ${data.remainingSeconds || 60} seconds.`);
                return;
            }

            if (data.unverified || data.message?.includes("verify")) {
                setError("Please verify your email before logging in.");
                sessionStorage.setItem("signupEmail", formData.email);
                sessionStorage.setItem("otpPending", "true");
                setTimeout(() => navigate("/verify-pending", { replace: true }), 1200);
                return;
            }

            if (data.success && data.token) {
                // ✅ SINGLE SOURCE OF TRUTH
                login(data.token);

                if (data.user) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                }

                navigate("/chat", { replace: true });
            } else {
                setError(data.message || "Invalid email or password");
            }
        } catch {
            setError("Server not reachable. Try again later.");
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>Welcome Back</h1>
                    <p>Sign in to your AI ChatBot account</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                ref={inputRef}
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <i
                                    className={`fa ${
                                        showPassword ? "fa-eye-slash" : "fa-eye"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    {locked && remaining > 0 && (
                        <div className="info-message">
                            <i className="fa fa-clock-o" /> Please wait {remaining} seconds
                            before retrying.
                        </div>
                    )}

                    <button type="submit" className="login-button" disabled={locked}>
                        {locked ? `Locked (${remaining}s)` : "Sign In"}
                    </button>
                </form>

                <div className="login-footer">
                    <Link to="/forgot-password" className="forgot-link">
                        Forgot your password?
                    </Link>
                    <p>Don't have an account?</p>
                    <Link to="/signup" className="signup-button">
                        Sign Up Here
                    </Link>
                </div>
            </div>

            <div className="login-illustration">
                <div className="illustration-content">
                    <h2>AI-Powered Conversations</h2>
                    <p>Experience the future of chatting with our advanced AI.</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
