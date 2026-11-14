/** @type {import('jest').Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",

    // Jest will discover files ending with .test.ts
    testMatch: ["**/tests/**/*.test.ts"],

    // Show detailed test results.
    verbose: true
};