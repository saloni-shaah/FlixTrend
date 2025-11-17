"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateStorageUrls = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Define the old and new project IDs
const OLD_PROJECT_ID = "direct-hope-473110-r0";
const NEW_PROJECT_ID = "flixtrend-24072025";
// CORRECTED URL formats to use .firebasestorage.app
const OLD_URL_BASE = `https://firebasestorage.googleapis.com/v0/b/${OLD_PROJECT_ID}.firebasestorage.app/o/`;
const NEW_URL_BASE = `https://firebasestorage.googleapis.com/v0/b/${NEW_PROJECT_ID}.firebasestorage.app/o/`;
// Initialize the Admin SDK if it's not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * A helper function to recursively scan and update URLs in a Firestore document or any nested objects.
 * @param {object} data The document data or object to scan.
 * @returns {object} The data with updated URLs.
 */
const updateUrlsInData = (data) => {
    let changesMade = false;
    const updatedData = Object.assign({}, data);
    for (const key in updatedData) {
        if (Object.prototype.hasOwnProperty.call(updatedData, key)) {
            const value = updatedData[key];
            if (typeof value === "string" && value.startsWith(OLD_URL_BASE)) {
                updatedData[key] = value.replace(OLD_URL_BASE, NEW_URL_BASE);
                changesMade = true;
                functions.logger.log(`Updated URL for key: ${key}`);
            }
            else if (typeof value === "object" && value !== null) {
                // Recursively check nested objects and arrays
                const result = updateUrlsInData(value);
                if (result.changesMade) {
                    updatedData[key] = result.updatedData;
                    changesMade = true;
                }
            }
        }
    }
    return { updatedData, changesMade };
};
/**
 * An HTTP-triggered function to migrate Firestore data.
 */
exports.migrateStorageUrls = functions.https.onRequest(async (req, res) => {
    functions.logger.log("Starting storage URL migration (v2)...");
    const collectionsToUpdate = ["users", "posts", "flashes", "products"]; // Add any other relevant collections
    let documentsUpdated = 0;
    try {
        for (const collectionName of collectionsToUpdate) {
            const snapshot = await db.collection(collectionName).get();
            if (snapshot.empty) {
                functions.logger.log(`Collection "${collectionName}" is empty. Skipping.`);
                continue;
            }
            const batch = db.batch();
            for (const doc of snapshot.docs) {
                const data = doc.data();
                const { updatedData, changesMade } = updateUrlsInData(data);
                if (changesMade) {
                    const docRef = db.collection(collectionName).doc(doc.id);
                    batch.update(docRef, updatedData);
                    documentsUpdated++;
                    functions.logger.log(`Staged update for ${collectionName}/${doc.id}`);
                }
            }
            await batch.commit();
            functions.logger.log(`Committed batch for collection: ${collectionName}. Total documents updated so far: ${documentsUpdated}`);
        }
        res.status(200).send(`Migration complete. Total documents updated: ${documentsUpdated}.`);
        functions.logger.log("Migration finished successfully.");
    }
    catch (error) {
        functions.logger.error("Error during migration:", error);
        res.status(500).send("An error occurred during migration. Check logs for details.");
    }
});
//# sourceMappingURL=migration.js.map