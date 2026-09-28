import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        role: string;
    };
}

export function verifyToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        // Read the Authorization header.
        // Expected:
        // Authorization: Bearer <JWT>
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: "Authentication required",
            });
        }

        // Separate "Bearer" and the actual token.
        const [scheme, token] = authHeader.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({
                error: "Invalid authorization header",
            });
        }

        // JWT_SECRET is required to verify the token.
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET is not configured");
        }

        // Verify the signature and expiration.
        const decoded = jwt.verify(token, secret);

        // Make sure the payload contains the data
        // our application expects.
        if (
            typeof decoded !== "object" ||
            decoded === null ||
            typeof decoded.userId !== "number" ||
            typeof decoded.role !== "string"
        ) {
            return res.status(401).json({
                error: "Invalid token payload",
            });
        }

        // Attach the authenticated user's information
        // to the Express request.
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };

        // Token is valid.
        // Continue to the protected endpoint.
        next();

    } catch (error) {
        console.error(error);

        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
}