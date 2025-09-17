import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"

type Place = {
  id: number
  name: string
  address?: string
  lat?: number
  lng?: number
  phone?: string
}

export default function PlacePage() {
  const router = useRouter()
  const { id } = router.query
  const [place, setPlace] = useState<Place | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [datetime, setDatetime] = useState("")
  const [partySize, setPartySize] = useState(2)

  useEffect(() => {
    if (!id) return
    fetch(`/api/place/${id}`)
      .then((r) => r.json())
      .then((data) => setPlace(data.place))
      .catch((err) => console.error(err))
  }, [id])

  async function reserve() {
    if (!place) return
    const resp = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: place.id, datetime, partySize })
    })
    if (resp.ok) {
      alert("예약 성공")
      setShowModal(false)
    } else {
      const err = await resp.json().catch(() => ({}))
      alert(`예약 실패: ${err.error || resp.statusText}`)
    }
  }

  if (!place) return <div style={{ padding: 24 }}>로딩 중…</div>

  return (
    <div style={{ padding: 24 }} className="container">
      <div className="card">
        <div style={{ display: "flex", gap: 16 }}>
          <img src={`https://source.unsplash.com/featured/?${encodeURIComponent(place.name)}`} style={{ width: 240, height: 160, borderRadius: 8, objectFit: "cover" }} />
          <div>
            <h2 style={{ margin: 0 }}>{place.name}</h2>
            <div className="muted" style={{ marginTop: 6 }}>{place.address}</div>
            <div className="muted" style={{ marginTop: 6 }}>전화: {place.phone}</div>

            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => setShowModal(true)} style={{ background: "var(--accent)", color: "#fff" }}>
                예약하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modalBackdrop">
          <div className="modal">
            <h3>예약 — {place.name}</h3>
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
              <button className="btn secondary" onClick={() => setShowModal(false)}>취소</button>
              <button className="btn" onClick={reserve} style={{ background: "var(--accent)", color: "#fff" }}>예약하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

