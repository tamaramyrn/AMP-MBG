import { createFileRoute, Link } from "@tanstack/react-router"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState } from "react"
import { ArrowLeft, CheckCircle2, Mail, Loader2 } from "lucide-react"
import { authService } from "@/services/auth"

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Validasi Email Sederhana
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
      {/* Tombol Kembali */}
      <div className="mb-6">
        <Link 
          to="/auth/login" 
          className="inline-flex items-center gap-2 text-general-60 hover:text-blue-100 transition-colors body-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Masuk
        </Link>
      </div>

      {isSubmitted ? (
        // TAMPILAN SETELAH KIRIM EMAIL (SUKSES)
        <div className="text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-green-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-100" />
          </div>
          <h1 className="h3 text-general-100 mb-2">Cek Surel Anda</h1>
          <p className="body-md text-general-60 mb-8">
            Kami telah mengirimkan tautan untuk mengatur ulang kata sandi ke <strong>{email}</strong>.
          </p>
          
          <Link
            to="/auth/login"
            className="block w-full py-2.5 bg-blue-100 hover:bg-blue-90 text-general-20 font-heading font-semibold rounded-lg transition-colors shadow-sm body-sm text-center"
          >
            Kembali ke Halaman Masuk
          </Link>

          <button 
            onClick={() => setIsSubmitted(false)}
            className="mt-6 text-blue-100 font-medium hover:underline body-sm"
          >
            Kirim ulang tautan
          </button>
        </div>
      ) : (
        // TAMPILAN FORMULIR (INPUT EMAIL)
        <div className="animate-in fade-in duration-300">
          <div className="mb-8">
            <h1 className="h3 text-general-100 mb-2">Lupa Kata Sandi?</h1>
            <p className="body-md text-general-60">
              Masukkan surel Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-20/50 border border-red-100/20 text-red-100 px-4 py-3 rounded-xl body-sm flex items-center gap-3 animate-in fade-in">
                <div className="w-1.5 h-1.5 bg-red-100 rounded-full shrink-0" />
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
              className={`w-full py-2.5 font-heading font-semibold rounded-lg transition-all shadow-sm body-sm flex items-center justify-center gap-2 ${
                isEmailValid && !isLoading
                  ? "bg-blue-100 hover:bg-blue-90 text-general-20 cursor-pointer"
                  : "bg-general-30 text-general-60 cursor-not-allowed opacity-70"
              }`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Mengirim..." : "Kirim Tautan Atur Ulang"}
            </button>
          </form>
        </div>
      )}
    </AuthLayout>
  )
}