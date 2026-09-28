import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./verifyToken";

export function requireRole(...allowedRoles: string[]) {
    return (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) => {

        // verifyToken should already have added req.user.
        if (!req.user) {
            return res.status(401).json({
                error: "Authentication required",

            });
        }

        // Check whether the authenticated user's role
        // is allowed to access this endpoint.
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "You do not have permission to access this resource",
                isaccess: false
            });
        }

        // User is authenticated AND has the required role.
        next();
    };
}