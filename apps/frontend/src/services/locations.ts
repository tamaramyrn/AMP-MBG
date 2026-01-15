import { api } from "@/lib/api"

export interface Province {
  id: string
  name: string
}

export interface City {
  id: string
  provinceId: string
  name: string
}

export interface District {
  id: string
  cityId: string
  name: string
}

export const locationsService = {
  async getProvinces(): Promise<{ data: Province[] }> {
    return api.get("/locations/provinces")
  },

  async getCities(provinceId: string): Promise<{ data: City[] }> {
    return api.get(`/locations/provinces/${provinceId}/cities`)
  },

  async getDistricts(cityId: string): Promise<{ data: District[] }> {
    return api.get(`/locations/cities/${cityId}/districts`)
  },

  async search(query: string, type?: "province" | "city" | "district"): Promise<{
    data: { type: string; id: string; name: string; parent?: string }[]
  }> {
    const params = new URLSearchParams({ q: query })
    if (type) params.append("type", type)
    return api.get(`/locations/search?${params.toString()}`)
  },
}
