import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./VerifyPending.css"; // New CSS file based on Login.css

function VerifyPending() {
    const navigate = useNavigate();
    const email = sessionStorage.getItem("signupEmail") || "";

    const [resendMessage, setResendMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const [geoInfo, setGeoInfo] = useState({ ip: "unknown", city: "unknown", country: "unknown" });
    const [deviceFingerprint, setDeviceFingerprint] = useState("");
    const [deviceInfo, setDeviceInfo] = useState({ os: "Unknown", browser: "Unknown" });

    // Mask email for display
    const maskedEmail = email
        ? `${email.slice(0, 3)}***${email.slice(email.indexOf("@") - 2)}`
        : "your email";

    // 🌍 Fetch geo info
    const fetchGeo = async () => {
        try {
            const res = await fetch("https://ipapi.co/json/");
            const data = await res.json();
            setGeoInfo({
                ip: data.ip || "unknown",
                city: data.city || "unknown",
                country: data.country_name || "unknown",
            });
        } catch (err) {
            console.warn("Failed to fetch location info:", err);
        }
    };

    // 🧬 Generate fingerprint
    const generateFingerprint = () => {
        const { width, height } = window.screen;
        const ua = navigator.userAgent;
        const data = ua + navigator.language + width + height + Intl.DateTimeFormat().resolvedOptions().timeZone;
        return btoa(data).substring(0, 32);
    };

    // 🧠 Detect OS and Browser
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

    // Initialize device info, fingerprint, and geo
    useEffect(() => {
        setDeviceFingerprint(generateFingerprint());
        setDeviceInfo(detectDeviceInfo());
        fetchGeo();

        // Restore resend timer if OTP was sent recently
        const lastSent = parseInt(sessionStorage.getItem("otpLastSentAt") || "0", 10);
        const diff = Math.floor((Date.now() - lastSent) / 1000);
        if (diff < 30) setResendTimer(30 - diff);
    }, []);

    // Countdown effect for resend timer
    useEffect(() => {
        if (resendTimer <= 0) return;
        const timer = setTimeout(() => setResendTimer((p) => p - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendTimer]);

    // 🔁 Resend OTP
    const handleResendOTP = async () => {
        if (resendTimer > 0 || loading) return;

        setError("");
        setResendMessage("");
        setLoading(true);

        if (!email) {
            setError("Email not found. Please sign up again.");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                email,
                action: "RESEND_OTP",
                userAgent: navigator.userAgent,
                deviceFingerprint,
                deviceName: `${deviceInfo.os} / ${deviceInfo.browser}`,
                deviceOs: deviceInfo.os,
                ipAddress: geoInfo.ip,
                city: geoInfo.city,
                country: geoInfo.country,
            };

            const res = await fetch("http://localhost:5000/api/resend-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to resend OTP");

            if (data.success) {
                setResendMessage("✅ OTP resent successfully. Please check your inbox.");
                sessionStorage.setItem("otpLastSentAt", Date.now().toString());
                setResendTimer(30);
            } else {
                setError(data.message || "Could not resend OTP. Try again later.");
            }
        } catch (err) {
            console.error("🔥 Error resending OTP:", err);
            setError(err.message || "Server error. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    // Navigate to Verify OTP page
    const handleVerify = () => navigate("/verify-otp");

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>📨 Email Verification Needed</h1>
                    <p>You need to verify your email before logging in.</p>
                </div>
                <div className="verify-form">
                    <div className="form-group">
                        <p className="info">
                            OTP was sent to <strong>{maskedEmail}</strong>.
                        </p>
                    </div>
                    {resendMessage && <div className="success-message">{resendMessage}</div>}
                    {error && <div className="error-message">{error}</div>}
                    <div className="button-group">
                        <button type="button" className="verify-button" onClick={handleVerify}>
                            Verify Now
                        </button>
                        <button
                            type="button"
                            className="resend-button"
                            onClick={handleResendOTP}
                            disabled={resendTimer > 0 || loading}
                        >
                            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : loading ? "Resending..." : "Resend OTP"}
                        </button>
                    </div>
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

export default VerifyPending;