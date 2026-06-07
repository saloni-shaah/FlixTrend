"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLiveKitToken = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const livekit_server_sdk_1 = require("livekit-server-sdk");
const LIVEKIT_API_KEY = "APIQFJUXixxstDN";
const LIVEKIT_API_SECRET = "Rpjd7l9ZeJohcf3nazRuwnDxVxMpTwgDt9WxgBhalLG";
/**
 * Generates a LiveKit Access Token for a user to join a specific call room.
 */
exports.getLiveKitToken = (0, https_1.onCall)(async (request) => {
    var _a;
    // 1. Verify Authentication
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated to join a call.");
    }
    const { callId, participantName } = request.data;
    // 2. Validate Inputs
    if (!callId) {
        throw new https_1.HttpsError("invalid-argument", "callId is required.");
    }
    try {
        // 3. Verify Call Authorization in Firestore
        // Ensure the user is either the caller or receiver of this call
        const callDoc = await admin.firestore().collection("calls").doc(callId).get();
        if (!callDoc.exists) {
            throw new https_1.HttpsError("not-found", "Call session not found.");
        }
        const callData = callDoc.data();
        if ((callData === null || callData === void 0 ? void 0 : callData.callerId) !== uid && (callData === null || callData === void 0 ? void 0 : callData.receiverId) !== uid) {
            throw new https_1.HttpsError("permission-denied", "You are not a participant in this call.");
        }
        // 4. Create Access Token
        // Token duration: 1 hour (plenty for a single call session)
        const at = new livekit_server_sdk_1.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: uid,
            name: participantName || uid,
        });
        // 5. Set Permissions
        at.addGrant({
            roomJoin: true,
            room: callId,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });
        // 6. Return Token
        return {
            token: await at.toJwt(),
        };
    }
    catch (error) {
        firebase_functions_1.logger.error("Error generating LiveKit token:", error);
        throw new https_1.HttpsError("internal", "Failed to generate call token.");
    }
});
//# sourceMappingURL=SignalCalling.js.map