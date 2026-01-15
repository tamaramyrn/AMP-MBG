import { useState, useCallback, memo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { profileService } from "@/services/profile"

function ProfileFormComponent() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    nik: "",
    email: "",
    phone: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswordChange, setShowPasswordChange] = useState(false)

  // Fetch profile from API
  const { isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await profileService.getProfile()
      // Set form data when profile is loaded
      setFormData({
        name: response.user.name || "",
        nik: response.user.nik || "",
        email: response.user.email || "",
        phone: response.user.phone || "",
      })
      return response
    },
  })

  // Update profile mutation
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

  // Change password mutation
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
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    },
  })

  const handleSave = useCallback(() => {
    if (isEditing) {
      updateProfileMutation.mutate()
    } else {
      setIsEditing(true)
    }
  }, [isEditing, updateProfileMutation])

  const handlePasswordChange = useCallback(() => {
    changePasswordMutation.mutate()
  }, [changePasswordMutation])

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
      <div className="bg-general-20 rounded-lg shadow-md border border-general-30 p-6">
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-general-20 rounded-lg shadow-md border border-general-30 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="h5 text-general-100">Edit Informasi Akun</h2>
        <button
          onClick={handleSave}
          disabled={updateProfileMutation.isPending}
          className="px-4 py-2 bg-blue-100 hover:bg-blue-90 text-general-20 font-heading font-medium rounded-lg transition-colors body-sm disabled:opacity-50"
        >
          {updateProfileMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isEditing ? (
            "Simpan"
          ) : (
            "Edit Profil"
          )}
        </button>
      </div>

      {updateProfileMutation.isError && (
        <div className="mb-4 p-3 bg-red-20 border border-red-100 rounded-lg">
          <p className="text-red-100 body-sm">
            {(updateProfileMutation.error as Error)?.message || "Gagal memperbarui profil"}
          </p>
        </div>
      )}

      <div className="grid gap-5">
        {/* NAMA LENGKAP */}
        <div>
          <label htmlFor="name" className="block body-sm font-medium text-general-80 mb-1.5">
            Nama Lengkap
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleNameChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 border border-general-30 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 transition-colors disabled:bg-general-30/30 disabled:cursor-not-allowed body-sm text-general-100"
          />
        </div>

        {/* NIK */}
        <div>
          <label htmlFor="nik" className="block body-sm font-medium text-general-80 mb-1.5">
            NIK
          </label>
          <input
            type="text"
            id="nik"
            value={formData.nik}
            disabled
            className="w-full px-4 py-2.5 border border-general-30 rounded-lg bg-general-30/30 cursor-not-allowed body-sm text-general-100"
          />
          <p className="body-xs text-general-50 mt-1">NIK tidak dapat diubah</p>
        </div>

        {/* EMAIL */}
        <div>
          <label htmlFor="email" className="block body-sm font-medium text-general-80 mb-1.5">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleEmailChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 border border-general-30 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 transition-colors disabled:bg-general-30/30 disabled:cursor-not-allowed body-sm text-general-100"
          />
        </div>

        {/* PHONE */}
        <div>
          <label htmlFor="phone" className="block body-sm font-medium text-general-80 mb-1.5">
            Nomor Telepon
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 border border-general-30 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 transition-colors disabled:bg-general-30/30 disabled:cursor-not-allowed body-sm text-general-100"
          />
        </div>

        {/* PASSWORD CHANGE SECTION */}
        <div className="pt-4 border-t border-general-30">
          {!showPasswordChange ? (
            <button
              onClick={showPasswordForm}
              className="text-blue-100 hover:text-blue-90 body-sm font-medium"
            >
              Ubah Kata Sandi
            </button>
          ) : (
            <div className="space-y-4">
              <h3 className="body-sm font-medium text-general-80">Ubah Kata Sandi</h3>
              
              {changePasswordMutation.isError && (
                <div className="p-3 bg-red-20 border border-red-100 rounded-lg">
                  <p className="text-red-100 body-sm">
                    {(changePasswordMutation.error as Error)?.message || "Gagal mengubah kata sandi"}
                  </p>
                </div>
              )}

              <input
                type="password"
                placeholder="Kata sandi saat ini"
                value={passwordData.currentPassword}
                onChange={handleCurrentPasswordChange}
                className="w-full px-4 py-2.5 border border-general-30 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 transition-colors body-sm text-general-100"
              />
              <input
                type="password"
                placeholder="Kata sandi baru"
                value={passwordData.newPassword}
                onChange={handleNewPasswordChange}
                className="w-full px-4 py-2.5 border border-general-30 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 transition-colors body-sm text-general-100"
              />
              <input
                type="password"
                placeholder="Konfirmasi kata sandi baru"
                value={passwordData.confirmPassword}
                onChange={handleConfirmPasswordChange}
                className="w-full px-4 py-2.5 border border-general-30 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 transition-colors body-sm text-general-100"
              />
              <div className="flex gap-3">
                <button
                  onClick={hidePasswordForm}
                  className="px-4 py-2 border border-general-30 text-general-80 font-medium rounded-lg hover:bg-general-30/50 transition-colors body-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={changePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-90 text-general-20 font-heading font-medium rounded-lg transition-colors body-sm disabled:opacity-50"
                >
                  {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Kata Sandi"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const ProfileForm = memo(ProfileFormComponent)
