import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import "./ResetPassword.css";

function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const inputRef = useRef();
    const confirmInputRef = useRef();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isTokenValid, setIsTokenValid] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [deviceFingerprint, setDeviceFingerprint] = useState("");
    const [deviceInfo, setDeviceInfo] = useState({ os: "Unknown", browser: "Unknown" });
    const [geoData, setGeoData] = useState({
        ipAddress: "",
        geoCity: "",
        geoRegion: "",
        geoCountry: "",
        geoLatitude: "",
        geoLongitude: "",
    });

    // 🔑 Token from URL (EMAIL SAFE)
    const token = searchParams.get("token");

    // ✅ Validate token presence (NO SESSION DEPENDENCY)
    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token.");
            setIsTokenValid(false);
            return;
        }

        // store token for submit usage
        sessionStorage.setItem("resetToken", token);
    }, [token]);

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

    // 🧠 Device Info
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

    // 🌍 Location
    const fetchLocation = async () => {
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
        } catch {
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

    // 🧭 Init device + geo
    useEffect(() => {
        let mounted = true;
        (async () => {
            setDeviceFingerprint(generateFingerprint());
            setDeviceInfo(detectDeviceInfo());
            const loc = await fetchLocation();
            if (mounted) setGeoData(loc);
        })();
        return () => (mounted = false);
    }, [generateFingerprint, detectDeviceInfo]);

    useEffect(() => {
        if (inputRef.current) inputRef.current.type = showPassword ? "text" : "password";
    }, [showPassword]);

    useEffect(() => {
        if (confirmInputRef.current)
            confirmInputRef.current.type = showConfirmPassword ? "text" : "password";
    }, [showConfirmPassword]);

    // 🔐 Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        const storedToken = sessionStorage.getItem("resetToken");
        if (!storedToken) {
            setError("Invalid or expired reset link.");
            return;
        }

        if (!password || password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;

        if (!passwordRegex.test(password)) {
            setError("Password must be 8–12 chars with uppercase, lowercase, number & symbol.");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                token: storedToken,
                newPassword: password,
                userAgent: navigator.userAgent,
                deviceName: `${deviceInfo.os} - ${deviceInfo.browser}`,
                deviceOs: deviceInfo.os,
                deviceFingerprint,
                requestSource: "WebResetPassword",
                ...geoData,
            };

            const res = await fetch("http://localhost:5000/api/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            if (data.success) {
                setMessage("✅ Password updated successfully. Redirecting...");
                sessionStorage.removeItem("resetToken");
                setTimeout(() => navigate("/login", { replace: true }), 2500);
            } else {
                setError(data.message || "Reset failed.");
            }
        } catch (err) {
            setError(err.message || "Server error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>Reset Password</h1>
                    <p>Enter your new password</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>New Password</label>
                        <div className="password-wrapper">
                            <input ref={inputRef} type="password" value={password}
                                   onChange={(e) => setPassword(e.target.value)} required />
                            <button type="button" className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}>
                                <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="password-wrapper">
                            <input ref={confirmInputRef} type="password"
                                   value={confirmPassword}
                                   onChange={(e) => setConfirmPassword(e.target.value)} required />
                            <button type="button" className="toggle-password"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <i className={`fa ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`} />
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {message && <div className="success-message">{message}</div>}

                    <button className="login-button" disabled={loading || !isTokenValid}>
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Remember your password?</p>
                    <Link to="/login">Sign In Here</Link>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
