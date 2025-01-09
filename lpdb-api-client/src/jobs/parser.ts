import { z } from "zod"

export const parseUpcomingMatches = (data: unknown) => {
    const schema = z.array(
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

    return schema.parse(data)
}

export const parseMatchUpdate = (data: unknown) => {
    const schema = z.array(
        z.object({
            wiki: z.string(),
            pagename: z.string(),
            match2id: z.string(),
            date: z.string().transform((dateStr) => {
                dateStr.replace(" ", "T").concat("Z")
                return new Date(dateStr)
            }),
            tournament: z.string(),
            liquipediatier: z.number(),
            match2opponents: z.array(
                z.object({
                    name: z.string(),
                    match2players: z
                        .array(z.object({ name: z.string() }))
                        .transform((players) => players.map((player) => player.name)),
                })
            ),
            stream: z.object({ twitch_en_1: z.string() }).transform((stream) => {
                return stream.twitch_en_1
            }),
        })
    )

    const matchArray = schema.parse(data)

    // should never happen because MatchUpdate has param condition of limiting num of results to 1
    if (matchArray.length > 1) {
        throw new Error(
            `Parse match update: unexpected number of matches. Expected 1, was: ${matchArray.length}`
        )
    }

    // empty array is checked for in MatchUpdateJob
    return matchArray[0] || []
}

export const parseUpdateMatchJobData = (data: unknown) => {
    const schema = z.object({
        wiki: z.string(),
        match2id: z.string(),
        date: z.string().transform((dateStr) => {
            dateStr.replace(" ", "T").concat("Z")
            return new Date(dateStr)
        }),
    })

    return schema.parse(data)
}
