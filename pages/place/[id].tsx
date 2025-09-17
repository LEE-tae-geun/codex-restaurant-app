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

  useEffect(() => {
    if (!id) return
    fetch(`/api/place/${id}`)
      .then((r) => r.json())
      .then((data) => setPlace(data.place))
      .catch((err) => console.error(err))
  }, [id])

  async function reserve() {
    const datetime = prompt("예약 날짜/시간을 ISO 형식으로 입력하세요 (예: 2025-09-16T19:00)")
    if (!datetime) return
    const partySizeStr = prompt("인원 수를 입력하세요", "2")
    const partySize = partySizeStr ? parseInt(partySizeStr, 10) : 2

    const resp = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: place?.id, datetime, partySize })
    })
    if (resp.ok) alert("예약이 생성되었습니다.")
    else {
      const err = await resp.json()
      alert(`예약 실패: ${err.error || resp.statusText}`)
    }
  }

  if (!place) return <div style={{ padding: 24 }}>로딩 중...</div>

  return (
    <div style={{ padding: 24 }}>
      <h1>{place.name}</h1>
      <div>{place.address}</div>
      <div>전화: {place.phone}</div>
      <div style={{ marginTop: 12 }}>
        <button onClick={reserve}>예약하기</button>
      </div>
    </div>
  )
}

