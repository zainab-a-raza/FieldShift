"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, LogIn } from "lucide-react";
import { signIn, signUp } from "@/lib/api";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        await signUp(fullName, email, password);
      } else {
        await signIn(email, password);
      }
      router.push("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8F3] px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-[#E1E6DF] bg-white p-7 shadow-[0_8px_30px_rgba(27,61,43,0.08)]">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#A7C77D] text-[#143D2B]">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#19382A]">FieldShift</h1>
            <p className="text-xs text-[#718078]">Farm intelligence, made simple</p>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-[#19382A]">
          {mode === "signin" ? "Welcome back" : "Create your farmer account"}
        </h2>
        <p className="mt-2 text-sm text-[#718078]">
          {mode === "signin" ? "Sign in to continue to your farm overview." : "Save your farms and analysis work in one place."}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <label className="block text-xs font-semibold text-[#4C6657]">
              Full name
              <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#DDE5DC] px-3 py-2.5 text-sm font-normal text-[#19382A] outline-none focus:border-[#377C52] focus:ring-2 focus:ring-[#DDEDD9]" />
            </label>
          )}
          <label className="block text-xs font-semibold text-[#4C6657]">
            Email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#DDE5DC] px-3 py-2.5 text-sm font-normal text-[#19382A] outline-none focus:border-[#377C52] focus:ring-2 focus:ring-[#DDEDD9]" />
          </label>
          <label className="block text-xs font-semibold text-[#4C6657]">
            Password
            <input required minLength={mode === "signup" ? 8 : 1} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#DDE5DC] px-3 py-2.5 text-sm font-normal text-[#19382A] outline-none focus:border-[#377C52] focus:ring-2 focus:ring-[#DDEDD9]" />
          </label>
          {error && <p className="rounded-lg bg-[#FDECEA] px-3 py-2 text-xs text-[#A94D43]">{error}</p>}
          <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#377C52] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#286342] disabled:cursor-not-allowed disabled:opacity-60">
            <LogIn className="h-4 w-4" />
            {isSubmitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }} className="mt-5 w-full text-center text-xs font-semibold text-[#377C52] hover:text-[#286342]">
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
        <Link href="/dashboard" className="mt-4 block text-center text-xs text-[#718078] hover:text-[#377C52]">
          Continue to demo workspace
        </Link>
      </section>
    </main>
  );
}
