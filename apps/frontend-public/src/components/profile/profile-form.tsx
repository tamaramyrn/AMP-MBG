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
  const [showPasswordChange, setShowPasswordChange] = useState(false)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
  const isPhoneValid = /^\d{9,15}$/.test(formData.phone)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  const isNewPasswordValid = passwordRegex.test(passwordData.newPassword)
  const isPasswordMatch = passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword !== ""

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileService.getProfile(),
  })

  useEffect(() => {
    if (profileData?.user) {
      setFormData({
        name: profileData.user.name || "",
        email: profileData.user.email || "",
        phone: profileData.user.phone || "",
      })
    }
  }, [profileData])

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      return profileService.updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
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
      setShowPasswordChange(false)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    },
  })

  const handleSave = useCallback(() => {
    if (isEditing) {
      updateProfileMutation.mutate()
    } else {
      setIsEditing(true)
    }
  }, [isEditing, updateProfileMutation])

  const handlePasswordChange = useCallback(() => changePasswordMutation.mutate(), [changePasswordMutation])
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, name: e.target.value })), [])
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, email: e.target.value })), [])
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, phone: e.target.value })), [])
  const handleCurrentPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value })), [])
  const handleNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value })), [])
  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value })), [])
  const showPasswordForm = useCallback(() => setShowPasswordChange(true), [])
  const hidePasswordForm = useCallback(() => {
    setShowPasswordChange(false)
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
          disabled={updateProfileMutation.isPending}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm ${
            isEditing 
              ? "bg-blue-100 text-white hover:bg-blue-90" 
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
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              disabled={!isEditing}
              className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 transition-colors disabled:bg-general-20 disabled:text-general-60 body-sm text-general-100 ${
                isEditing && formData.phone.length > 0 && !isPhoneValid ? "border-red-100 focus:ring-red-100" : "border-general-30 focus:ring-blue-100 focus:border-blue-100"
              }`}
            />
            {isEditing && formData.phone.length > 0 && !isPhoneValid && (
              <p className="text-[10px] text-red-100 mt-1 font-medium">Min. 9 - Max. 15 angka</p>
            )}
          </div>
        </div>

        {/* PASSWORD SECTION */}
        <div className="mt-8 pt-6 border-t border-general-30">
          {!showPasswordChange ? (
            <button
              onClick={showPasswordForm}
              className="text-blue-100 hover:text-blue-90 body-sm font-bold flex items-center gap-2 hover:underline decoration-blue-100/30 underline-offset-4"
            >
              Ubah Kata Sandi
            </button>
          ) : (
            <div className="bg-general-20/50 rounded-xl p-5 border border-general-30 max-w-lg">
              <h3 className="font-bold text-general-100 mb-4">Ubah Kata Sandi</h3>
              
              {changePasswordMutation.isError && (
                <div className="mb-4 p-3 bg-red-20 border border-red-100 rounded-lg text-red-100 text-xs font-medium">
                  {(changePasswordMutation.error as Error)?.message || "Gagal mengubah kata sandi"}
                </div>
              )}

              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Kata sandi saat ini"
                  value={passwordData.currentPassword}
                  onChange={handleCurrentPasswordChange}
                  className="w-full px-4 py-2.5 bg-white border border-general-30 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 body-sm"
                />
                
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
                    placeholder="Konfirmasi kata sandi baru"
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
                    onClick={handlePasswordChange}
                    disabled={changePasswordMutation.isPending || !passwordData.currentPassword || !isNewPasswordValid || !isPasswordMatch}
                    className="px-6 py-2 bg-blue-100 hover:bg-blue-90 text-white font-bold rounded-lg transition-colors body-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {changePasswordMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                    Simpan Password
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