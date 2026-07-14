const { spawn } = require("child_process");
const axios = require("axios");
const path = require("path");
const logger = require("../utils/logger");

const PY_URL = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";
const ML_DIR = path.resolve(__dirname, "../../../ml");

let pythonProcess = null;

const checkPythonService = async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(`${PY_URL}/`, { timeout: 3000 });
            if (response.status === 200) return true;
        } catch {
            if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
        }
    }
    return false;
};

const waitForReady = async (maxWaitMs = 60000) => {
    const interval = 1500;
    const attempts = Math.ceil(maxWaitMs / interval);
    for (let i = 0; i < attempts; i++) {
        await new Promise(r => setTimeout(r, interval));
        const ready = await checkPythonService(1, 0);
        if (ready) return true;
        logger.info(`⏳ Waiting for Python ML service... (${i + 1}/${attempts})`);
    }
    return false;
};

const startPythonService = async () => {
    // Check if already running externally
    const alreadyRunning = await checkPythonService(1, 0);
    if (alreadyRunning) {
        logger.info("🐍 Python ML Service already running.");
        return;
    }

    logger.info("🐍 Starting Python ML service...");

    // Try to spawn using Python in the venv first, fallback to system python
    const venvPython = path.join(ML_DIR, "venv", "Scripts", "python.exe"); // Windows
    const venvPythonUnix = path.join(ML_DIR, "venv", "bin", "python");

    let pythonCmd = "python";
    const fs = require("fs");
    if (fs.existsSync(venvPython)) {
        pythonCmd = venvPython;
    } else if (fs.existsSync(venvPythonUnix)) {
        pythonCmd = venvPythonUnix;
    }

    const args = ["-m", "uvicorn", "api:app", "--host", "127.0.0.1", "--port", "8000", "--log-level", "warning"];

    try {
        pythonProcess = spawn(pythonCmd, args, {
            cwd: ML_DIR,
            stdio: ["ignore", "pipe", "pipe"],
            env: {
                ...process.env,
                GROQ_API_KEY: process.env.GROQ_API_KEY || "",
            },
        });

        pythonProcess.stdout.on("data", (data) => {
            const msg = data.toString().trim();
            if (msg) logger.info(`[Python ML] ${msg}`);
        });

        pythonProcess.stderr.on("data", (data) => {
            const msg = data.toString().trim();
            // uvicorn logs startup to stderr - only log real errors
            if (msg && !msg.includes("INFO") && !msg.includes("Uvicorn running")) {
                logger.warn(`[Python ML] ${msg}`);
            } else if (msg.includes("Uvicorn running")) {
                logger.info(`🐍 Python ML Service is running.`);
            }
        });

        pythonProcess.on("exit", (code) => {
            if (code !== 0 && code !== null) {
                logger.error(`Python ML service exited with code ${code}`);
            }
            pythonProcess = null;
        });

        pythonProcess.on("error", (err) => {
            logger.error(`Failed to start Python ML service: ${err.message}`);
            logger.warn("Ensure Python is installed and the venv is set up in backend/ml/");
            pythonProcess = null;
        });

        // Wait up to 60 seconds for the service to be ready
        const ready = await waitForReady(60000);
        if (ready) {
            logger.info("🐍 Python ML Service is ready.");
        } else {
            logger.warn("⚠ Python ML Service did not respond in time. Recommendations may be unavailable.");
        }

    } catch (err) {
        logger.error(`Could not spawn Python ML service: ${err.message}`);
        logger.warn("Run 'cd backend/ml && python -m uvicorn api:app --port 8000' manually.");
    }
};

const stopPythonService = () => {
    if (pythonProcess) {
        logger.info("Stopping Python ML service...");
        pythonProcess.kill("SIGTERM");
        pythonProcess = null;
    }
};

module.exports = {
    startPythonService,
    stopPythonService,
    checkPythonService,
};