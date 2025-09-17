import type { NextApiRequest, NextApiResponse } from "next"

// Place search endpoint: uses Kakao Local API when `KAKAO_REST_API_KEY` is set,
// otherwise returns a small mock dataset for local development.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q, lat, lng } = req.query

  const sample = [
    {
      id: 1,
      name: "맛있는 김밥",
      category: "한식",
      address: "서울시 강남구",
      lat: 37.4979,
      lng: 127.0276,
      phone: "02-000-0000"
    },
    {
      id: 2,
      name: "전통 떡볶이",
      category: "분식",
      address: "서울시 마포구",
      lat: 37.5563,
      lng: 126.9227,
      phone: "02-111-1111"
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
  const qStr = typeof q === "string" ? q.toLowerCase() : ""
  const results = sample.filter((p) =>
    qStr ? p.name.toLowerCase().includes(qStr) || p.category.toLowerCase().includes(qStr) : true
  )

  res.status(200).json({ results, source: "mock", query: { q, lat, lng } })
}
