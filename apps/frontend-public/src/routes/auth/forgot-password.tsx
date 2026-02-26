import { createFileRoute, Link } from "@tanstack/react-router"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState } from "react"
import { ArrowLeft, CheckCircle2, Mail, Loader2 } from "lucide-react"
import { authService } from "@/services/auth"
import { useSEO } from "@/hooks/use-seo"

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  useSEO({ title: "Lupa Kata Sandi", description: "Reset kata sandi akun AMP MBG", path: "/auth/forgot-password", noindex: true })
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Simple email validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmailValid) return

    setError("")
    setIsLoading(true)

    try {
      await authService.forgotPassword(email)
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim email")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      
      {isSubmitted ? (
        // Success view
        <div className="text-center animate-in fade-in duration-300">
          <div className="w-20 h-20 bg-green-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-green-100" />
          </div>
          <h1 className="h3 font-heading font-bold text-general-100 mb-3">Cek Surel Anda</h1>
          <p className="body-md text-general-60 mb-6 leading-relaxed">
            Jika <strong className="text-general-100">{email}</strong> terdaftar di sistem kami, tautan untuk mengatur ulang kata sandi akan dikirim ke surel tersebut.
          </p>
          <p className="body-sm text-general-50 mb-8 leading-relaxed">
            Tidak menerima surel? Periksa folder spam atau pastikan alamat surel yang Anda masukkan sudah terdaftar.
          </p>

          <Link
            to="/auth/login"
            className="block w-full py-3.5 bg-blue-100 hover:bg-blue-90 text-white font-heading font-bold rounded-xl transition-all shadow-lg shadow-blue-100/20 hover:shadow-blue-100/40 transform hover:-translate-y-0.5 body-sm text-center"
          >
            Kembali ke Halaman Masuk
          </Link>

          <button
            onClick={() => setIsSubmitted(false)}
            className="mt-6 text-blue-100 font-bold hover:text-orange-100 transition-colors body-sm hover:underline underline-offset-4"
          >
            Coba dengan surel lain
          </button>
        </div>
      ) : (
        // Form view
        <>
          <div className="animate-in fade-in duration-300">
            <div className="mb-8">
              <h1 className="h3 font-heading font-bold text-general-100 mb-3">Lupa Kata Sandi?</h1>
              <p className="body-md text-general-60 leading-relaxed">
                Masukkan surel yang terdaftar dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-20/50 border border-red-100/20 text-red-100 px-4 py-3 rounded-xl body-sm flex items-center animate-in fade-in">
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div className="flex flex-col gap-1">
                <fieldset className={`border rounded-lg px-3 pb-2.5 pt-1 transition-all ${
                  email.length > 0 && !isEmailValid
                    ? "border-red-100 focus-within:ring-red-100"
                    : "border-general-30 focus-within:border-blue-100 focus-within:ring-blue-100"
                }`}>
                  <legend className="body-xs text-general-60 px-2 font-medium bg-general-20">Surel</legend>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Masukkan surel Anda"
                      className="w-full outline-none text-general-100 placeholder:text-general-40 body-sm bg-transparent"
                      disabled={isLoading}
                    />
                    <Mail className="w-5 h-5 text-general-40" />
                  </div>
                </fieldset>
                {email.length > 0 && !isEmailValid && (
                  <p className="text-[10px] text-red-100 px-1">Format: nama@domain.com</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isEmailValid || isLoading}
                className={`w-full py-3.5 bg-gradient-to-r from-blue-100 to-blue-90 hover:from-blue-90 hover:to-blue-100 text-white font-heading font-bold rounded-xl transition-all shadow-lg shadow-blue-100/20 hover:shadow-blue-100/40 transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 ${
                  isEmailValid ? "cursor-pointer" : "cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white/90" />
                    Memproses...
                  </>
                ) : (
                  "Kirim Tautan Atur Ulang"
                )}
              </button>
            </form>
          </div>

          {/* Back button */}
          <div className="mt-8 pt-6 border-t border-general-30 text-center">
            <Link 
              to="/auth/login" 
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-general-60 hover:text-blue-100 hover:bg-blue-20/50 transition-all duration-300 body-sm font-semibold group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Masuk
            </Link>
          </div>
        </>
      )}
    </AuthLayout>
  )
}