
import { useState } from "react"

export function ProfileForm() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "Ahmad Sudirman",
    nik: "3201010101010001",
    email: "ahmad.sudirman@email.com",
    password: "********",
  })

  return (
    <div className="bg-general-20 rounded-lg shadow-md border border-general-30 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="h5 text-general-100">Edit Informasi Akun</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-green-100 hover:bg-green-90 text-general-20 font-heading font-medium rounded-lg transition-colors body-sm"
        >
          {isEditing ? "Simpan" : "Edit Profil"}
        </button>
      </div>

      <div className="grid gap-5">
        <div>
          <label htmlFor="name" className="block body-sm font-medium text-general-80 mb-1.5">
            Nama Lengkap
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 border border-general-30 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-100 transition-colors disabled:bg-general-30/30 disabled:cursor-not-allowed body-sm text-general-100"
          />
        </div>

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

        <div>
          <label htmlFor="email" className="block body-sm font-medium text-general-80 mb-1.5">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 border border-general-30 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-100 transition-colors disabled:bg-general-30/30 disabled:cursor-not-allowed body-sm text-general-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="block body-sm font-medium text-general-80 mb-1.5">
            Kata Sandi
          </label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 border border-general-30 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-100 transition-colors disabled:bg-general-30/30 disabled:cursor-not-allowed body-sm text-general-100"
          />
        </div>
      </div>
    </div>
  )
}
