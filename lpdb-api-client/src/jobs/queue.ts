import { Queue, Worker } from "bullmq"
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from "../config"
import { MatchAPI } from "../liquipedia_database_api/MatchAPI"
import Match from "../mongodb/Match"
import { QueryParams } from "../types"

const CRON_PATTERN_EVERY_DAY = "1 * * * * *"

const connection = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
}

const queue = new Queue("match", {
    connection,
})

queue.upsertJobScheduler(
    "upcoming_matches",
    { pattern: CRON_PATTERN_EVERY_DAY },
    {
        name: "upcoming_matches",
        data: { params: { conditions: ["[[date::>2024-01-01]]", "[[date::<2026-01-01]]"] } },
    }
) //conditions: ["[[date::>2024-01-01]]", "[[date::<2026-01-01]]"]

const worker = new Worker(
    "match",
    async (job) => {
        switch (job.name) {
            case "upcoming_matches":
                const params = job.data.params as QueryParams
                const matches = await MatchAPI.getMatches(params)

                await Match.updateAndSaveMatches(matches)
                /*
                TODO HERE:
                new jobs need to be created for each match to check for updates
                job with children that are also update checks? (check bullmq docs)
                */
                break
            case "update_match":
                break
            default:
                break
        }
    },
    { connection }
)
