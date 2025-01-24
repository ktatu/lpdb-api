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
            liquipediatier: z.string(),
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
            liquipediatier: z.string(),
            match2opponents: z.array(
                z.object({
                    name: z.string(),
                    match2players: z
                        .array(z.object({ displayname: z.string() }))
                        .transform((players) => players.map((player) => player.displayname)),
                })
            ),
            stream: z.object({ twitch_en_1: z.string() }).transform((stream) => {
                return stream.twitch_en_1
            }),
        })
    )

    const matchArray = schema.parse(data)

    return matchArray[0] || undefined
}

export const parsePlayerStreams = (data: unknown) => {
    console.log("DATA IN PARSE PLAYER STREAMS ", data)
    const schema = z.array(
        z.object({
            id: z.string(),
            links: z
                // because API returns an empty array for links when the queried player has none
                .array(z.string())
                .transform((emptyArray) => {
                    return ""
                })
                .or(
                    z.object({ twitch: z.string() }).transform((links) => {
                        return links.twitch
                    })
                ),
        })
    )

    const parsedPlayers = schema.parse(data)
    const withRenamedKey = parsedPlayers.map((player) => {
        return { id: player.id, twitch: player.links }
    })

    return withRenamedKey
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

export const parsePlayerStreamsJobData = (data: unknown) => {
    const schema = z.object({
        wiki: z.string(),
        teams: z.array(z.object({ name: z.string(), match2players: z.array(z.string()) })),
        match2id: z.string(),
    })

    return schema.parse(data)
}

export const parseMatchStatusesData = (data: unknown) => {
    const schema = z.array(
        z.object({
            match2id: z.string(),
        })
    )

    const parsed = schema.parse(data)
    return parsed.map((parsed) => parsed.match2id)
}
