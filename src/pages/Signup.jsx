import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";

function Signup() {
    const navigate = useNavigate();
    const inputRef = useRef();
    const confirmInputRef = useRef();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [deviceFingerprint, setDeviceFingerprint] = useState("");
    const [deviceInfo, setDeviceInfo] = useState({ os: "Unknown", browser: "Unknown" });
    const [geoData, setGeoData] = useState({
        ip: "unknown",
        city: "unknown",
        country: "unknown",
        latitude: "",
        longitude: "",
    });

    // 🧬 Generate unique fingerprint
    const generateFingerprint = useCallback(() => {
        const { width, height } = window.screen;
        const data = navigator.userAgent + navigator.language + width + height + Intl.DateTimeFormat().resolvedOptions().timeZone;
        return btoa(data).substring(0, 32);
    }, []);

    // 🧠 Detect OS + Browser
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

    // 🌐 Fetch IP and location
    const fetchLocation = async () => {
        try {
            const res = await fetch("https://ipapi.co/json/");
            const data = await res.json();
            return {
                ip: data.ip || "unknown",
                city: data.city || "unknown",
                country: data.country_name || "unknown",
                latitude: data.latitude || "",
                longitude: data.longitude || "",
            };
        } catch (err) {
            console.warn("🌍 Location fetch failed:", err);
            return {
                ip: "unknown",
                city: "unknown",
                country: "unknown",
                latitude: "",
                longitude: "",
            };
        }
    };

    // 🧭 Initialize fingerprint + device info + location
    useEffect(() => {
        let didCancel = false;

        const initDeviceData = async () => {
            setDeviceFingerprint(generateFingerprint());
            setDeviceInfo(detectDeviceInfo());
            const location = await fetchLocation();
            if (!didCancel) setGeoData(location);
        };

        initDeviceData();

        return () => {
            didCancel = true;
        };
    }, [generateFingerprint, detectDeviceInfo]);

    useEffect(() => {
        if (inputRef.current) inputRef.current.type = showPassword ? "text" : "password";
    }, [showPassword]);

    useEffect(() => {
        if (confirmInputRef.current) confirmInputRef.current.type = showConfirmPassword ? "text" : "password";
    }, [showConfirmPassword]);

    // 🔐 Handle Signup
    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        let didCancel = false;

        // ✅ Validations
        if (!/^\d{10}$/.test(formData.mobile)) {
            setError("Mobile number must be 10 digits");
            setLoading(false);
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            setError("Invalid email format");
            setLoading(false);
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;
        if (!passwordRegex.test(formData.password)) {
            setError("Password must be 8–12 chars, include uppercase, lowercase, number & special char");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const userAgent = navigator.userAgent;
            const payload = {
                name: formData.name,
                email: formData.email,
                mobile: formData.mobile,
                password: formData.password,
                userAgent,
                deviceName: `${deviceInfo.os} - ${deviceInfo.browser}`,
                deviceOs: deviceInfo.os,
                deviceFingerprint,
                ipAddress: geoData.ip,
                geoCity: geoData.city,
                geoCountry: geoData.country,
                geoLatitude: geoData.latitude,
                geoLongitude: geoData.longitude,
                registrationSource: "Web",
            };

            console.log("📤 Sending signup payload:", payload);

            const res = await fetch("http://localhost:5000/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || `Server error (${res.status})`);

            if (!didCancel) {
                if (data.success) {
                    console.log("✅ Signup success — OTP sent to:", formData.email);

                    sessionStorage.setItem("signupEmail", formData.email);
                    sessionStorage.setItem("otpPending", "true");
                    sessionStorage.setItem("otpLastSentAt", Date.now().toString());

                    setMessage("✅ OTP sent! Redirecting to verification page...");
                    setTimeout(() => navigate("/verify-otp"), 1500);  // Automatic redirect to VerifyOTP page after OTP is sent
                } else {
                    setError(data.message || "Signup failed. Try again.");
                }
            }
        } catch (err) {
            if (!didCancel) {
                console.error("🔥 Signup error:", err);
                setError(err.message || "Server not reachable. Try again later.");
            }
        } finally {
            if (!didCancel) setLoading(false);
        }

        return () => {
            didCancel = true;
        };
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="back-to-login">
                    <Link to="/login">← Back to Login</Link>
                </div>
                <div className="login-header">
                    <h1>Join Us</h1>
                    <p>Create your AI ChatBot account</p>
                </div>
                <form onSubmit={handleSignup} className="login-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter your full name"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="mobile">Mobile Number</label>
                        <input
                            id="mobile"
                            type="text"
                            name="mobile"
                            required
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            placeholder="Enter your 10-digit mobile number"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                ref={inputRef}
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password visibility"
                            >
                                <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="password-wrapper">
                            <input
                                id="confirmPassword"
                                ref={confirmInputRef}
                                type="password"
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="Confirm your password"
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label="Toggle confirm password visibility"
                            >
                                <i className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    {message && <div className="success-message">{message}</div>}
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? "Signing Up..." : 'Sign Up'}
                    </button>
                </form>
                <div className="login-footer">
                    <p>
                        Already have an account? <Link to="/login" className="signup-link">Sign in here</Link>
                    </p>
                </div>
            </div>
            <div className="login-illustration">
                <div className="illustration-content">
                    <h2>AI-Powered Conversations</h2>
                    <p>Join the future of chatting with our advanced AI.</p>
                </div>
            </div>
        </div>
    );
}

export default Signup;