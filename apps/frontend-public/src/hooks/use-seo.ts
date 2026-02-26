import { useEffect } from "react"

interface SEOConfig {
  title: string
  description: string
  path: string
  noindex?: boolean
}

const BASE_URL = "https://lapormbg.com"
const SITE_NAME = "AMP MBG"
const DEFAULT_OG_IMAGE = `${BASE_URL}/logo_hijau.webp`

export function useSEO({ title, description, path, noindex }: SEOConfig) {
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
      const isOg = key.startsWith("og:")
      const isTwitter = key.startsWith("twitter:")
      const attr = isOg || isTwitter ? "property" : "name"
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
  }, [title, description, path, noindex])
}
