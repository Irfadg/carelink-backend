
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export function validateQuery(schema: z.ZodType) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                errors: result.error.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });
        }

        // Store validated query parameters for the controller.
        res.locals.validatedQuery = result.data;

        next();
    };
}
