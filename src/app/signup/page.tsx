"use client";
import React, { useState } from "react";
import Link from "next/link";
import { auth } from "@/utils/firebaseClient";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const db = getFirestore();

export default function SignupPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    username: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        avatar_url: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${form.username}`,
        created_at: new Date().toISOString(),
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
        className="glass-card p-8 w-full max-w-md flex flex-col gap-6"
      >
        <h2 className="text-3xl font-headline font-bold text-accent-cyan mb-2 text-center">Create Account</h2>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="input-glass w-full"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          className="input-glass w-full"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="input-glass w-full"
          value={form.email}
          onChange={handleChange}
          required
        />
        <div className="flex gap-2">
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input-glass w-full"
            value={form.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            className="input-glass w-full"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
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
