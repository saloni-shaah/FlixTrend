
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import { redirect } from 'next/navigation';
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";

const db = getFirestore(app);

// This is an RSC (React Server Component)
export default async function FlowRedirectPage() {
    let redirectUrl = '';
    let hasError = false;

    try {
        const q = query(
            collection(db, "posts"),
            where("isFlow", "==", true),
            where("isVideo", "==", true),
            orderBy("publishAt", "desc"),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const latestVideoId = snapshot.docs[0].id;
            redirectUrl = `/flow/${latestVideoId}`;
        }
    } catch (error) {
        console.error("Error fetching latest flow video:", error);
        hasError = true;
    }

    // Perform the redirect outside of the try...catch block
    if (redirectUrl) {
        redirect(redirectUrl);
    }

    if (hasError) {
        return (
            <div className="flex flex-col h-screen w-screen bg-black items-center justify-center text-center p-4">
                <h1 className="text-3xl font-headline font-bold text-red-500">Error</h1>
                <p className="text-gray-400 mt-2">Could not load the Flow. Please try again later.</p>
            </div>
        );
    }

    // No videos found, show an empty state.
    return (
        <div className="flex flex-col h-screen w-screen bg-black items-center justify-center text-center p-4">
            <h1 className="text-3xl font-headline font-bold text-accent-cyan">The Flow is Empty</h1>
            <p className="text-gray-400 mt-2">No videos have been posted yet. Create one!</p>
        </div>
    );
}
