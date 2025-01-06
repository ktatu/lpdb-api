import { Queue, Worker } from "bullmq"
import { MatchAPI } from "../liquipedia_database_api/MatchAPI"
import Match from "../mongodb/Match"
import connection from "../redis"
import { QueryParams } from "../types"

class JobQueue {
    private static queue: Queue
    private static worker: Worker
    private static initialized = false

    private constructor() {}

    static initialize() {
        if (this.initialized) {
            return
        }
        this.initialized = true

        this.initializeQueue()
        this.initializeWorker()
        this.createUpcomingMatchesJob()
    }

    private static initializeQueue() {
        this.queue = new Queue("match", { connection })
    }

    private static initializeWorker() {
        this.worker = new Worker(
            "match",
            async (job) => {
                switch (job.name) {
                    case "upcoming_matches":
                        console.log("upcoming matches")
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
    }

    private static async createUpcomingMatchesJob() {
        const jobId = "upcoming_matches"
        const CRON_PATTERN_EVERY_DAY = "1 * * * * *"
        // Deletion to ensure that the job never gets accidentally duplicated
        await this.queue.remove(jobId)

        this.queue.upsertJobScheduler(
            jobId,
            { pattern: CRON_PATTERN_EVERY_DAY, limit: 1 },
            {
                name: "upcoming_matches",
                data: {
                    params: {
                        conditions: [
                            "[[dateexact::1]]",
                            "[[date::>2024-01-01]]",
                            "[[date::<2026-01-01]]",
                        ],
                    },
                },
            }
        )
    }
}

export default JobQueue
