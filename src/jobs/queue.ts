// should queue be in match endpoint?
import { Queue, Worker } from "bullmq"
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from "../config"
import { MatchEndpoint } from "../liquipedia_database_api/MatchEndpoint"

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
    { pattern: "* 1 0 * * *" },
    { name: "upcoming_matches" }
)

const worker = new Worker(
    "match",
    async (job) => {
        switch (job.name) {
            case "upcoming_matches":
                MatchEndpoint.getUpcomingMatches()
                break
            default:
                break
        }
    },
    { connection }
)
