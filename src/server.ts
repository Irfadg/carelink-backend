
import app from "./app";

// Start the HTTP server.
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`CareLink server running on port ${PORT}`);
});
