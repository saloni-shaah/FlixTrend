
'use server';
import { getFirestore, doc, runTransaction, DocumentReference } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';

const db = getFirestore(app);

// Define weight for different interactions
const INTERACTION_WEIGHTS = {
    like: 1,
    save: 3, 
    relay: 2,
    comment: 2,
    profile_visit: 1,
    show_more: 5, // Strong positive signal
    show_less: -5, // Strong negative signal
};

/**
 * Tracks user interactions with content to build an interest profile.
 * This is the core of the VibeEngine's personalization capabilities.
 *
 * @param userId The ID of the user performing the action.
 * @param category The category of the content being interacted with.
 * @param interactionType The type of interaction (e.g., 'like', 'save').
 */
export async function trackInteraction(
    userId: string,
    category: string | null,
    interactionType: keyof typeof INTERACTION_WEIGHTS
) {
    if (!userId || !category) {
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
                currentInterests = interestsDoc.data().scores || {};
            }

            // Update score for the category
            const cleanCategory = category.toLowerCase().trim();
            currentInterests[cleanCategory] = (currentInterests[cleanCategory] || 0) + weight;
            
            transaction.set(userInterestsRef, { scores: currentInterests }, { merge: true });
        });
    } catch (error) {
        console.error("Error tracking interaction:", error);
    }
}
