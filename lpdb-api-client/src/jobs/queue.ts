import { Queue, Worker } from "bullmq"
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from "../config"
import { MatchEndpoint } from "../liquipedia_database_api/MatchEndpoint"
import Match from "../mongodb/Match"

const CRON_PATTERN_EVERY_DAY = "* * 1 * * *"

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
    { name: "upcoming_matches" }
)

const worker = new Worker(
    "match",
    async (job) => {
        switch (job.name) {
            case "upcoming_matches":
                const matches = await MatchEndpoint.getUpcomingMatches()

                await Match.updateAndSaveMatches(matches)
                /*
                TODO HERE:
                new jobs need to be created for each match to check for updates
                job with children that are also update checks? (check bullmq docs)
                */
                break
            default:
                break
        }
    },
    { connection }
)
