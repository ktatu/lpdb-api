import { z } from "zod"

const parseUpcomingMatches = (data: unknown) => {
    const matchSchema = z.array(
        z.object({
            wiki: z.string(),
            pagename: z.string(),
            match2id: z.string(),
            date: z.string().transform((dateStr) => {
                // dates from api arrive as strings in the format (UTC 0): 2025-02-10 23:30:00
                // needs to be converted into ISO 8601 format: 2025-02-10T23:30:00Z for Date object
                dateStr.replace(" ", "T").concat("Z")
                return new Date(dateStr)
            }),
            tournament: z.string(),
            liquipediatier: z.number(),
        })
    )

    return matchSchema.parse(data)
}

export { parseUpcomingMatches }
