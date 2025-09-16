
'use server';
import { getFirestore, doc, runTransaction, DocumentReference } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';

const db = getFirestore(app);

// Define weight for different interactions
const INTERACTION_WEIGHTS = {
    like: 1,
    save: 3, // Saving is a stronger signal of interest
    relay: 2,
    comment: 2,
    profile_visit: 1,
};

/**
 * Tracks user interactions with content to build an interest profile.
 * This is the core of the VibeEngine's personalization capabilities.
 *
 * @param userId The ID of the user performing the action.
 * @param hashtags An array of hashtags associated with the content.
 * @param interactionType The type of interaction (e.g., 'like', 'save').
 */
export async function trackInteraction(
    userId: string,
    hashtags: string[] | null,
    interactionType: keyof typeof INTERACTION_WEIGHTS
) {
    if (!userId || !hashtags || hashtags.length === 0) {
        return;
    }

    const weight = INTERACTION_WEIGHTS[interactionType];
    if (!weight) {
        console.warn(`Unknown interaction type: ${interactionType}`);
        return;
    }
    
    // The user's interest profile is stored in a subcollection for better scalability.
    const userInterestsRef = doc(db, 'user_profiles', userId, 'engine', 'vibe');

    try {
        await runTransaction(db, async (transaction) => {
            const interestsDoc = await transaction.get(userInterestsRef);
            
            let currentInterests: { [tag: string]: number } = {};
            if (interestsDoc.exists()) {
                currentInterests = interestsDoc.data().tags || {};
            }

            // Update scores for each hashtag
            hashtags.forEach(tag => {
                const cleanTag = tag.toLowerCase().trim();
                currentInterests[cleanTag] = (currentInterests[cleanTag] || 0) + weight;
            });
            
            // For simplicity, we're not pruning old interests here, but in a production
            // system, we might decay scores over time or keep only the top N interests.

            transaction.set(userInterestsRef, { tags: currentInterests }, { merge: true });
        });
    } catch (error) {
        console.error("Error tracking interaction:", error);
    }
}
