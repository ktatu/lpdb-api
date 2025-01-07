import { Queue, Worker } from "bullmq"
import { MatchAPI } from "../liquipedia_database_api/MatchAPI"
//import Match from "../mongodb/Match"
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
        this.scheduleUpcomingMatchesJob()
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
                        let params = job.data.params as QueryParams
                        this.addDateParamsForMatchesTomorrow(params)

                        const matches = await MatchAPI.getMatches(params)
                        //await Match.updateAndSaveMatches(matches)

                        matches.forEach((match) =>
                            this.scheduleUpdateMatchJob(match.match2id, match.date)
                        )
                        break
                    case "update_match":
                        console.log("update match job ongoing")
                        break
                    default:
                        break
                }
            },
            { connection }
        )
    }

    private static async scheduleUpcomingMatchesJob() {
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
                        conditions: ["[[dateexact::1]]"],
                    },
                },
            }
        )
    }

    private static async scheduleUpdateMatchJob(match2id: string, date: Date) {
        console.log(date)
    }

    private static addDateParamsForMatchesTomorrow(params: QueryParams) {
        const oneDayInMilliseconds = 86400000
        const dateMin = new Date(Date.now() + oneDayInMilliseconds)
        const dateMax = new Date(Date.now() + oneDayInMilliseconds * 2)

        const minParam = `[[date::>${dateMin.toISOString()}]]`
        const maxParam = `[[date::<${dateMax.toISOString()}]]`

        params.conditions.push(minParam, maxParam)
    }
}

export default JobQueue
