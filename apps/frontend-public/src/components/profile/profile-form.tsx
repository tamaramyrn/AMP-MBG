import { useState, useCallback, memo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, User, Save, Edit3 } from "lucide-react"
import { profileService } from "@/services/profile"

function ProfileFormComponent() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  // --- VALIDASI ---
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
  
  // Validasi Telepon: Hanya angka, min 9, max 12
  const isPhoneValid = /^\d{9,12}$/.test(formData.phone)

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  const isNewPasswordValid = passwordRegex.test(passwordData.newPassword)
  const isPasswordMatch = passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword !== ""

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileService.getProfile(),
  })

  const hasPassword = profileData?.user?.hasPassword
  const isGoogleLinked = profileData?.user?.isGoogleLinked

  useEffect(() => {
    if (profileData?.user) {
      // Logic pembersihan nomor telepon agar tidak double +62 di UI
      let cleanPhone = profileData.user.phone || "";
      if (cleanPhone.startsWith("+62")) {
        cleanPhone = cleanPhone.substring(3);
      } else if (cleanPhone.startsWith("62")) {
        cleanPhone = cleanPhone.substring(2);
      } else if (cleanPhone.startsWith("0")) {
        cleanPhone = cleanPhone.substring(1);
      }

      setFormData({
        name: profileData.user.name || "",
        email: profileData.user.email || "",
        phone: cleanPhone,
      })
    }
  }, [profileData])

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      // Format ulang ke +62 saat simpan
      const finalPhone = formData.phone.startsWith("0") 
        ? `+62${formData.phone.slice(1)}` 
        : `+62${formData.phone}`;

      return profileService.updateProfile({
        name: formData.name,
        email: formData.email,
        phone: finalPhone,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      setIsEditing(false)
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      return profileService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      })
    },
    onSuccess: () => {
      setShowPasswordForm(false)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    },
  })

  const createPasswordMutation = useMutation({
    mutationFn: async () => {
      return profileService.createPassword({
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      })
    },
    onSuccess: () => {
      setShowPasswordForm(false)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
  })

  const handleSave = useCallback(() => {
    if (isEditing) {
      if (!isPhoneValid || !isEmailValid || !formData.name) {
        return; 
      }
      updateProfileMutation.mutate()
    } else {
      setIsEditing(true)
    }
  }, [isEditing, updateProfileMutation, isPhoneValid, isEmailValid, formData.name])

  const handlePasswordSubmit = useCallback(() => {
    if (hasPassword) {
      changePasswordMutation.mutate()
    } else {
      createPasswordMutation.mutate()
    }
  }, [hasPassword, changePasswordMutation, createPasswordMutation])

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, name: e.target.value })), [])
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, email: e.target.value })), [])
  
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "") 
    setFormData((prev) => ({ ...prev, phone: val }))
  }, [])

  const handleCurrentPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value })), [])
  const handleNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value })), [])
  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value })), [])
  const openPasswordForm = useCallback(() => setShowPasswordForm(true), [])
  const hidePasswordForm = useCallback(() => {
    setShowPasswordForm(false)
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-general-30 p-8 flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-general-30 overflow-hidden">
      
      {/* Header Form */}
      <div className="px-6 py-5 md:px-8 border-b border-general-30 flex items-center justify-between bg-general-20/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-20 rounded-lg">
            <User className="w-5 h-5 text-blue-100" />
          </div>
          <h2 className="text-lg font-bold text-general-100">Informasi Akun</h2>
        </div>
        
        <button
          onClick={handleSave}
          disabled={updateProfileMutation.isPending || (isEditing && (!isPhoneValid || !isEmailValid || !formData.name))}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm ${
            isEditing 
              ? "bg-blue-100 text-white hover:bg-blue-90 disabled:opacity-50 disabled:cursor-not-allowed" 
              : "bg-white border border-general-30 text-general-70 hover:text-blue-100 hover:border-blue-100"
          }`}
        >
          {updateProfileMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isEditing ? (
            <> <Save className="w-4 h-4" /> Simpan </>
          ) : (
            <> <Edit3 className="w-4 h-4" /> Edit Profil </>
          )}
        </button>
      </div>

      {/* Body Form */}
      <div className="p-6 md:p-8">
        
        {updateProfileMutation.isError && (
          <div className="mb-6 p-4 bg-red-20 border border-red-100 rounded-xl flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-100 mt-2 shrink-0" />
            <p className="text-red-100 body-sm font-medium">{(updateProfileMutation.error as Error)?.message || "Gagal memperbarui profil"}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* NAMA */}
          <div>
            <label htmlFor="name" className="block text-xs font-bold text-general-80 mb-2 uppercase tracking-wide">Nama Lengkap</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 bg-white border border-general-30 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-100 transition-colors disabled:bg-general-20 disabled:text-general-60 body-sm text-general-100"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-general-80 mb-2 uppercase tracking-wide">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleEmailChange}
              disabled={!isEditing}
              className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 transition-colors disabled:bg-general-20 disabled:text-general-60 body-sm text-general-100 ${
                isEditing && formData.email.length > 0 && !isEmailValid ? "border-red-100 focus:ring-red-100" : "border-general-30 focus:ring-blue-100 focus:border-blue-100"
              }`}
            />
            {isEditing && formData.email.length > 0 && !isEmailValid && (
              <p className="text-[10px] text-red-100 mt-1 font-medium">Format email tidak valid</p>
            )}
          </div>

          {/* PHONE */}
          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-general-80 mb-2 uppercase tracking-wide">Nomor Telepon</label>
            <div className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-2.5 transition-all ${
               isEditing ? "focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-100" : "bg-general-20 border-general-30"
            } ${
               isEditing && formData.phone.length > 0 && !isPhoneValid ? "border-red-100 ring-2 ring-red-100/5" : "border-general-30"
            }`}>
               <span className="text-general-60 body-sm font-medium border-r border-general-30 pr-3 mr-1 select-none">+62</span>
               <input
                 type="tel"
                 id="phone"
                 value={formData.phone}
                 onChange={handlePhoneChange}
                 disabled={!isEditing}
                 placeholder="8xxxxxxxx"
                 className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium disabled:text-general-60"
               />
            </div>
            {isEditing && formData.phone.length > 0 && !isPhoneValid && (
              <p className="text-[10px] text-red-100 mt-1 font-medium">Harus berupa angka (Min. 9 - Max. 12 digit)</p>
            )}
          </div>
        </div>

        {/* PASSWORD SECTION */}
        <div className="mt-8 pt-6 border-t border-general-30">
          {/* Google Connected Indicator */}
          {isGoogleLinked && (
            <div className="flex items-center gap-3 text-general-60 mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="body-sm font-medium text-green-700">Terhubung dengan Akun Google</span>
            </div>
          )}

          {/* Password Form Toggle */}
          {!showPasswordForm ? (
            <button
              onClick={openPasswordForm}
              className="text-blue-100 hover:text-blue-90 body-sm font-bold flex items-center gap-2 hover:underline decoration-blue-100/30 underline-offset-4"
            >
              {hasPassword ? "Ubah Kata Sandi" : "Buat Kata Sandi"}
            </button>
          ) : (
            // PERUBAHAN: w-full (Agar lebar penuh mengikuti container parent)
            <div className="bg-general-20/50 rounded-xl p-5 border border-general-30 w-full">
              <h3 className="font-bold text-general-100 mb-4">{hasPassword ? "Ubah Kata Sandi" : "Buat Kata Sandi"}</h3>

              {(changePasswordMutation.isError || createPasswordMutation.isError) && (
                <div className="mb-4 p-3 bg-red-20 border border-red-100 rounded-lg text-red-100 text-xs font-medium">
                  {((changePasswordMutation.error || createPasswordMutation.error) as Error)?.message || "Gagal menyimpan kata sandi"}
                </div>
              )}

              <div className="space-y-4">
                {/* Current Password */}
                {hasPassword && (
                  <input
                    type="password"
                    placeholder="Kata sandi saat ini"
                    value={passwordData.currentPassword}
                    onChange={handleCurrentPasswordChange}
                    className="w-full px-4 py-2.5 bg-white border border-general-30 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 body-sm"
                  />
                )}

                <div>
                  <input
                    type="password"
                    placeholder="Kata sandi baru"
                    value={passwordData.newPassword}
                    onChange={handleNewPasswordChange}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 body-sm ${
                      passwordData.newPassword.length > 0 && !isNewPasswordValid ? "border-red-100 focus:ring-red-100" : "border-general-30 focus:ring-blue-100"
                    }`}
                  />
                  {/* Validation Hints */}
                  {passwordData.newPassword.length > 0 && !isNewPasswordValid && (
                    <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                      {[
                        { test: passwordData.newPassword.length >= 8, label: "Min. 8 karakter" },
                        { test: /[A-Z]/.test(passwordData.newPassword), label: "Huruf Besar" },
                        { test: /[a-z]/.test(passwordData.newPassword), label: "Huruf Kecil" },
                        { test: /[0-9]/.test(passwordData.newPassword), label: "Angka" },
                      ].map((req, idx) => (
                        <span key={idx} className={`text-[10px] flex items-center gap-1 ${req.test ? "text-green-600 font-bold" : "text-general-50"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${req.test ? "bg-green-600" : "bg-general-40"}`} />
                          {req.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Konfirmasi kata sandi"
                    value={passwordData.confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 body-sm ${
                      passwordData.confirmPassword.length > 0 && !isPasswordMatch ? "border-red-100 focus:ring-red-100" : "border-general-30 focus:ring-blue-100"
                    }`}
                  />
                  {passwordData.confirmPassword.length > 0 && !isPasswordMatch && (
                    <p className="text-[10px] text-red-100 mt-1 font-medium">Kata sandi tidak cocok</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={hidePasswordForm}
                    className="px-4 py-2 border border-general-30 text-general-70 font-bold rounded-lg hover:bg-white transition-colors body-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handlePasswordSubmit}
                    disabled={
                      (changePasswordMutation.isPending || createPasswordMutation.isPending) ||
                      (hasPassword && !passwordData.currentPassword) ||
                      !isNewPasswordValid ||
                      !isPasswordMatch
                    }
                    className="px-6 py-2 bg-blue-100 hover:bg-blue-90 text-white font-bold rounded-lg transition-colors body-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {(changePasswordMutation.isPending || createPasswordMutation.isPending) && <Loader2 className="w-3 h-3 animate-spin" />}
                    {hasPassword ? "Simpan Perubahan" : "Buat Kata Sandi"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const ProfileForm = memo(ProfileFormComponent)