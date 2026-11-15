
import { Request, Response } from "express";
import { searchPatientsService } from "./patient-links.service";

/**
 * Controller for searching patients.
 */
export async function searchPatientsController(
    req: Request,
    res: Response
) {
    try {
const { q, limit, offset } = res.locals.validatedQuery;

        const patients = await searchPatientsService(
            q,
            limit,
            offset
        );

        return res.status(200).json({
            success: true,
            message: "Patients retrieved successfully",
            data: patients,
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Something went wrong";

        return res.status(400).json({
            success: false,
            message,
        });
    }
}
