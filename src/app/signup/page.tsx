"use client";
import React, { useState } from "react";
import Link from "next/link";
import { auth } from "@/utils/firebaseClient";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import SignupForm from "@/components/SignupForm";

const db = getFirestore();

export default function SignupPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (formData: any) => {
    setError("");
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(userCredential.user, {
        displayName: formData.name,
        photoURL: formData.avatar_url || undefined,
      });

      // Store user profile in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: formData.email,
        name: formData.name,
        username: formData.username,
        phone: formData.phone,
        age: formData.age,
        bio: formData.bio,
        interests: formData.interests,
        avatar_url: formData.avatar_url,
        createdAt: new Date().toISOString(),
      });

      router.push("/home");
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already in use. Please log in or use a different email.");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-body p-4">
      <div className="bg-card/80 rounded-2xl shadow-lg border border-accent-cyan/20 p-8 w-full max-w-md flex flex-col gap-6 animate-fade-in">
        <div className="text-center">
            <h2 className="text-3xl font-headline font-bold text-accent-cyan mb-2 drop-shadow">Create Your Account</h2>
            <p className="text-foreground/80">Join the next wave of social media.</p>
        </div>
        
        <SignupForm onSignup={handleSignup} loading={loading} />

        {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
        
        <div className="text-center mt-4">
          <span className="text-foreground/70">Already have an account? </span>
          <Link href="/login" className="text-accent-cyan hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
}
