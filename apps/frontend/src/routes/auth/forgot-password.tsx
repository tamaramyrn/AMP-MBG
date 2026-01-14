import { createFileRoute, Link } from "@tanstack/react-router"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState } from "react"
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react"

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Validasi Email Sederhana
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEmailValid) {
      // Simulasi kirim email
      setIsSubmitted(true)
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
            {/* Email Field */}
            <fieldset className="border border-general-30 rounded-lg px-3 pb-2.5 pt-1 focus-within:border-blue-100 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
              <legend className="body-xs text-general-60 px-2 font-medium bg-general-20">Surel</legend>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan surel Anda"
                  className="w-full outline-none text-general-100 placeholder:text-general-40 body-sm bg-transparent"
                />
                <Mail className="w-5 h-5 text-general-40" />
              </div>
            </fieldset>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isEmailValid}
              className={`w-full py-2.5 font-heading font-semibold rounded-lg transition-all shadow-sm body-sm ${
                isEmailValid 
                  ? "bg-blue-100 hover:bg-blue-90 text-general-20 cursor-pointer" 
                  : "bg-general-30 text-general-60 cursor-not-allowed opacity-70"
              }`}
            >
              Kirim Tautan Atur Ulang
            </button>
          </form>
        </div>
      )}
    </AuthLayout>
  )
}