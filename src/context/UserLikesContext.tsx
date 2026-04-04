"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onSnapshot, doc, getFirestore } from 'firebase/firestore';
import { useAppState } from '@/utils/AppStateContext';
import { app } from '@/utils/firebaseClient';

const db = getFirestore(app);

interface UserLikesContextType {
    likedPosts: string[]; // This will hold the post IDs for the CURRENT YEAR
    loading: boolean;
}

const UserLikesContext = createContext<UserLikesContextType>({ 
    likedPosts: [],
    loading: true 
});

export const UserLikesProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const { currentUserProfile } = useAppState();
    const [likedPosts, setLikedPosts] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUserProfile) {
            setLikedPosts([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const currentYear = new Date().getFullYear().toString();
        // Listen to the document for the current year's likes in the 'likedPosts' subcollection
        const yearlyLikesDocRef = doc(db, 'users', currentUserProfile.uid, 'likedPosts', currentYear);

        const unsubscribe = onSnapshot(yearlyLikesDocRef, (doc) => {
            if (doc.exists()) {
                setLikedPosts(doc.data().postIds || []);
            } else {
                setLikedPosts([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching current year's likes:", error);
            setLikedPosts([]);
            setLoading(false);
        });

        return () => unsubscribe();

    }, [currentUserProfile]);

    return (
        <UserLikesContext.Provider value={{ likedPosts, loading }}>
            {children}
        </UserLikesContext.Provider>
    );
};

export const useUserLikes = () => useContext(UserLikesContext);
