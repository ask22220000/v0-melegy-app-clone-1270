"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Mail, Lock, LogIn, UserPlus } from "lucide-react"

type View = "login" | "signup"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectedFrom") || "/chat"

  const [view, setView] = useState<View>("login")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupConfirm, setSignupConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) router.replace(redirectTo)
    })
  }, [router, redirectTo])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { data, error: authError } = await createClient().auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      })
      if (authError) {
        setError(
          authError.message.includes("Invalid login credentials")
            ? "الإيميل أو كلمة السر غلط"
            : authError.message.includes("Email not confirmed")
            ? "لازم تأكد إيميلك الأول — فحص صندوق الإيميل"
            : authError.message
        )
        return
      }
      if (data.user) router.replace(redirectTo)
    } catch {
      setError("حدث خطأ في الاتصال")
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (signupPassword !== signupConfirm) { setError("كلمتا السر مش متطابقتين"); return }
    if (signupPassword.length < 6) { setError("كلمة السر لازم تكون 6 أحرف على الأقل"); return }
    setLoading(true)
    try {
      const { data, error: authError } = await createClient().auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: {
          data: { full_name: signupName.trim() },
          emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : "https://melegy.app"}/auth/callback`,
        },
      })
      if (authError) {
        setError(authError.message.includes("already registered") ? "الإيميل ده مسجل قبل كده" : authError.message)
        return
      }
      if (data.session && data.user) {
        router.replace(redirectTo)
      } else {
        setSignupDone(true)
      }
    } catch {
      setError("حدث خطأ في الاتصال")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4" dir="rtl">
      <div className="bg-[#0d1117] border border-blue-900/40 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-center mb-6">
          <img src="/images/logo.jpg" alt="Melegy" className="w-16 h-16 rounded-full object-cover border-2 border-blue-600 shadow-lg shadow-blue-600/30" />
        </div>

        {signupDone ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="bg-blue-600/20 border border-blue-600/40 rounded-full p-4">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">تم إنشاء الحساب!</h2>
            <p className="text-gray-400 text-sm leading-relaxed">بعتنالك إيميل تأكيد. افتحه واضغط على رابط التأكيد عشان تقدر تدخل.</p>
            <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl p-3 w-full">
              <p className="text-amber-400 text-sm">لو ماوصلكش — فحص مجلد الـ Spam</p>
            </div>
            <Button onClick={() => { setSignupDone(false); setView("login") }} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 font-bold rounded-xl">
              الذهاب لتسجيل الدخول
            </Button>
          </div>
        ) : (
          <>
            <div className="flex bg-gray-900 rounded-xl p-1 mb-6 gap-1">
              <button onClick={() => { setView("login"); setError("") }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${view === "login" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                تسجيل الدخول
              </button>
              <button onClick={() => { setView("signup"); setError("") }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${view === "signup" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                حساب جديد
              </button>
            </div>

            {view === "login" && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input type="email" placeholder="الإيميل" value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setError("") }} required dir="ltr" className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 pr-10 py-5 rounded-xl focus:border-blue-500" />
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input type="password" placeholder="كلمة السر" value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setError("") }} required dir="ltr" className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 pr-10 py-5 rounded-xl focus:border-blue-500" />
                </div>
                {error && <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
                <Button type="submit" disabled={loading || !loginEmail || !loginPassword} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 text-base font-bold rounded-xl flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  دخول
                </Button>
              </form>
            )}

            {view === "signup" && (
              <form onSubmit={handleSignup} className="flex flex-col gap-3">
                <Input type="text" placeholder="الاسم (اختياري)" value={signupName} onChange={(e) => setSignupName(e.target.value)} dir="rtl" className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 py-5 rounded-xl focus:border-blue-500" />
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input type="email" placeholder="الإيميل" value={signupEmail} onChange={(e) => { setSignupEmail(e.target.value); setError("") }} required dir="ltr" className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 pr-10 py-5 rounded-xl focus:border-blue-500" />
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input type="password" placeholder="كلمة السر (6 أحرف على الأقل)" value={signupPassword} onChange={(e) => { setSignupPassword(e.target.value); setError("") }} required dir="ltr" className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 pr-10 py-5 rounded-xl focus:border-blue-500" />
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input type="password" placeholder="تأكيد كلمة السر" value={signupConfirm} onChange={(e) => { setSignupConfirm(e.target.value); setError("") }} required dir="ltr" className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 pr-10 py-5 rounded-xl focus:border-blue-500" />
                </div>
                {error && <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
                <Button type="submit" disabled={loading || !signupEmail || !signupPassword || !signupConfirm} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 text-base font-bold rounded-xl flex items-center justify-center gap-2 mt-1">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  إنشاء الحساب
                </Button>
              </form>
            )}
          </>
        )}
        <p className="text-center text-gray-600 text-xs mt-6">Melegy AI — صنع في مصر</p>
      </div>
    </div>
  )
}
