const { spawn } = require("child_process");
const path = require("path");
const axios = require("axios");
const logger = require("../utils/logger");

const PY_URL = "http://127.0.0.1:8000";
let pyProcess = null;

const checkPythonService = async () => {
    try {
        await axios.get(PY_URL);
        return true;
    } catch (err) {
        return false;
    }
};

const startPythonService = async () => {
    const isRunning = await checkPythonService();
    if (isRunning) {
        logger.info("🐍 Python ML Service is already running.");
        return;
    }

    logger.info("🐍 Starting Python ML Service...");
    
    const mlDir = path.join(__dirname, "../../ml");
    
    // Detect python executable in venv based on OS
    const isWindows = process.platform === "win32";
    const pythonExec = isWindows 
        ? path.join(mlDir, "venv", "Scripts", "python.exe")
        : path.join(mlDir, "venv", "bin", "python");

    // Start uvicorn server
    pyProcess = spawn(pythonExec, ["-m", "uvicorn", "api:app", "--port", "8000"], {
        cwd: mlDir,
        stdio: "inherit"
    });

    pyProcess.on("error", (err) => {
        logger.error(`❌ Failed to start Python service: ${err.message}`);
    });

    pyProcess.on("close", (code) => {
        logger.info(`🐍 Python service exited with code ${code}`);
        pyProcess = null;
    });

    // Wait a couple of seconds for Python server to bind
    await new Promise(resolve => setTimeout(resolve, 3000));
};

const stopPythonService = () => {
    if (pyProcess) {
        logger.info("🐍 Stopping Python ML Service...");
        pyProcess.kill();
        pyProcess = null;
    }
};

module.exports = {
    startPythonService,
    stopPythonService,
    checkPythonService
};
