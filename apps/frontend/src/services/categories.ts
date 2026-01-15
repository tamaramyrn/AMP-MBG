import { api } from "@/lib/api"

export interface Category {
  value: string
  label: string
}

export interface CategoryCredibilityLevel {
  value: string
  label: string
  minScore: number
  description: string
}

export const categoriesService = {
  async getCategories(): Promise<{ data: Category[] }> {
    return api.get("/categories")
  },

  async getRelations(): Promise<{ data: Category[] }> {
    return api.get("/categories/relations")
  },

  async getStatuses(): Promise<{ data: Category[] }> {
    return api.get("/categories/statuses")
  },

  async getCredibilityLevels(): Promise<{ data: CategoryCredibilityLevel[] }> {
    return api.get("/categories/credibility-levels")
  },
}
