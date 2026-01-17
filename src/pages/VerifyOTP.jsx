import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./VerifyOTP.css";

const VerifyOTP = () => {
    const navigate = useNavigate();
    const email = sessionStorage.getItem("signupEmail") || "";

    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const [geoData, setGeoData] = useState({
        ip: "unknown",
        city: "unknown",
        country: "unknown",
    });

    const [deviceFingerprint, setDeviceFingerprint] = useState("");
    const [deviceInfo, setDeviceInfo] = useState({
        os: "Unknown",
        browser: "Unknown",
    });

    // 🔐 Prevent invalid access
    useEffect(() => {
        const otpPending = sessionStorage.getItem("otpPending");

        if (!otpPending || !email) {
            navigate("/signup", { replace: true });
            return;
        }

        setMessage("📧 OTP sent successfully! Please verify to continue.");
    }, [navigate, email]);

    // ⏳ Resend timer initialization
    useEffect(() => {
        const lastSent = Number(sessionStorage.getItem("otpLastSentAt") || 0);

        if (!lastSent) {
            sessionStorage.setItem("otpLastSentAt", Date.now().toString());
            setResendTimer(30);
            return;
        }

        const diff = Math.floor((Date.now() - lastSent) / 1000);
        if (diff < 30) setResendTimer(30 - diff);
    }, []);

    useEffect(() => {
        if (resendTimer <= 0) return;
        const timer = setTimeout(() => setResendTimer((p) => p - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendTimer]);

    // 🧬 Fingerprint
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

    // 🧠 Device info
    const detectDeviceInfo = useCallback(() => {
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
    }, []);

    // 🌍 Location
    const fetchLocation = async () => {
        try {
            const res = await fetch("https://ipapi.co/json/");
            const data = await res.json();
            setGeoData({
                ip: data.ip || "unknown",
                city: data.city || "unknown",
                country: data.country_name || "unknown",
            });
        } catch {}
    };

    useEffect(() => {
        setDeviceFingerprint(generateFingerprint());
        setDeviceInfo(detectDeviceInfo());
        fetchLocation();
    }, [generateFingerprint, detectDeviceInfo]);

    // ✅ Verify OTP
    const handleVerify = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!otp.trim()) {
            setError("Please enter OTP");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("http://localhost:5000/api/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    otp,
                    userAgent: navigator.userAgent,
                    deviceName: `${deviceInfo.os} - ${deviceInfo.browser}`,
                    deviceOs: deviceInfo.os,
                    deviceFingerprint,
                    ipAddress: geoData.ip,
                    geoCity: geoData.city,
                    geoCountry: geoData.country,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setMessage("✅ OTP verified! Redirecting...");
                setTimeout(() => {
                    sessionStorage.clear();
                    navigate("/login", { replace: true });
                }, 1500);
            } else {
                setError(data.message || "❌ Invalid OTP");
            }
        } catch {
            setError("⚠️ Server error. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    // 🔁 Resend OTP
    const handleResend = async () => {
        if (resendTimer > 0) return;

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("http://localhost:5000/api/resend-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setMessage("📧 OTP resent successfully!");
                sessionStorage.setItem("otpLastSentAt", Date.now().toString());
                setResendTimer(30);
            } else {
                setError(data.message || "❌ Failed to resend OTP");
            }
        } catch {
            setError("⚠️ Error resending OTP");
        } finally {
            setLoading(false);
        }
    };

    const maskEmail = (email) => {
        if (!email.includes("@")) return email;
        const [u, d] = email.split("@");
        return `${u.slice(0, 3)}***${u.slice(-2)}@${d}`;
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="back-to-login">
                    <Link to="/login">← Back to Login</Link>
                </div>

                <div className="login-header">
                    <h1>Verify OTP</h1>
                    <p>Enter the 6-digit OTP sent to <strong>{maskEmail(email)}</strong></p>
                </div>

                <form onSubmit={handleVerify} className="login-form">
                    <div className="form-group">
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength="6"
                            placeholder="Enter OTP"
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {message && <div className="success-message">{message}</div>}

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>

                    <button
                        type="button"
                        className="resend-button"
                        onClick={handleResend}
                        disabled={resendTimer > 0 || loading}
                    >
                        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VerifyOTP;
