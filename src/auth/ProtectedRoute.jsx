import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    // ⏳ wait for auth to load (prevents black screen)
    if (loading) return null;

    // ❌ not logged in
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // ✅ logged in
    return children;
};

export default ProtectedRoute;
