"use client";
import React, { useState } from "react";
import { User, KeyRound, UserSquare2, Sparkles, Check, ArrowRight, ArrowLeft, ImageUp } from "lucide-react";

const steps = [
  { id: 1, title: "Credentials", icon: <KeyRound /> },
  { id: 2, title: "Profile", icon: <UserSquare2 /> },
  { id: 3, title: "Interests", icon: <Sparkles /> },
  { id: 4, title: "Media", icon: <ImageUp /> },
];

async function uploadToCloudinary(file: File): Promise<string | null> {
    const url = `https://api.cloudinary.com/v1_1/drrzvi2jp/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "flixtrend_unsigned");
    const response = await fetch(url, { method: "POST", body: formData });
    const data = await response.json();
    return data.secure_url || null;
}


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
    banner_url: "",
  });
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
      if (e.target.files && e.target.files[0]) {
          setUploading(type);
          setError("");
          try {
              const url = await uploadToCloudinary(e.target.files[0]);
              if (url) {
                  setFormData(f => ({...f, [`${type}_url`]: url}));
              } else {
                  setError(`Failed to upload ${type}.`);
              }
          } catch (err) {
              setError(`Error uploading ${type}.`);
          } finally {
              setUploading(null);
          }
      }
  }

  const nextStep = () => {
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
        setError("Please upload an avatar to complete signup.");
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step > s.id ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-black" : step === s.id ? "bg-[var(--accent-pink)] border-[var(--accent-pink)] text-white" : "bg-black/20 border-gray-500 text-gray-400"}`}>
                {step > s.id ? <Check /> : s.icon}
              </div>
              <p className={`text-xs mt-2 transition-all duration-300 ${step >= s.id ? "text-white" : "text-gray-500"}`}>{s.title}</p>
            </div>
            {index < steps.length - 1 && <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${step > s.id ? "bg-[var(--accent-green)]" : "bg-gray-700"}`}></div>}
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
                <textarea name="bio" placeholder="Your Bio (Optional)" value={formData.bio} onChange={handleChange} className="input-style min-h-[80px] rounded-2xl"/>
                <input type="text" name="interests" placeholder="Interests (e.g., Gaming, Music, Tech)" value={formData.interests} onChange={handleChange} className="input-style" />
            </div>
        )}
        {step === 4 && (
            <div className="animate-fade-in space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2 text-center text-white">Upload Profile Picture</h3>
                    <input id="avatar-upload" type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'avatar')} accept="image/*" />
                    <label htmlFor="avatar-upload" className="w-32 h-32 mx-auto rounded-full flex items-center justify-center border-2 border-dashed border-[var(--accent-pink)] cursor-pointer bg-black/20 hover:bg-black/40">
                        {uploading === 'avatar' ? <div className="loader"></div> : formData.avatar_url ? <img src={formData.avatar_url} alt="avatar preview" className="w-full h-full object-cover rounded-full" /> : <ImageUp className="text-[var(--accent-pink)]" />}
                    </label>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold mb-2 text-center text-white">Upload Banner (Optional)</h3>
                    <input id="banner-upload" type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'banner')} accept="image/*" />
                     <label htmlFor="banner-upload" className="w-full h-32 mx-auto rounded-lg flex items-center justify-center border-2 border-dashed border-[var(--accent-cyan)] cursor-pointer bg-black/20 hover:bg-black/40">
                        {uploading === 'banner' ? <div className="loader"></div> : formData.banner_url ? <img src={formData.banner_url} alt="banner preview" className="w-full h-full object-cover rounded-lg" /> : <ImageUp className="text-[var(--accent-cyan)]" />}
                    </label>
                </div>
            </div>
        )}

        <div className="flex justify-between mt-8">
            {step > 1 && <button type="button" onClick={prevStep} className="btn-secondary"><ArrowLeft className="mr-2"/> Back</button>}
            {step < 4 && <button type="button" onClick={nextStep} className="btn-primary ml-auto">Next <ArrowRight className="ml-2"/></button>}
            {step === 4 && <button type="submit" disabled={loading || uploading !== null} className="btn-primary ml-auto">{loading ? "Signing up..." : "Finish Signup"}</button>}
        </div>
      </form>
      <style jsx>{`
        .input-style {
            width: 100%;
            padding: 0.75rem 1rem;
            background-color: rgba(0,0,0,0.4);
            color: white;
            border: 2px solid var(--accent-cyan);
            transition: all 0.3s;
            border-radius: 9999px;
        }
        .input-style:focus {
            outline: none;
            border-color: var(--accent-pink);
            box-shadow: 0 0 0 2px var(--accent-pink);
        }
        .btn-primary {
            display: inline-flex;
            align-items: center;
            padding: 0.75rem 1.5rem;
            border-radius: 9999px;
            background-color: var(--accent-pink);
            color: white;
            font-weight: bold;
            transition: all 0.3s;
        }
        .btn-primary:hover {
            transform: scale(1.05);
            box-shadow: 0 0 10px var(--accent-pink);
        }
        .btn-secondary {
            display: inline-flex;
            align-items: center;
            padding: 0.75rem 1.5rem;
            border-radius: 9999px;
            background-color: transparent;
            border: 2px solid var(--accent-cyan);
            color: var(--accent-cyan);
            font-weight: bold;
            transition: all 0.3s;
        }
        .btn-secondary:hover {
            background-color: var(--accent-cyan);
            color: black;
        }
      `}</style>
    </div>
  );
}
