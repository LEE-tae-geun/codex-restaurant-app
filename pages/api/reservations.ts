import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "../../lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { userId, placeId, placeExternalId, place, datetime, partySize, notes } = req.body

    if (!datetime || !partySize) {
      res.status(400).json({ error: "datetime and partySize required" })
      return
    }

    try {
      let finalPlaceId: number | null = null

      if (placeId) {
        finalPlaceId = Number(placeId)
      } else if (placeExternalId) {
        // find or create Place by externalId
        let found = await prisma.place.findUnique({ where: { externalId: String(placeExternalId) } })
        if (!found) {
          found = await prisma.place.create({
            data: {
              externalId: String(placeExternalId),
              name: place?.name ?? "Unknown",
              address: place?.address ?? "",
              lat: place?.lat ?? 0,
              lng: place?.lng ?? 0,
              phone: place?.phone ?? null
            }
          })
        }
        finalPlaceId = found.id
      } else {
        res.status(400).json({ error: "placeId or placeExternalId required" })
        return
      }

      const dt = new Date(datetime)
      const reservation = await prisma.reservation.create({
        data: {
          userId: userId ?? undefined,
          placeId: finalPlaceId,
          datetime: dt,
          partySize,
          notes
        }
      })

      res.status(201).json({ reservation })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: "failed to create reservation" })
    }
    return
  }

  // GET: list recent reservations (basic)
  if (req.method === "GET") {
    try {
      const items = await prisma.reservation.findMany({ take: 50 })
      res.status(200).json({ items })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: "failed to list reservations" })
    }
    return
  }

  res.setHeader("Allow", ["GET", "POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
