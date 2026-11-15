
import { Router } from "express";
import { searchPatientsController } from "./patient-links.controller";
import { searchPatientsSchema } from "./patient-links.schema";

import { verifyToken } from "../../common/middleware/verifyToken";
import { requireRole } from "../../common/middleware/requireRole";
import { validateQuery } from "../../common/middleware/validateQuery";

const router = Router();

router.get(
    "/patients/search",
    verifyToken,
    requireRole("doctor", "caregiver"),
    validateQuery(searchPatientsSchema),
    searchPatientsController
);

export default router;
