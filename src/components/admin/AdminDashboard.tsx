
"use client";
import React from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { Trash2, Crown, EyeOff, Radio } from 'lucide-react';
import { getFunctions, httpsCallable } from "firebase/functions";
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const db = getFirestore(app);
const functions = getFunctions(app);

const deletePostCallable = httpsCallable(functions, 'deletePost');

export default function AdminDashboard({ userProfile, onLogout }: { userProfile: any, onLogout: () => void }) {

    const handleDeletePost = async () => {
        const postId = prompt("Enter the ID of the post to delete:");
        if (postId) {
            try {
                await deletePostCallable({ postId });
                alert(`Post ${postId} has been successfully deleted.`);
            } catch(error: any) {
                 alert(`Failed to delete post: ${error.message}`);
            }
        }
    };

    const handleGrantPremium = async () => {
        const username = prompt("Enter the username of the user to grant premium to:");
        if (!username) return;

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const userQuerySnap = await getDocs(q);

        if (userQuerySnap.empty) {
            alert("User not found.");
            return;
        }
        
        const userToUpdateDoc = userQuerySnap.docs[0];
        const docRef = doc(db, "users", userToUpdateDoc.id);
        const data = { isPremium: true };

        updateDoc(docRef, data)
          .then(() => {
              alert(`Premium status granted to ${username}.`);
          })
          .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'update',
              requestResourceData: data,
            });
            errorEmitter.emit('permission-error', permissionError);
            alert('Permission denied. You might not have the rights to grant premium status.');
          });
    };

    const handleToggleMaintenance = async () => {
        const maintenanceDocRef = doc(db, 'app_status', 'maintenance');
        try {
            const docSnap = await getDoc(maintenanceDocRef);
            const currentStatus = docSnap.exists() ? docSnap.data()?.isEnabled : false;
            const newStatus = !currentStatus;
            await setDoc(maintenanceDocRef, { isEnabled: newStatus }, { merge: true });
            alert(`Maintenance mode is now ${newStatus ? 'ON' : 'OFF'}.`);
        } catch (error: any) {
            alert(`Failed to toggle maintenance mode: ${error.message}`);
        }
    };
    
    const handleGoLive = () => {
        alert("This would open a special live stream page for admins during maintenance mode.");
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center pt-12 p-4">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
                <div className="text-center">
                     <h1 className="text-3xl font-headline font-bold text-accent-cyan">Admin Dashboard</h1>
                     <p className="text-gray-400">Welcome, {userProfile.name}.</p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="glass-card p-6 flex flex-col items-center text-center">
                        <Trash2 className="text-red-400 mb-2" size={32}/>
                        <h3 className="font-bold text-lg text-red-400">Content Moderation</h3>
                        <p className="text-xs text-gray-400 mb-4">Permanently delete a post from the database.</p>
                        <button onClick={handleDeletePost} className="btn-glass bg-red-500/20 text-red-400 w-full">Delete Post</button>
                    </div>
                     <div className="glass-card p-6 flex flex-col items-center text-center">
                        <Crown className="text-yellow-400 mb-2" size={32}/>
                        <h3 className="font-bold text-lg text-yellow-400">Grant Premium</h3>
                        <p className="text-xs text-gray-400 mb-4">Give a user premium status for free.</p>
                        <button onClick={handleGrantPremium} className="btn-glass bg-yellow-500/20 text-yellow-400 w-full">Grant Premium</button>
                    </div>
                     <div className="glass-card p-6 flex flex-col items-center text-center">
                        <EyeOff className="text-accent-purple mb-2" size={32}/>
                        <h3 className="font-bold text-lg text-accent-purple">Maintenance Mode</h3>
                        <p className="text-xs text-gray-400 mb-4">Block user access and show a maintenance page.</p>
                        <button onClick={handleToggleMaintenance} className="btn-glass bg-purple-500/20 text-purple-400 w-full mb-2">Toggle Maintenance</button>
                        <button onClick={handleGoLive} className="btn-glass bg-green-500/20 text-green-400 w-full flex items-center justify-center gap-2"><Radio/>Go Live During Maint.</button>
                    </div>
                </div>
                 <button onClick={onLogout} className="btn-glass self-center mt-8">Log Out</button>
            </div>
        </div>
    )
}
