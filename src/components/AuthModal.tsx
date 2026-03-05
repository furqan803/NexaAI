import { useState } from "react";
import { cn } from "@/utils/cn";
import { supabase } from "../../lib/supabaseClient";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuth: (user: { name: string; email: string }) => void;
}

export function AuthModal({ isOpen, onClose, onAuth }: AuthModalProps) {
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    if (!isOpen) return null;

    const validate = () => {
        if (!email.trim()) return "Please enter your email address.";
        if (!/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email address.";
        if (!password || password.length < 6) return "Password must be at least 6 characters.";
        if (mode === "signup" && !name.trim()) return "Please enter your full name.";
        return "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }
        setError("");
        setLoading(true);

        try {
            if (mode === "signup") {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name.trim(),
                        },
                    },
                });

                if (signUpError) throw signUpError;

                alert("Check your email for verification");
                onClose();
            } else {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                if (data.user) {
                    onAuth({
                        name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || "User",
                        email: data.user.email || ""
                    });
                }
                onClose();
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during authentication.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-base">NexaAI</h2>
                            <p className="text-white/30 text-xs">Your intelligent AI workspace</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/30 hover:text-white/70 p-1.5 rounded-lg hover:bg-white/8 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 pb-6">
                    {/* Tab switcher */}
                    <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-5">
                        <button
                            onClick={() => { setMode("login"); setError(""); }}
                            className={cn(
                                "flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                                mode === "login"
                                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                                    : "text-white/40 hover:text-white/70"
                            )}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setMode("signup"); setError(""); }}
                            className={cn(
                                "flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                                mode === "signup"
                                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                                    : "text-white/40 hover:text-white/70"
                            )}
                        >
                            Create Account
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        {/* Name — only signup */}
                        {mode === "signup" && (
                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your full name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all"
                                />
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium text-white/50 mb-1.5">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-medium text-white/50 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-11 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                                >
                                    {showPass ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                <p className="text-red-300 text-xs">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all duration-200 shadow-lg shadow-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    {mode === "login" ? "Signing In..." : "Creating Account..."}
                                </>
                            ) : (
                                mode === "login" ? "Sign In →" : "Create Account →"
                            )}
                        </button>
                    </form>

                    {/* Switch mode */}
                    <p className="text-center text-xs text-white/30 mt-4">
                        {mode === "login" ? (
                            <>
                                Don't have an account?{" "}
                                <button onClick={() => { setMode("signup"); setError(""); }} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                    Create one free
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}
                                <button onClick={() => { setMode("login"); setError(""); }} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                    Sign in here
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
