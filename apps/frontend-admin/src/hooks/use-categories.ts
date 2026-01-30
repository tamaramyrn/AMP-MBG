import { useQuery } from "@tanstack/react-query"
import { categoriesService } from "@/services/categories"

// Fallback data
const CATEGORY_LABELS: Record<string, string> = {
  poisoning: "Keracunan dan Masalah Kesehatan",
  kitchen: "Operasional Dapur",
  quality: "Kualitas dan Keamanan Dapur",
  policy: "Kebijakan dan Anggaran",
  implementation: "Implementasi Program",
  social: "Dampak Sosial dan Ekonomi",
}

const CATEGORY_LABELS_SHORT: Record<string, string> = {
  poisoning: "Keracunan",
  kitchen: "Operasional Dapur",
  quality: "Kualitas Makanan",
  policy: "Kebijakan",
  implementation: "Implementasi",
  social: "Dampak Sosial",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu Verifikasi",
  analyzing: "Dalam Proses Analisis",
  needs_evidence: "Butuh Bukti Tambahan",
  invalid: "Tidak Valid",
  in_progress: "Dalam Proses Penanganan",
  resolved: "Selesai Ditangani",
}

const STATUS_VARIANTS: Record<string, "neutral" | "danger" | "success" | "warning"> = {
  pending: "neutral",
  analyzing: "warning",
  needs_evidence: "warning",
  invalid: "danger",
  in_progress: "warning",
  resolved: "success",
}

const RELATION_LABELS: Record<string, string> = {
  parent: "Orang Tua/Wali Murid",
  teacher: "Guru/Tenaga Pendidik",
  principal: "Kepala Sekolah",
  supplier: "Penyedia Makanan/Supplier",
  student: "Siswa",
  community: "Masyarakat Umum",
  other: "Lainnya",
}

const CATEGORY_VARIANTS: Record<string, "danger" | "warning" | "info"> = {
  poisoning: "danger",
  kitchen: "warning",
  quality: "warning",
  policy: "info",
  implementation: "info",
  social: "info",
}

const STALE_TIME = 1000 * 60 * 60 // 1 hour

export function useCategories() {
  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesService.getCategories(),
    staleTime: STALE_TIME,
  })

  const categoriesMap = data?.data?.reduce((acc, cat) => {
    acc[cat.value] = cat.label
    return acc
  }, {} as Record<string, string>) || CATEGORY_LABELS

  return {
    categories: data?.data || [],
    categoriesMap,
    isLoading,
    getCategoryLabel: (key: string) => categoriesMap[key] || key,
    getCategoryVariant: (key: string) => CATEGORY_VARIANTS[key] || "info",
  }
}

export function useRelations() {
  const { data, isLoading } = useQuery({
    queryKey: ["categories", "relations"],
    queryFn: () => categoriesService.getRelations(),
    staleTime: STALE_TIME,
  })

  const relationsMap = data?.data?.reduce((acc, rel) => {
    acc[rel.value] = rel.label
    return acc
  }, {} as Record<string, string>) || RELATION_LABELS

  return {
    relations: data?.data || [],
    relationsMap,
    isLoading,
    getRelationLabel: (key: string) => relationsMap[key] || key,
  }
}

export function useStatuses() {
  const { data, isLoading } = useQuery({
    queryKey: ["categories", "statuses"],
    queryFn: () => categoriesService.getStatuses(),
    staleTime: STALE_TIME,
  })

  const statusesMap = data?.data?.reduce((acc, status) => {
    acc[status.value] = status.label
    return acc
  }, {} as Record<string, string>) || STATUS_LABELS

  return {
    statuses: data?.data || [],
    statusesMap,
    isLoading,
    getStatusLabel: (key: string) => statusesMap[key] || key,
    getStatusVariant: (key: string) => STATUS_VARIANTS[key] || "neutral",
  }
}

// Static exports for sync usage
export {
  CATEGORY_LABELS,
  CATEGORY_LABELS_SHORT,
  STATUS_LABELS,
  STATUS_VARIANTS,
  RELATION_LABELS,
  CATEGORY_VARIANTS,
}
