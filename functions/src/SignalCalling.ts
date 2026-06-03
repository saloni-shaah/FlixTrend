import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = "APIQFJUXixxstDN";
const LIVEKIT_API_SECRET = "Rpjd7l9ZeJohcf3nazRuwnDxVxMpTwgDt9WxgBhalLG";

/**
 * Generates a LiveKit Access Token for a user to join a specific call room.
 */
export const getLiveKitToken = onCall(async (request) => {
    // 1. Verify Authentication
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError("unauthenticated", "User must be authenticated to join a call.");
    }

    const { callId, participantName } = request.data;

    // 2. Validate Inputs
    if (!callId) {
        throw new HttpsError("invalid-argument", "callId is required.");
    }

    try {
        // 3. Verify Call Authorization in Firestore
        // Ensure the user is either the caller or receiver of this call
        const callDoc = await admin.firestore().collection("calls").doc(callId).get();

        if (!callDoc.exists) {
            throw new HttpsError("not-found", "Call session not found.");
        }

        const callData = callDoc.data();
        if (callData?.callerId !== uid && callData?.receiverId !== uid) {
            throw new HttpsError("permission-denied", "You are not a participant in this call.");
        }

        // 4. Create Access Token
        // Token duration: 1 hour (plenty for a single call session)
        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: uid,
            name: participantName || uid,
        });

        // 5. Set Permissions
        at.addGrant({
            roomJoin: true,
            room: callId, // The room name is the Call ID for 1-to-1 isolation
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        // 6. Return Token
        return {
            token: await at.toJwt(),
        };

    } catch (error) {
        logger.error("Error generating LiveKit token:", error);
        throw new HttpsError("internal", "Failed to generate call token.");
    }
});
