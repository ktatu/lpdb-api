import { Queue, Worker } from "bullmq"
import connection from "../redis"
import { QueryParams } from "../types"
import UpcomingMatchesJob from "./UpcomingMatchesJob"

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
        UpcomingMatchesJob.initialize(this.queue)
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
                        try {
                            await UpcomingMatchesJob.execute()
                        } catch (error) {
                            console.error("Unable to execute job: upcoming_matches")
                            console.error(error)
                        }
                        break
                    case "update_match":
                        console.log("update match job ongoing")
                        let updateParams = job.data.params as QueryParams
                        // condition for querying matches that have streams: [[stream::![]]]
                        break
                    default:
                        break
                }
            },
            { connection }
        )
    }
}

export default JobQueue
