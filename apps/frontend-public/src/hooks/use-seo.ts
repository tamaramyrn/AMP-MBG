import { useEffect } from "react"

interface SEOConfig {
  title: string
  description: string
  path: string
  noindex?: boolean
  jsonLd?: Record<string, unknown>[]
}

const BASE_URL = "https://lapormbg.com"
const SITE_NAME = "AMP MBG"
const DEFAULT_OG_IMAGE = `${BASE_URL}/logo_hijau.webp`

export function useSEO({ title, description, path, noindex, jsonLd }: SEOConfig) {
  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME}`
    const canonical = `${BASE_URL}${path}`

    document.title = fullTitle

    const tags: Record<string, string> = {
      description,
      "og:title": fullTitle,
      "og:description": description,
      "og:url": canonical,
      "og:image": DEFAULT_OG_IMAGE,
      "og:type": "website",
      "og:site_name": SITE_NAME,
      "og:locale": "id_ID",
      "twitter:card": "summary_large_image",
      "twitter:title": fullTitle,
      "twitter:description": description,
      "twitter:image": DEFAULT_OG_IMAGE,
    }

    if (noindex) {
      tags["robots"] = "noindex, nofollow"
    }

    for (const [key, value] of Object.entries(tags)) {
      const attr = key.startsWith("og:") ? "property" : "name"
      let el = document.querySelector<HTMLMetaElement>(
        `meta[${attr}="${key}"]`
      )
      if (!el) {
        el = document.createElement("meta")
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.content = value
    }

    let link = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    )
    if (!link) {
      link = document.createElement("link")
      link.rel = "canonical"
      document.head.appendChild(link)
    }
    link.href = canonical

    // Inject per-route JSON-LD
    document.querySelectorAll('script[data-seo="route"]').forEach((el) => el.remove())
    if (jsonLd) {
      for (const schema of jsonLd) {
        const script = document.createElement("script")
        script.type = "application/ld+json"
        script.setAttribute("data-seo", "route")
        script.textContent = JSON.stringify(schema)
        document.head.appendChild(script)
      }
    }

    return () => {
      document.querySelectorAll('script[data-seo="route"]').forEach((el) => el.remove())
    }
  }, [title, description, path, noindex, jsonLd])
}
