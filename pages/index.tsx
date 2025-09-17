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

const imageMap: Record<number, string> = {
  1: '김치찌개.jpg',
  2: '떡볶이.jpg',
  3: '스테이크.jpg',
  4: '초밥.jpg',
  5: '치킨.jpg'
}

function getImageForPlace(p: Place) {
  if (typeof p.id === 'number' && imageMap[p.id]) return `/image/${imageMap[p.id]}`
  return `https://source.unsplash.com/featured/?${encodeURIComponent(p.name)}`
}

function ReservationModal({ place, onClose }: { place: Place | null; onClose: () => void }) {
  const [datetime, setDatetime] = useState<string>("")
  const [partySize, setPartySize] = useState<number>(2)

  if (!place) return null

  async function submit() {
    const body: any = { datetime, partySize }
    if (typeof place.id === "number") body.placeId = place.id
    else body.placeExternalId = String(place.id)
    body.place = { name: place.name, address: place.address, lat: place.lat, lng: place.lng, phone: place.phone }

    const resp = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
    if (resp.ok) {
      alert("예약이 성공했습니다")
      onClose()
    } else {
      const err = await resp.json().catch(() => ({}))
      alert(`예약 실패: ${err.error || resp.statusText}`)
    }
  }

  return (
    <div className="modalBackdrop">
      <div className="modal">
        <h3>예약 — {place.name}</h3>
        <div className="muted">주소: {place.address}</div>

        <div className="formRow">
          <input value={datetime} onChange={(e) => setDatetime(e.target.value)} placeholder="예: 2025-09-16T19:00" />
          <select value={String(partySize)} onChange={(e) => setPartySize(parseInt(e.target.value, 10))}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="6">6</option>
          </select>
        </div>

        <div className="modalActions">
          <button className="btn secondary" onClick={onClose}>
            취소
          </button>
          <button className="btn" onClick={submit} style={{ background: "var(--accent)", color: "#fff" }}>
            예약하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<Place[]>([])
  const [recommended, setRecommended] = useState<Place[]>([])
  const mapRef = useRef<HTMLDivElement | null>(null)
  const kakaoLoaded = useRef(false)
  const markersRef = useRef<any[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)

  useEffect(() => {
    // Load recommended places on first render
    ;(async () => {
      try {
        const resp = await fetch('/api/places')
        const json = await resp.json()
        const rec = json.results || []
        setRecommended(rec.slice(0, 4))
        // show recommended as initial results so the first screen isn't empty
        setResults(rec)
      } catch (err) {
        console.error('Failed to load recommended', err)
      }
    })()
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (!key) return

    const existing = document.getElementById("kakao-sdk")
    if (!existing) {
      const script = document.createElement("script")
      script.id = "kakao-sdk"
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`
      script.async = true
      document.head.appendChild(script)

      script.onload = () => {
        kakaoLoaded.current = true
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
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords
          map.setCenter(new kakao.maps.LatLng(latitude, longitude))
        })
      }
    })
  }

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

  const categories = Array.from(new Set(results.map((r) => r.category).filter(Boolean))) as string[]

  return (
    <div className="container">
      <div className="header">
        <div className="brand">예약앱</div>
        <div className="searchRow">
          <form onSubmit={search}>
            <input className="searchInput" placeholder="음식/매장 검색 (예: 김치찌개)" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <button className="searchBtn" onClick={(e) => search(e as any)}>
            검색
          </button>
        </div>
      </div>

      <div className="layout">
        <div className="left">
          <div className="card">
            <div style={{ fontWeight: 700 }}>추천 식당</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 10, overflowX: 'auto' }}>
              {recommended.map((p) => (
                <div key={String(p.id)} style={{ minWidth: 180 }}>
                  <a href={`/place/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }} src={getImageForPlace(p)} alt={p.name} />
                    <div style={{ marginTop: 6, fontWeight: 600 }}>{p.name}</div>
                    <div className="muted">{p.category}</div>
                  </a>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700 }}>검색 결과</div>
              <div className="muted">{results.length}곳</div>
            </div>

            <div className="chips" style={{ marginTop: 10 }}>
              {categories.map((c) => (
                <div key={c} className="chip">
                  {c}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }} className="placeList">
              {results.length === 0 ? (
                <div className="muted">검색 결과가 없습니다. 검색어를 입력해보세요.</div>
              ) : (
                results.map((p) => (
                  <div key={String(p.id)} className="placeRow">
                    <img className="placeImg" src={getImageForPlace(p)} alt={p.name} />
                    <div className="placeInfo">
                      <div className="placeName">{p.name}</div>
                      <div className="muted">{p.category}</div>
                      <div style={{ marginTop: 6 }} className="muted">{p.address}</div>
                      <div className="actions">
                        <button className="btn" onClick={() => setSelectedPlace(p)} style={{ background: "#111", color: "#fff" }}>
                          예약하기
                        </button>
                        <a className="btn secondary" href={`/place/${p.id}`}>
                          상세보기
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="right">
          <div className="card mapBox" ref={mapRef} id="map" />
        </div>
      </div>

      {selectedPlace && <ReservationModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />}
    </div>
  )
}
