
"use client";

import React, { useEffect, useState } from "react";
import { getFirestore, doc, onSnapshot, deleteDoc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";

const db = getFirestore(app);

export function FollowButton({ profileUser, currentUser }: { profileUser: any; currentUser: any; }) {
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!currentUser || !profileUser) return;
    const unsub = onSnapshot(doc(db, "users", profileUser.uid, "followers", currentUser.uid), (doc) => {
      setIsFollowing(doc.exists());
    });
    return () => unsub();
  }, [profileUser?.uid, currentUser?.uid]);

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;
    const followersCol = collection(db, "users", profileUser.uid, "followers");
    const followingCol = collection(db, "users", currentUser.uid, "following");
    const followDocRef = doc(followersCol, currentUser.uid);
    const followingDocRef = doc(followingCol, profileUser.uid);
    
    if (isFollowing) {
      await deleteDoc(followDocRef);
      await deleteDoc(followingDocRef);
    } else {
      await setDoc(followDocRef, { followedAt: serverTimestamp(), userId: currentUser.uid });
      await setDoc(followingDocRef, { followedAt: serverTimestamp(), userId: profileUser.uid });
      
      // Create a notification for the user being followed
      const notifRef = collection(db, "users", profileUser.uid, "notifications");
      await addDoc(notifRef, {
        type: 'follow',
        fromUserId: currentUser.uid,
        fromUsername: currentUser.displayName,
        fromAvatarUrl: currentUser.photoURL,
        createdAt: serverTimestamp(),
        read: false,
      });
    }
  };
  
  if (!currentUser || !profileUser || currentUser.uid === profileUser.uid) {
    return null;
  }
  
  return (
    <button className={`btn-glass text-sm px-4 py-2 ${isFollowing ? "bg-accent-cyan/80 text-black" : "bg-accent-pink/80 text-white"}`} onClick={e => { e.preventDefault(); handleFollow(); }}>
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
