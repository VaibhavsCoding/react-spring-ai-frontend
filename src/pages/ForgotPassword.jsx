import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./ForgotPassword.css"; // New CSS file for this page

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();

    // 🧩 Generate lightweight device fingerprint
    const generateFingerprint = () => {
        const { width, height } = window.screen;
        const data =
            navigator.userAgent +
            navigator.language +
            width +
            height +
            Intl.DateTimeFormat().resolvedOptions().timeZone;
        return btoa(data).substring(0, 32);
    };

    // 🧠 Detect OS & Browser
    const detectDeviceInfo = () => {
        const ua = navigator.userAgent;
        let os = "Unknown OS";
        let browser = "Unknown Browser";

        if (ua.includes("Win")) os = "Windows";
        else if (ua.includes("Mac")) os = "MacOS";
        else if (ua.includes("Linux")) os = "Linux";
        else if (/Android/i.test(ua)) os = "Android";
        else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";

        if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Safari")) browser = "Safari";
        else if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Edge")) browser = "Edge";

        return { os, browser };
    };

    // 🌍 Get user location and IP address
    const getUserLocation = async () => {
        try {
            const res = await fetch("https://ipapi.co/json/");
            const data = await res.json();
            return {
                ipAddress: data.ip || "",
                geoCity: data.city || "",
                geoRegion: data.region || "",
                geoCountry: data.country_name || "",
                geoLatitude: data.latitude || "",
                geoLongitude: data.longitude || "",
            };
        } catch (err) {
            console.warn("⚠️ Failed to fetch location:", err);
            return {
                ipAddress: "",
                geoCity: "",
                geoRegion: "",
                geoCountry: "",
                geoLatitude: "",
                geoLongitude: "",
            };
        }
    };

    // 🔐 Handle Forgot Password submission
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        // 📧 Basic validation
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError("Invalid email address");
            return;
        }

        setLoading(true);

        try {
            // 🧠 Collect device & location info
            const userAgent = navigator.userAgent;
            const { os, browser } = detectDeviceInfo();
            const deviceFingerprint = generateFingerprint();
            const location = await getUserLocation();

            // 📦 Build payload for backend
            const payload = {
                email,
                userAgent,
                deviceName: `${os} / ${browser}`,
                deviceOs: os,
                deviceFingerprint,
                registrationSource: "ForgotPassword",
                ...location,
            };

            const res = await fetch("http://localhost:5000/api/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `Server error (${res.status})`);
            }

            if (data.success) {
                setMessage("📧 A password reset link has been sent to your email.");
                console.log("✅ Forgot Password request sent for:", email, payload);

                // Start countdown and redirect
                setCountdown(3);
                const timer = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            navigate("/login");
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setError(data.message || "Failed to send reset link. Try again.");
            }
        } catch (err) {
            console.error("🔥 Forgot Password Error:", err);
            setError(err.message || "⚠️ Server not reachable. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>Forgot Password</h1>
                    <p>Enter your email to receive a reset link</p>
                </div>
                <form onSubmit={handleForgotPassword} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    {message && (
                        <div className="success-message">
                            {message} Redirecting in {countdown} seconds...
                        </div>
                    )}
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>
                <div className="login-footer">
                    <p>Remember your password?</p>
                    <Link to="/login" className="signin-button">Back to Login</Link>
                </div>
            </div>
            <div className="login-illustration">
                <div className="illustration-content">
                    <h2>Secure Recovery</h2>
                    <p>We'll help you regain access to your AI ChatBot account safely.</p>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;