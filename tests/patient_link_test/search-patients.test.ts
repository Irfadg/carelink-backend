
import request from "supertest";
import app from "../../src/app";
import pool from "../../src/db/index";

const runId = Date.now();
const password = "password123";

const users = {
    doctor: {
        name: "Search Test Doctor",
        email: `search.doctor.${runId}@example.com`,
        role: "doctor",
    },
    caregiver: {
        name: "Search Test Caregiver",
        email: `search.caregiver.${runId}@example.com`,
        role: "caregiver",
    },
    patient1: {
        name: "John Patient",
        email: `john.${runId}@example.com`,
        role: "patient",
    },
    patient2: {
        name: "Jane Patient",
        email: `jane.${runId}@example.com`,
        role: "patient",
    },
};

let doctorToken: string;
let caregiverToken: string;
let patientToken: string;

async function createUserAndLogin(user: {
    name: string;
    email: string;
    role: string;
}) {
    await request(app)
        .post("/auth/signup")
        .send({
            ...user,
            password,
        });

    const response = await request(app)
        .post("/auth/login")
        .send({
            email: user.email,
            password,
        });

    if (response.status !== 200) {
        throw new Error(`Could not login test user: ${user.email}`);
    }

    return response.body.token as string;
}

beforeAll(async () => {
    doctorToken = await createUserAndLogin(users.doctor);
    caregiverToken = await createUserAndLogin(users.caregiver);
    patientToken = await createUserAndLogin(users.patient1);

    await request(app)
        .post("/auth/signup")
        .send({
            ...users.patient2,
            password,
        });
});

describe("GET /patient-links/patients/search", () => {

    it("should allow a doctor to search patients by name", async () => {
        const response = await request(app)
            .get("/patient-links/patients/search")
            .query({ q: "John" })
            .set("Authorization", `Bearer ${doctorToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: users.patient1.name,
                    email: users.patient1.email,
                }),
            ])
        );
    });

    it("should allow a caregiver to search patients", async () => {
        const response = await request(app)
            .get("/patient-links/patients/search")
            .query({ q: "Jane" })
            .set("Authorization", `Bearer ${caregiverToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    it("should allow searching patients by email", async () => {
        const response = await request(app)
            .get("/patient-links/patients/search")
            .query({ q: users.patient1.email })
            .set("Authorization", `Bearer ${doctorToken}`);

        expect(response.status).toBe(200);

        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    email: users.patient1.email,
                }),
            ])
        );
    });

    it("should reject requests without authentication", async () => {
        const response = await request(app)
            .get("/patient-links/patients/search")
            .query({ q: "John" });

        expect(response.status).toBe(401);
    });

    it("should reject patient users trying to search", async () => {
        const response = await request(app)
            .get("/patient-links/patients/search")
            .query({ q: "John" })
            .set("Authorization", `Bearer ${patientToken}`);

        expect(response.status).toBe(403);
    });

    it("should reject search queries shorter than 2 characters", async () => {
        const response = await request(app)
            .get("/patient-links/patients/search")
            .query({ q: "J" })
            .set("Authorization", `Bearer ${doctorToken}`);

        expect(response.status).toBe(400);
    });

    it("should return an empty array when no patients match", async () => {
        const response = await request(app)
            .get("/patient-links/patients/search")
            .query({ q: "NoMatchingPatient" })
            .set("Authorization", `Bearer ${doctorToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });

    it("should not expose password hashes", async () => {
        const response = await request(app)
            .get("/patient-links/patients/search")
            .query({ q: "John" })
            .set("Authorization", `Bearer ${doctorToken}`);

        expect(response.status).toBe(200);

        response.body.data.forEach((patient: any) => {
            expect(patient).not.toHaveProperty("password_hash");
        });
    });

    it("should restrict the result limit to 20", async () => {
        const response = await request(app)
            .get("/patient-links/patients/search")
            .query({
                q: "Patient",
                limit: 100,
            })
            .set("Authorization", `Bearer ${doctorToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(20);
    });
});

afterAll(async () => {
    try {
        const emails = Object.values(users).map(user => user.email);

        await pool.query(
            "DELETE FROM users WHERE email = ANY($1::text[])",
            [emails]
        );
    } finally {
        // Do not close the shared pool here.
    }
});
