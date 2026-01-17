// ProtectedOTPRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedOTPRoute({ children }) {
    const otpPending = sessionStorage.getItem("otpPending");
    return otpPending ? children : <Navigate to="/signup" replace />;
}

export default ProtectedOTPRoute;
