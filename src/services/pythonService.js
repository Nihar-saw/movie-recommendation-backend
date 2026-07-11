const axios = require("axios");
const logger = require("../utils/logger");

const PY_URL = process.env.PYTHON_SERVICE_URL;

const checkPythonService = async () => {
    try {
        const response = await axios.get(`${PY_URL}/`);
        return response.status === 200;
    } catch (err) {
        logger.error(`Python service unavailable: ${err.message}`);
        return false;
    }
};

const startPythonService = async () => {
    const running = await checkPythonService();

    if (running) {
        logger.info("🐍 Python ML Service is running.");
    } else {
        logger.warn("⚠ Python ML Service is unavailable.");
    }
};

const stopPythonService = () => {
    logger.info("Python service is managed independently.");
};

module.exports = {
    startPythonService,
    stopPythonService,
    checkPythonService
};