"use client";
import React, { useState } from "react";
import Link from "next/link";
import { auth } from "@/utils/firebaseClient";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const db = getFirestore();

export default function SignupPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    showPassword: false,
    name: "",
    username: "",
    phone: "",
    age: "",
    bio: "",
    interests: "",
    avatar: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTogglePassword = () => {
    setForm((prev) => ({ ...prev, showPassword: !prev.showPassword }));
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
        photoURL: form.avatar || undefined,
      });
      // Store user profile in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: form.email,
        name: form.name,
        username: form.username,
        phone: form.phone,
        age: form.age,
        bio: form.bio,
        interests: form.interests,
        avatar_url: form.avatar,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent-cyan text-white font-body transition-colors duration-500">
      <form
        onSubmit={handleSubmit}
        className="bg-card/80 rounded-2xl shadow-fab-glow p-8 w-full max-w-md flex flex-col gap-6 animate-fade-in"
      >
        <h2 className="text-3xl font-headline font-bold text-accent-cyan mb-2 text-center drop-shadow">Create Account</h2>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="px-4 py-3 rounded-full bg-black/40 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          className="px-4 py-3 rounded-full bg-black/40 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="px-4 py-3 rounded-full bg-black/40 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
          value={form.email}
          onChange={handleChange}
          required
        />
        <div className="flex gap-2">
          <input
            type={form.showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            className="flex-1 px-4 py-3 rounded-full bg-black/40 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
            value={form.password}
            onChange={handleChange}
            required
          />
          <input
            type={form.showPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            className="flex-1 px-4 py-3 rounded-full bg-black/40 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button type="button" onClick={handleTogglePassword} className="text-xs text-accent-cyan self-end mb-2">
          {form.showPassword ? "Hide Passwords" : "Show Passwords"}
        </button>
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          className="px-4 py-3 rounded-full bg-black/40 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          className="px-4 py-3 rounded-full bg-black/40 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
          value={form.age}
          onChange={handleChange}
        />
        <textarea
          name="bio"
          placeholder="Bio"
          className="px-4 py-3 rounded-2xl bg-black/40 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink resize-none"
          value={form.bio}
          onChange={handleChange}
        />
        <input
          type="text"
          name="interests"
          placeholder="Your Interests (comma separated)"
          className="px-4 py-3 rounded-full bg-black/40 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
          value={form.interests}
          onChange={handleChange}
        />
        <input
          type="text"
          name="avatar"
          placeholder="Avatar URL (optional)"
          className="px-4 py-3 rounded-full bg-black/40 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink"
          value={form.avatar}
          onChange={handleChange}
        />
        {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
        {success && <div className="text-accent-cyan text-center animate-glow mt-2">{success}</div>}
        <button
          type="submit"
          className="mt-4 px-8 py-3 rounded-full bg-accent-pink text-white font-bold text-lg shadow-fab-glow hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        <div className="text-center mt-2">
          <span className="text-gray-400">Already have an account? </span>
          <Link href="/login" className="text-accent-cyan hover:underline">Login</Link>
        </div>
      </form>
    </div>
  );
} 