
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { auth, app } from "@/utils/firebaseClient";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const db = getFirestore(app);

export default function SignupPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    username: "",
    dob: "",
    gender: "",
    location: "",
    accountType: "user",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(userCredential.user, {
        displayName: form.name,
      });
      // Store user profile in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: form.email,
        name: form.name,
        username: form.username,
        dob: form.dob,
        gender: form.gender,
        location: form.location,
        accountType: form.accountType,
        avatar_url: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${form.username}`,
        created_at: new Date().toISOString(),
        profileComplete: true, // Mark as complete since they filled new fields
      });
      setSuccess("Signup successful! Redirecting to home...");
      router.push("/home");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.form
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit}
        className="glass-card p-8 w-full max-w-lg flex flex-col gap-4"
      >
        <h2 className="text-3xl font-headline font-bold text-accent-cyan mb-2 text-center">Create Your Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text" name="name" placeholder="Full Name"
              className="input-glass w-full" value={form.name} onChange={handleChange} required
            />
            <input
              type="text" name="username" placeholder="Username"
              className="input-glass w-full" value={form.username} onChange={handleChange} required
            />
            <input
              type="email" name="email" placeholder="Email"
              className="input-glass w-full md:col-span-2" value={form.email} onChange={handleChange} required
            />
            <input
              type="password" name="password" placeholder="Password"
              className="input-glass w-full" value={form.password} onChange={handleChange} required
            />
            <input
              type="password" name="confirmPassword" placeholder="Confirm Password"
              className="input-glass w-full" value={form.confirmPassword} onChange={handleChange} required
            />
             <input
              type="text" name="location" placeholder="Location (e.g., City, Country)"
              className="input-glass w-full" value={form.location} onChange={handleChange}
            />
            <input
              type="date" name="dob" placeholder="Date of Birth"
              className="input-glass w-full" value={form.dob} onChange={handleChange}
            />
             <select name="gender" className="input-glass w-full" value={form.gender} onChange={handleChange}>
                <option value="" disabled>Select Gender...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
             <select name="accountType" className="input-glass w-full" value={form.accountType} onChange={handleChange}>
                <option value="user">I'm a User</option>
                <option value="creator">I'm a Creator</option>
            </select>
        </div>
        
        {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
        {success && <div className="text-accent-cyan text-center mt-2">{success}</div>}
        <button
          type="submit"
          className="btn-glass mt-4 bg-accent-pink/80"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        <div className="text-center mt-2">
          <span className="text-gray-400">Already have an account? </span>
          <Link href="/login" className="text-accent-cyan hover:underline">Login</Link>
        </div>
      </motion.form>
    </div>
  );
}
