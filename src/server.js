require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const pythonService = require("./services/pythonService");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Start Python ML service in background
    await pythonService.startPythonService();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Handle graceful shutdown to stop Python child process
    const shutdown = () => {
      console.log("Shutting down servers...");
      pythonService.stopPythonService();
      server.close(() => {
        console.log("Node server stopped.");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (err) {

    console.error(err);

    process.exit(1);

  }
};

startServer();