
import { z } from "zod";

export const searchPatientsSchema = z.object({
    q: z.string()
        .trim()
        .min(2, "Search query must contain at least 2 characters"),

    limit: z.coerce.number()
        .int()
        .min(1)
        .default(20),

    offset: z.coerce.number()
        .int()
        .min(0)
        .default(0),
});
