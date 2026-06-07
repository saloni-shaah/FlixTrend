import * as v1 from "firebase-functions/v1";

export const onUserUpdate = v1
  .region('asia-south1')
  .firestore
  .document("users/{userId}")
  .onUpdate(async (_change, context) => {
    v1.logger.debug(
      `Skipping realtime accolade recalculation for ${context.params.userId}; handled by scheduled reconciliation.`
    );
    return null;
  });