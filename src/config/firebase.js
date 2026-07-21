const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const fs = require("fs");

let serviceAccount;

// Try loading service account JSON from a local file first
try {
  serviceAccount = require("./firebaseServiceAccount.json");
} catch (err) {
  try {
    serviceAccount = require("../../config/firebaseServiceAccount.json");
  } catch (err2) {
    // If local file is not present, try environment variables.
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // FIREBASE_SERVICE_ACCOUNT should contain the JSON text of the service account
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.error("Invalid JSON in FIREBASE_SERVICE_ACCOUNT environment variable:", e.message);
        throw e;
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // GOOGLE_APPLICATION_CREDENTIALS can point to a service account JSON file path
      try {
        const p = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        serviceAccount = JSON.parse(fs.readFileSync(p, "utf8"));
      } catch (e) {
        console.error("Failed to read GOOGLE_APPLICATION_CREDENTIALS file:", e.message);
        throw e;
      }
    } else {
      // No credentials available — provide a helpful error
      throw new Error(
        "Firebase service account not found. Provide one of the following:\n" +
        "- Place firebaseServiceAccount.json at backend/src/config/firebaseServiceAccount.json (NOT recommended for committed repos)\n" +
        "- Set FIREBASE_SERVICE_ACCOUNT to the service account JSON (recommended for CI)\n" +
        "- Set GOOGLE_APPLICATION_CREDENTIALS to the path of the service account JSON file\n"
      );
    }
  }
}

const app = initializeApp({
  credential: cert(serviceAccount)
});

module.exports = {
  auth: () => getAuth(app)
};