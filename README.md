# CareLink Backend

A modular backend for **CareLink**, a medication and health-adherence
platform intended to connect patients, caregivers, and doctors through
medication management, prescription workflows, adherence tracking, and
health-vitals monitoring.

> **Project status:** The backend foundation and authentication module
> are implemented. The database schema includes tables for additional
> CareLink domains, but those tables do not imply that their complete
> APIs or workflows are already implemented.

## Contents

-   [Overview](#overview)
-   [Technology Stack](#technology-stack)
-   [Architecture](#architecture)
-   [Project Structure](#project-structure)
-   [Implemented APIs](#implemented-apis)
-   [Authentication and
    Authorization](#authentication-and-authorization)
-   [Database](#database)
-   [Configuration](#configuration)
-   [Getting Started](#getting-started)
-   [Automated Testing](#automated-testing)
-   [Security](#security)
-   [Roadmap](#roadmap)

## Overview

CareLink is being developed to support medication and health-adherence
workflows.

  -----------------------------------------------------------------------
  Role                                Intended responsibility
  ----------------------------------- -----------------------------------
  `patient`                           Manage personal health information
                                      and medication activity

  `caregiver`                         Support linked patients, subject to
                                      permissions

  `doctor`                            Access clinical workflows and
                                      patient-related information,
                                      subject to permissions
  -----------------------------------------------------------------------

### Implemented foundation

-   Node.js and TypeScript backend.
-   Express application separated from server startup.
-   PostgreSQL connection pooling.
-   Separate development and test database configurations.
-   Zod validation for authentication requests.
-   bcrypt password hashing.
-   JWT authentication and role-based authorization.
-   Signup, login, and current-user APIs.
-   Jest and Supertest automated tests.

## Technology Stack

  -----------------------------------------------------------------------
  Technology                          Purpose
  ----------------------------------- -----------------------------------
  Node.js                             Backend runtime

  TypeScript                          Static typing

  Express 5                           HTTP server and routing

  PostgreSQL 16                       Relational database

  `pg`                                PostgreSQL connection pool and
                                      queries

  Docker Compose                      Local infrastructure

  Redis 7                             Provisioned for future caching or
                                      asynchronous-work needs; not yet
                                      integrated into current feature
                                      flows

  Zod                                 Request validation

  bcrypt                              Password hashing and verification

  jsonwebtoken                        JWT signing and verification

  dotenv                              Local environment configuration

  Jest                                Test runner and assertions

  ts-jest                             TypeScript support for Jest

  Supertest                           HTTP-level Express testing

  ts-node-dev                         Development server reload

  cross-env                           Cross-platform environment
                                      variables
  -----------------------------------------------------------------------

## Architecture

CareLink uses a layered request flow:

``` text
Client
  |
Express Route
  |
Middleware (authentication / authorization)
  |
Controller (HTTP request and response)
  |
Service (business rules)
  |
Repository (SQL and data access)
  |
PostgreSQL
```

  Layer           Responsibility
  --------------- ------------------------------------------------
  Routes          Define endpoints and middleware order
  Middleware      Authentication and authorization
  Controllers     Handle HTTP input/output and call services
  Services        Apply business rules and coordinate operations
  Repositories    Encapsulate SQL and database access
  Schemas         Validate request data using Zod
  Database pool   Manage PostgreSQL connections

This separation keeps HTTP handling, business logic, and persistence
concerns independent and makes the modules easier to test and extend.

## Project Structure

``` text
carelink-backend/
├── src/
│   ├── common/
│   │   └── middleware/
│   │       ├── verifyToken.ts
│   │       └── requireRole.ts
│   ├── db/
│   │   └── pool.ts
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.routes.ts
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       ├── auth.repository.ts
│   │       └── auth.schema.ts
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── auth_test/
│   │   ├── signup.test.ts
│   │   └── login.test.ts
│   ├── middleware_test/
│   │   └── middlewae.test.ts
│   ├── database.test.ts
│   └── health.test.ts
├── docker/
│   └── docker-compose.yml
├── .env.development
├── .env.test
├── jest.config.js
├── package.json
└── tsconfig.json
```

`src/app.ts` configures and exports the Express app. `src/server.ts`
starts the HTTP listener. This separation allows Supertest to exercise
the app without manually starting a server.

## Implemented APIs

  -----------------------------------------------------------------------
  Method            Endpoint          Access            Purpose
  ----------------- ----------------- ----------------- -----------------
  `POST`            `/auth/signup`    Public            Register a user

  `POST`            `/auth/login`     Public            Verify
                                                        credentials and
                                                        issue a JWT

  `GET`             `/auth/me`        Bearer JWT        Retrieve the
                                                        authenticated
                                                        user's profile

  `GET`             `/health`         Public            Basic application
                                                        health response
  -----------------------------------------------------------------------

### Register --- `POST /auth/signup`

Example request:

``` json
{
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "password": "change-this-password",
  "role": "patient"
}
```

Supported roles: `patient`, `caregiver`, and `doctor`.

The request is validated with Zod. Email addresses are trimmed and
normalized to lowercase. Passwords are hashed before storage. Successful
registration returns HTTP `201`.

### Login --- `POST /auth/login`

Example request:

``` json
{
  "email": "alex@example.com",
  "password": "change-this-password"
}
```

A successful login verifies the password using bcrypt and returns a
signed JWT and safe user information. The current implementation uses a
single JWT with a configured expiration. Invalid email/password
combinations return a generic authentication error.

### Current user --- `GET /auth/me`

Required header:

``` http
Authorization: Bearer <JWT>
```

The user identity comes from the verified JWT attached to `req.user`,
not from a user ID supplied by the client.

### Health --- `GET /health`

Example response:

``` json
{
  "status": "ok"
}
```

This is a basic application response check, not a comprehensive
readiness check for every dependency.

## Authentication and Authorization

Authentication answers **who is making the request?** Authorization
answers **whether that authenticated user is allowed to perform the
action**.

### JWT authentication: `verifyToken`

The middleware: 1. Reads the `Authorization` header. 2. Requires the
`Bearer <token>` format. 3. Verifies the JWT signature with the
configured secret. 4. Rejects expired tokens. 5. Checks that `userId` is
numeric and `role` is a string. 6. Attaches the verified identity to
`req.user`. 7. Calls `next()` only when the token is valid.

Example:

``` ts
router.get("/me", verifyToken, getMe);
```

### Role authorization: `requireRole`

The middleware checks whether the authenticated user's role is allowed.

``` ts
router.post(
    "/prescriptions",
    verifyToken,
    requireRole("doctor"),
    createPrescription
);
```

Multiple roles can be allowed:

``` ts
requireRole("doctor", "caregiver");
```

### HTTP status conventions

  Status   Meaning
  -------- ---------------------------------------------
  `200`    Request succeeded
  `201`    Resource created
  `400`    Invalid request or signup error
  `401`    Missing, invalid, or expired authentication
  `403`    Authenticated user lacks permission
  `404`    Resource not found, where applicable
  `500`    Unexpected server error

## Database

CareLink uses PostgreSQL through the `pg` connection pool.

The current schema includes:

  Table                   Domain
  ----------------------- ----------------------------------------------------
  `users`                 Accounts, roles, and authentication-related fields
  `patients`              Patient profiles
  `patient_links`         Patient-to-user relationships
  `prescriptions`         Prescription records and processing state
  `medications`           Medication information
  `dose_schedule`         Scheduled medication doses
  `adherence_snapshots`   Adherence records or summaries
  `vitals_readings`       Health measurements
  `alerts`                Alert records
  `notifications`         Notification records

The schema provides a foundation for these domains. Not every table
currently has a completed API or business workflow.

### Database environments

  Environment   Database
  ------------- -----------------
  Development   `carelink`
  Testing       `carelink_test`

The test database has the development schema copied without existing
application data. Automated tests use the test database rather than
development data.

## Configuration

Local environment files:

``` text
.env.development
.env.test
```

Example development configuration:

``` env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=replace-with-local-password
DB_NAME=carelink

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

PORT=3000
```

Example test configuration:

``` env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=replace-with-local-password
DB_NAME=carelink_test

JWT_SECRET=use-a-different-long-random-test-secret
JWT_EXPIRES_IN=7d
```

Use your own local credentials and secrets. Never commit real `.env`
files or secrets. The database pool validates required configuration and
checks the expected local database name for development and test
environments. Production secrets should be injected by the deployment
platform or a secrets manager.

## Getting Started

### Prerequisites

-   Node.js and npm
-   Docker and Docker Compose
-   Git
-   PostgreSQL 16 through the local Docker setup, or an equivalent
    PostgreSQL instance

### 1. Clone and install

``` bash
git clone <your-repository-url>
cd carelink-backend
npm install
```

### 2. Configure environments

Create `.env.development` and `.env.test` in the project root. Use the
examples above with your own credentials and distinct JWT secrets.

Ensure that the `carelink` and `carelink_test` databases exist and have
the expected schema.

### 3. Start local infrastructure

If the repository Docker Compose file defines the required services:

``` bash
docker compose -f docker/docker-compose.yml up -d
```

### 4. Start the development server

``` bash
npm run dev
```

The current development setup uses port `3000`.

### 5. Run tests

``` bash
npm test
```

## Automated Testing

CareLink uses Jest and Supertest.

-   **Jest** discovers and executes tests, provides assertions, and
    manages test lifecycle hooks.
-   **Supertest** sends HTTP requests directly to the Express
    application.
-   **PostgreSQL test database** isolates database tests from
    development data.

### Test organization

``` text
tests/
├── auth_test/
│   ├── signup.test.ts
│   └── login.test.ts
├── middleware_test/
│   └── middlewae.test.ts
├── database.test.ts
└── health.test.ts
```

### Current test cases

  ------------------------------------------------------------------------
  Test suite            Scenarios                                    Tests
  --------------------- --------------------- ----------------------------
  Health API            Successful response,                             4
                        response body, JSON   
                        content type, unknown 
                        endpoint              

  Database              Connects to                                      1
                        `carelink_test`       

  Signup API            Successful signup,                               8
                        email normalization,  
                        duplicate email,      
                        invalid email, short  
                        password, invalid     
                        role, missing name,   
                        password-hash         
                        protection            

  Login API             Valid login,                                     6
                        normalized email,     
                        incorrect password,   
                        unknown email,        
                        missing password,     
                        password-hash         
                        protection            

  `verifyToken`         Valid token, missing                             6
                        header, invalid       
                        header, malformed     
                        token, expired token, 
                        invalid payload       

  `requireRole`         Allowed role,                                    4
                        forbidden role,       
                        multiple allowed      
                        roles, missing        
                        authenticated user    

  **Total**             **5 test suites**                           **29**
  ------------------------------------------------------------------------

### Test commands

``` bash
npm test
npm run test:watch
npm test -- --coverage
```

### Latest verified result

``` text
Test Suites: 5 passed, 5 total
Tests:       29 passed, 29 total
Snapshots:   0 total
```

This is the latest recorded result. Run the tests again after code
changes to verify the current checkout.

Authentication integration tests create records in `carelink_test` and
remove their test records during cleanup. Middleware tests use a
temporary Express app and generated JWTs; they do not require database
records.

## Security

Security is treated as a design requirement. The table below
distinguishes implemented controls from further hardening that remains
necessary before production.

### Implemented controls

  -----------------------------------------------------------------------
  Control                             Current implementation
  ----------------------------------- -----------------------------------
  Password hashing                    Passwords are hashed with bcrypt
                                      before storage

  Password verification               Login uses `bcrypt.compare()`

  JWT verification                    Protected requests use
                                      `jwt.verify()`, not `jwt.decode()`

  Token expiration                    JWT verification rejects expired
                                      tokens

  Token payload validation            Numeric `userId` and string `role`
                                      are checked

  Role-based access                   `requireRole` checks allowed roles

  Request validation                  Zod validates signup and login
                                      payloads

  Safe responses                      Password hashes are excluded from
                                      user responses

  Generic login errors                Invalid email and password use the
                                      same authentication error

  Environment separation              Development and test use separate
                                      database configurations

  Database safeguards                 Local checks enforce expected
                                      development/test database names

  Secret separation                   Development and test JWT secrets
                                      are configured separately

  Test data isolation                 Automated tests use `carelink_test`
  -----------------------------------------------------------------------

### Security principles

-   Never store plaintext passwords.
-   Never return password hashes or authentication secrets in API
    responses.
-   Never commit `.env` files, database passwords, or JWT secrets.
-   JWTs are signed, not encrypted. Do not put passwords, medical
    records, or other sensitive information in their payloads.
-   Use verified token claims for the authenticated identity; do not
    trust client-supplied user IDs for authorization.
-   Apply authentication before role authorization on protected routes.
-   Validate untrusted request input at the API boundary.
-   Use parameterized SQL queries through `pg`; do not concatenate user
    input into SQL.
-   Keep test data isolated from development and production data.

### Production hardening still required

These are future tasks, not claims of completed functionality:

-   Short-lived access tokens and refresh-token rotation/revocation.
-   Login and signup rate limiting and abuse protection.
-   Email verification and account-recovery workflows.
-   Stronger password policy and credential-compromise protections.
-   Centralized error handling and structured, redacted logging.
-   HTTPS and secure deployment configuration.
-   Database least-privilege roles, backups, and migration management.
-   Audit logging for sensitive health-data access and changes.
-   Fine-grained resource-level authorization, beyond role checks.
-   Security testing and dependency vulnerability scanning.
-   Privacy, consent, and data-retention controls appropriate to health
    information.

Because CareLink handles a health-related domain, authorization must
eventually verify not only a user's role, but also whether that user is
linked to the specific patient or resource being accessed.

## Roadmap

Planned incremental work:

-   [x] Backend foundation and Express setup
-   [x] PostgreSQL connection pool and local environment separation
-   [x] Signup and login
-   [x] JWT verification middleware
-   [x] Role-based authorization middleware
-   [x] Current-user endpoint (`GET /auth/me`)
-   [x] Automated tests for current APIs and middleware
-   [ ] Patient profile APIs
-   [ ] Patient-caregiver and patient-doctor linking workflows
-   [ ] Prescription management and confirmation workflow
-   [ ] Medication management
-   [ ] Dose schedule generation
-   [ ] Medication adherence tracking
-   [ ] Vitals recording and retrieval
-   [ ] Alerts and notifications
-   [ ] Refresh-token lifecycle and session management
-   [ ] CI pipeline and automated coverage reporting
-   [ ] Production deployment and operational hardening

## Engineering Principles

1.  **Separation of concerns:** Routes, controllers, services,
    repositories, and middleware have distinct responsibilities.
2.  **Validation at boundaries:** Incoming data is validated before
    business logic uses it.
3.  **Secure defaults:** Passwords are hashed, tokens are verified, and
    protected routes enforce authorization.
4.  **Environment isolation:** Tests run against a dedicated database.
5.  **Testable design:** The Express app can be imported independently
    of server startup.
6.  **Incremental delivery:** Each domain module should include business
    rules, authorization, and automated tests.
7.  **Transparent status:** A database table or planned feature is not
    presented as a completed API.

## Contributing

When adding a feature:

1.  Put it in the appropriate module.
2.  Define request validation schemas.
3.  Keep HTTP handling in controllers.
4.  Keep business rules in services.
5.  Keep SQL access in repositories.
6.  Apply authentication and resource-level authorization where
    required.
7.  Add tests for successful requests, invalid input, permission
    failures, and relevant database behavior.
8.  Run the complete test suite before pushing.

``` bash
npm test
```

------------------------------------------------------------------------

**Project status:** CareLink is under active development. The current
milestone establishes the backend architecture, authentication
foundation, database environment separation, and automated testing
baseline. Domain modules will be added incrementally on top of this
foundation.
