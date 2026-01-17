import { Navigate, useLocation, useSearchParams } from "react-router-dom";

/**
 * FlowGuard
 * @param {ReactNode} children
 * @param {Object} options
 * @param {boolean} options.requireToken - Require URL token (?token=)
 * @param {string} options.requireSessionKey - Require sessionStorage key
 */

const FlowGuard = ({ children, requireSessionKey }) => {
    const location = useLocation();
    const [params] = useSearchParams();

    // 🔓 Allow reset-password via URL token
    if (requireSessionKey === "resetToken") {
        const tokenFromUrl = params.get("token");
        if (tokenFromUrl) return children;
    }

    if (requireSessionKey) {
        const value = sessionStorage.getItem(requireSessionKey);
        if (!value) {
            return <Navigate to="/login" state={{ from: location }} replace />;
        }
    }

    return children;
};

export default FlowGuard;

