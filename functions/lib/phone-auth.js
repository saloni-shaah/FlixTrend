"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUserExists = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
exports.checkUserExists = (0, https_1.onCall)(async (request) => {
    const { phoneNumber } = request.data;
    if (!phoneNumber) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with the "phoneNumber" argument.');
    }
    try {
        const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
        return { exists: !!userRecord };
    }
    catch (error) {
        if (error.code === 'auth/user-not-found') {
            return { exists: false };
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=phone-auth.js.map