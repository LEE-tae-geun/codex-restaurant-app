import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "../../../lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  if (!id) {
    res.status(400).json({ error: "id required" })
    return
  }

  try {
    const place = await prisma.place.findUnique({ where: { id: Number(id) } })
    if (!place) {
      res.status(404).json({ error: "not found" })
      return
    }
    res.status(200).json({ place })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "failed to fetch place" })
  }
}

