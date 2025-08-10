"use client";
import React, { useState } from "react";
import { User, KeyRound, UserSquare2, Sparkles, Check, ArrowRight, ArrowLeft } from "lucide-react";

const steps = [
  { id: 1, title: "Credentials", icon: <KeyRound /> },
  { id: 2, title: "Profile", icon: <UserSquare2 /> },
  { id: 3, title: "Interests", icon: <Sparkles /> },
  { id: 4, title: "Avatar", icon: <User /> },
];

const avatars = [
  "https://placehold.co/100x100.png?text=👽",
  "https://placehold.co/100x100.png?text=🤖",
  "https://placehold.co/100x100.png?text=👾",
  "https://placehold.co/100x100.png?text=🚀",
  "https://placehold.co/100x100.png?text=🌟",
  "https://placehold.co/100x100.png?text=🦄",
];

export default function SignupForm({ onSignup, loading }: { onSignup: (data: any) => void; loading: boolean }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    username: "",
    phone: "",
    age: "",
    bio: "",
    interests: "",
    avatar_url: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    // Validation before proceeding
    if (step === 1) {
      if (!formData.email || !formData.password) {
        setError("Email and password are required.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }
    if (step === 2) {
      if (!formData.name || !formData.username) {
        setError("Name and username are required.");
        return;
      }
    }
    setError("");
    setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.avatar_url) {
        setError("Please select an avatar to complete signup.");
        return;
    }
    setError("");
    onSignup(formData);
  };

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, index) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step > s.id ? "bg-accent-green border-accent-green text-background" : step === s.id ? "bg-accent-cyan border-accent-cyan text-background" : "bg-card border-gray-600 text-gray-400"}`}>
                {step > s.id ? <Check /> : s.icon}
              </div>
              <p className={`text-xs mt-2 transition-all duration-300 ${step >= s.id ? "text-accent-cyan" : "text-gray-500"}`}>{s.title}</p>
            </div>
            {index < steps.length - 1 && <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${step > s.id ? "bg-accent-green" : "bg-gray-600"}`}></div>}
          </React.Fragment>
        ))}
      </div>

      {error && <p className="text-red-400 text-center mb-4">{error}</p>}

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="input-style" />
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="input-style" />
            <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required className="input-style" />
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required className="input-style" />
            <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required className="input-style" />
            <input type="tel" name="phone" placeholder="Phone Number (Optional)" value={formData.phone} onChange={handleChange} className="input-style" />
            <input type="number" name="age" placeholder="Age (Optional)" value={formData.age} onChange={handleChange} className="input-style" />
          </div>
        )}
        {step === 3 && (
            <div className="flex flex-col gap-4 animate-fade-in">
                <textarea name="bio" placeholder="Your Bio (Optional)" value={formData.bio} onChange={handleChange} className="input-style min-h-[80px]"/>
                <input type="text" name="interests" placeholder="Interests (e.g., Gaming, Music, Tech)" value={formData.interests} onChange={handleChange} className="input-style" />
            </div>
        )}
        {step === 4 && (
            <div className="animate-fade-in text-center">
                <h3 className="text-lg font-semibold mb-4 text-accent-cyan">Choose Your Avatar</h3>
                <div className="grid grid-cols-3 gap-4">
                    {avatars.map(url => (
                        <button type="button" key={url} onClick={() => setFormData(f => ({...f, avatar_url: url}))} className={`rounded-full p-1 border-4 transition-all ${formData.avatar_url === url ? 'border-accent-pink' : 'border-transparent'}`}>
                            <img src={url} alt="avatar" className="w-20 h-20 rounded-full" />
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="flex justify-between mt-8">
            {step > 1 && <button type="button" onClick={prevStep} className="btn-secondary"><ArrowLeft className="mr-2"/> Back</button>}
            {step < 4 && <button type="button" onClick={nextStep} className="btn-primary ml-auto">Next <ArrowRight className="ml-2"/></button>}
            {step === 4 && <button type="submit" disabled={loading} className="btn-primary ml-auto">{loading ? "Signing up..." : "Finish Signup"}</button>}
        </div>
      </form>
    </div>
  );
}

// Add some shared styles to avoid repetition
const styles = `
    .input-style {
        width: 100%;
        padding: 0.75rem 1rem;
        border-radius: 9999px;
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
        border: 2px solid #00F0FF;
        transition: all 0.3s;
    }
    .input-style:focus {
        outline: none;
        box-shadow: 0 0 0 3px #FF3CAC;
    }
    .btn-primary {
        display: inline-flex;
        align-items: center;
        padding: 0.75rem 1.5rem;
        border-radius: 9999px;
        background-color: #FF3CAC;
        color: white;
        font-weight: bold;
        transition: all 0.3s;
    }
    .btn-primary:hover {
        transform: scale(1.05);
    }
    .btn-secondary {
        display: inline-flex;
        align-items: center;
        padding: 0.75rem 1.5rem;
        border-radius: 9999px;
        background-color: transparent;
        border: 2px solid #00F0FF;
        color: #00F0FF;
        font-weight: bold;
        transition: all 0.3s;
    }
    .btn-secondary:hover {
        background-color: #00F0FF;
        color: #0F0F0F;
    }
`;

// Inject styles into the document head
if (typeof window !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}
