import { Queue, Worker } from "bullmq"
import connection from "../redis"
import MatchUpdateJob from "./MatchUpdateJob"
import PlayerStreamsJob from "./PlayerStreamsJob"
import UpcomingMatchesJob from "./UpcomingMatchesJob"

class JobQueue {
    private static readonly JOBS = [MatchUpdateJob, UpcomingMatchesJob, PlayerStreamsJob]

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
        this.JOBS.forEach((job) => job.initialize(this.queue))
    }

    private static initializeQueue() {
        this.queue = new Queue("match", {
            connection,
            defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
        })
    }

    private static initializeWorker() {
        this.worker = new Worker(
            "match",
            async (job) => {
                switch (job.name) {
                    case UpcomingMatchesJob.NAME:
                        try {
                            console.log("upcoming matches ", new Date().toISOString())
                            await UpcomingMatchesJob.execute()
                        } catch (error) {
                            console.error("Unable to execute job: ", UpcomingMatchesJob.NAME)
                            console.error(error)
                        }
                        break
                    case MatchUpdateJob.NAME:
                        try {
                            console.log("Match update ", new Date().toISOString())
                            await MatchUpdateJob.execute(job)
                        } catch (error) {
                            console.error("Unable to execute job: ", MatchUpdateJob.NAME)
                            console.error(error)
                        }
                        break
                    case PlayerStreamsJob.NAME:
                        try {
                            console.log("Player streams ", new Date().toISOString())
                            await PlayerStreamsJob.execute(job)
                        } catch (error) {
                            console.error("Unable to execute job: ", PlayerStreamsJob.NAME)
                            console.error(error)
                        }
                        break
                    case "live_update":
                        // enqueued in MatchUpdate, delay to match start.
                        // Start accepting webhook data related to match in live update job data
                        console.log("live update")
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
