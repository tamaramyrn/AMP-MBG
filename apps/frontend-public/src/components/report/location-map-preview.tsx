import { memo, useEffect, useState, useCallback, useRef } from "react"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet"
import { Icon, type LatLngExpression } from "leaflet"
import { MapPin, Loader2, Search, AlertCircle } from "lucide-react"

export interface ResolvedAddress {
  state?: string
  city?: string
  county?: string
  suburb?: string
  village?: string
}

interface LocationMapPreviewProps {
  provinceName: string
  cityName: string
  districtName: string
  specificLocation: string
  onCoordinatesChange?: (lat: number, lng: number, address?: string) => void
  onAddressResolved?: (address: ResolvedAddress) => void
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  address?: {
    road?: string
    village?: string
    suburb?: string
    city?: string
    town?: string
    county?: string
    state?: string
    postcode?: string
    country?: string
  }
}

const DEFAULT_CENTER: LatLngExpression = [-2.5, 118]
const DEFAULT_ZOOM = 5
const LOCATED_ZOOM = 15

const markerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function MapController({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])
  return null
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function LocationMapPreviewComponent({
  provinceName,
  cityName,
  districtName,
  specificLocation,
  onCoordinatesChange,
  onAddressResolved,
}: LocationMapPreviewProps) {
  const [position, setPosition] = useState<LatLngExpression | null>(null)
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)
  const [isSearching, setIsSearching] = useState(false)
  const [addressInfo, setAddressInfo] = useState<string | null>(null)
  const [postalCode, setPostalCode] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [manualQuery, setManualQuery] = useState("")
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchLocation = useCallback(async (query: string) => {
    if (!query || query.length < 3) return

    setIsSearching(true)
    setSearchError(null)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=1&addressdetails=1`,
        {
          headers: { "Accept-Language": "id" },
        }
      )

      if (!response.ok) throw new Error("Gagal mencari lokasi")

      const data: NominatimResult[] = await response.json()

      if (data.length > 0) {
        const result = data[0]
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)

        setPosition([lat, lng])
        setMapCenter([lat, lng])
        setMapZoom(LOCATED_ZOOM)
        setAddressInfo(result.display_name)
        setPostalCode(result.address?.postcode || null)

        onCoordinatesChange?.(lat, lng, result.display_name)

        if (result.address) {
          onAddressResolved?.({
            state: result.address.state,
            city: result.address.city || result.address.town,
            county: result.address.county,
            suburb: result.address.suburb,
            village: result.address.village,
          })
        }
      } else {
        setSearchError("Lokasi tidak ditemukan. Klik peta untuk menentukan lokasi.")
      }
    } catch {
      setSearchError("Gagal mencari lokasi. Coba lagi.")
    } finally {
      setIsSearching(false)
    }
  }, [onCoordinatesChange, onAddressResolved])

  const handleManualSearch = useCallback(() => {
    if (manualQuery.trim().length >= 3) {
      searchLocation(manualQuery.trim() + ", Indonesia")
    }
  }, [manualQuery, searchLocation])

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: { "Accept-Language": "id" },
        }
      )

      if (!response.ok) return

      const data: NominatimResult = await response.json()
      setAddressInfo(data.display_name)
      setPostalCode(data.address?.postcode || null)
      onCoordinatesChange?.(lat, lng, data.display_name)

      if (data.address) {
        onAddressResolved?.({
          state: data.address.state,
          city: data.address.city || data.address.town,
          county: data.address.county,
          suburb: data.address.suburb,
          village: data.address.village,
        })
      }
    } catch {
    }
  }, [onCoordinatesChange, onAddressResolved])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng])
    setSearchError(null)
    reverseGeocode(lat, lng)
  }, [reverseGeocode])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    const parts = [specificLocation, districtName, cityName, provinceName].filter(Boolean)
    if (parts.length < 1) return

    const query = parts.join(", ") + ", Indonesia"

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(query)
    }, 800)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [provinceName, cityName, districtName, specificLocation, searchLocation])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-general-70">
          <MapPin className="w-4 h-4" />
          <span className="body-sm font-medium">Pratinjau Lokasi</span>
        </div>
        {isSearching && (
          <div className="flex items-center gap-2 text-blue-100">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Mencari...</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={manualQuery}
          onChange={(e) => setManualQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
          placeholder="Cari lokasi (contoh: SDN 1 Jakarta)"
          className="flex-1 px-3 py-2 text-sm border border-general-30 rounded-lg bg-white text-general-100 placeholder:text-general-40 focus:outline-none focus:ring-2 focus:ring-blue-100/50 focus:border-blue-100"
        />
        <button
          type="button"
          onClick={handleManualSearch}
          disabled={isSearching || manualQuery.trim().length < 3}
          className="px-3 py-2 bg-blue-100 text-white rounded-lg text-sm font-medium hover:bg-blue-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          Cari
        </button>
      </div>

      {/* Map */}
      <div className="relative rounded-lg overflow-hidden border border-general-30 h-[400px]">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={false}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={mapCenter} zoom={mapZoom} />
          <MapClickHandler onLocationSelect={handleMapClick} />
          {position && <Marker position={position} icon={markerIcon} />}
        </MapContainer>

        {/* Hint overlay */}
        {!position && !isSearching && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none">
            <div className="bg-general-20/90 px-3 py-2 rounded-lg shadow-sm">
              <p className="text-xs text-general-60 flex items-center gap-2">
                <Search className="w-3 h-3" />
                Isi lokasi atau klik peta
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Search error */}
      {searchError && (
        <div className="flex items-center gap-2 text-red-100">
          <AlertCircle className="w-4 h-4" />
          <p className="text-xs">{searchError}</p>
        </div>
      )}

      {/* Address info */}
      {addressInfo && (
        <div className="bg-general-30/30 rounded-lg p-3 space-y-2">
          <p className="text-xs text-general-70 line-clamp-2">{addressInfo}</p>
          {postalCode && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-general-80">Kode Pos:</span>
              <span className="text-xs text-blue-100 font-semibold">{postalCode}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const LocationMapPreview = memo(LocationMapPreviewComponent)
