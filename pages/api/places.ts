import type { NextApiRequest, NextApiResponse } from "next"

// Place search endpoint: uses Kakao Local API when `KAKAO_REST_API_KEY` is set,
// otherwise returns a small mock dataset for local development.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q, lat, lng } = req.query

  const sample = [
    {
      id: 1,
      name: "맛있는 김치찌개",
      category: "한식",
      address: "서울시 강남구 역삼동 123-4",
      lat: 37.4979,
      lng: 127.0276,
      phone: "02-000-0000"
    },
    {
      id: 2,
      name: "통큰 떡볶이",
      category: "분식",
      address: "서울시 마포구 연남동 45-6",
      lat: 37.5563,
      lng: 126.9227,
      phone: "02-111-1111"
    },
    {
      id: 3,
      name: "바삭 치킨",
      category: "치킨",
      address: "서울시 송파구 잠실동 77-1",
      lat: 37.5145,
      lng: 127.1054,
      phone: "02-222-2222"
    },
    {
      id: 4,
      name: "초밥 스타",
      category: "일식",
      address: "서울시 종로구 관철동 10-2",
      lat: 37.5715,
      lng: 126.9812,
      phone: "02-333-3333"
    },
    {
      id: 5,
      name: "그릴 스테이크",
      category: "양식",
      address: "서울시 용산구 이태원동 34-5",
      lat: 37.5347,
      lng: 126.9940,
      phone: "02-444-4444"
    }
  ]

  const kakaoKey = process.env.KAKAO_REST_API_KEY

  if (kakaoKey && typeof q === "string" && q.trim().length > 0) {
    try {
      // Kakao expects x=longitude, y=latitude. Provide coordinates if available to bias results.
      const params = new URLSearchParams({ query: q })
      if (typeof lng === "string" && typeof lat === "string") {
        params.set("x", lng)
        params.set("y", lat)
      }

      const url = `https://dapi.kakao.com/v2/local/search/keyword.json?${params.toString()}`
      const resp = await fetch(url, { headers: { Authorization: `KakaoAK ${kakaoKey}` } })
      if (!resp.ok) {
        console.error("Kakao places API error", resp.status)
        // fall through to mock
      } else {
        const json = await resp.json()
        const results = (json.documents || []).map((d: any, idx: number) => ({
          id: d.id ?? `${d.place_name}-${idx}`,
          name: d.place_name,
          category: d.category_name ?? "",
          address: d.address_name ?? d.road_address_name ?? "",
          lat: parseFloat(d.y),
          lng: parseFloat(d.x),
          phone: d.phone ?? ""
        }))

        res.status(200).json({ results, source: "kakao", query: { q, lat, lng } })
        return
      }
    } catch (err) {
      console.error("Kakao fetch failed", err)
      // fall back to sample
    }
  }

  // Simple filter by q if provided
  const qStr = typeof q === "string" ? q.toLowerCase().trim() : ""

  // If there's a query, split it into tokens and match any token against name/category/address/phone
  let results = sample
  if (qStr.length > 0) {
    const tokens = qStr.split(/\s+/).filter(Boolean)
    results = sample.filter((p) => {
      const hay = `${p.name} ${p.category} ${p.address} ${p.phone}`.toLowerCase()
      return tokens.every((t) => hay.includes(t))
    })
  }

  res.status(200).json({ results, source: "mock", query: { q, lat, lng } })
}

