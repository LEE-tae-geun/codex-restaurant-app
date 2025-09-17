import React, { useEffect, useRef, useState } from "react"

type Place = {
  id: number | string
  name: string
  category?: string
  address?: string
  lat?: number
  lng?: number
  phone?: string
}

export default function Home() {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<Place[]>([])
  const mapRef = useRef<HTMLDivElement | null>(null)
  const kakaoLoaded = useRef(false)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (!key) return

    // Load Kakao SDK dynamically
    const existing = document.getElementById("kakao-sdk")
    if (!existing) {
      const script = document.createElement("script")
      script.id = "kakao-sdk"
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`
      script.async = true
      document.head.appendChild(script)

      script.onload = () => {
        kakaoLoaded.current = true
        // initialize map when first loaded
        initMap()
      }
    } else {
      kakaoLoaded.current = true
      initMap()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function initMap() {
    const key = (process.env.NEXT_PUBLIC_KAKAO_JS_KEY as string) || ""
    if (!key || !mapRef.current) return
    // @ts-ignore
    const kakao = (window as any).kakao
    if (!kakao) return

    kakao.maps.load(() => {
      const container = mapRef.current as HTMLDivElement
      const options = { center: new kakao.maps.LatLng(37.5665, 126.978), level: 5 }
      const map = new kakao.maps.Map(container, options)
      ;(map as any).kakao = kakao
      // try to use geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords
          map.setCenter(new kakao.maps.LatLng(latitude, longitude))
        })
      }
    })
  }

  // update markers whenever results change
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (!key) return
    // @ts-ignore
    const kakao = (window as any).kakao
    if (!kakao) return
    const container = mapRef.current
    if (!container) return
    const map = kakao.maps.getMap(container)
    if (!map) return

    // clear old markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    results.forEach((p) => {
      if (!p.lat || !p.lng) return
      const marker = new kakao.maps.Marker({ position: new kakao.maps.LatLng(p.lat, p.lng) })
      marker.setMap(map)
      markersRef.current.push(marker)
    })
  }, [results])

  async function search(e?: React.FormEvent) {
    e?.preventDefault()
    const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(data.results || [])
  }

  async function makeReservation(place: Place) {
    const datetime = prompt("예약 날짜/시간을 ISO 형식으로 입력하세요 (예: 2025-09-16T19:00)")
    if (!datetime) return
    const partySizeStr = prompt("인원 수를 입력하세요", "2")
    const partySize = partySizeStr ? parseInt(partySizeStr, 10) : 2

    const body: any = { datetime, partySize }
    // if place has numeric id that matches our DB, send placeId; otherwise send externalId + data
    if (typeof place.id === "number") body.placeId = place.id
    else body.placeExternalId = String(place.id)
    body.place = { name: place.name, address: place.address, lat: place.lat, lng: place.lng, phone: place.phone }

    const resp = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
    if (resp.ok) alert("예약이 생성되었습니다.")
    else {
      const err = await resp.json()
      alert(`예약 실패: ${err.error || resp.statusText}`)
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>주변 맛집 찾아 예약하기</h1>
      <form onSubmit={search} style={{ marginBottom: 12 }}>
        <input
          placeholder="검색어 (예: 한식, 김밥)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: 8, width: 300 }}
        />
        <button style={{ marginLeft: 8, padding: "8px 12px" }} onClick={search}>
          검색
        </button>
      </form>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          {results.length === 0 ? (
            <p>검색 결과가 없습니다. 검색어를 입력하고 검색하세요.</p>
          ) : (
            <ul>
              {results.map((p) => (
                <li key={String(p.id)} style={{ marginBottom: 12 }}>
                  <strong>{p.name}</strong>{' '}
                  <span style={{ color: "#666" }}>{p.category}</span>
                  <div style={{ color: "#333" }}>{p.address}</div>
                  <div style={{ marginTop: 6 }}>
                    <button onClick={() => makeReservation(p)} style={{ marginRight: 8 }}>
                      예약하기
                    </button>
                    <a href={`/place/${p.id}`}>상세보기</a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ width: 480, height: 480, border: "1px solid #ddd" }} ref={mapRef} id="map" />
      </div>
    </div>
  )
}
