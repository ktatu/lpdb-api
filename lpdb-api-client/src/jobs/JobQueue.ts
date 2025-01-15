import { Queue, Worker } from "bullmq"
import connection from "../redis"
import { Team } from "../types"
import MatchUpdateJob from "./MatchUpdateJob"
import PlayerStreamsJob from "./PlayerStreamsJob"
import UpcomingMatchesJob from "./UpcomingMatchesJob"

class JobQueue {
    private static readonly JOBS = [MatchUpdateJob, UpcomingMatchesJob, PlayerStreamsJob]
    private static readonly UPCOMING_MATCHES_CRON_PATTERN = "0 0 0 * * *"

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
        this.JOBS.forEach((job) => job.initialize())
        // might need changes if not checking for upcoming matches job before adding it causes problems
        this.enqueueUpcomingMatchesJob()
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
                            const matches = await UpcomingMatchesJob.execute()
                            matches.forEach((match) => {
                                this.enqueueMatchUpdateJob(match.match2id, match.wiki, match.date)
                            })
                        } catch (error) {
                            console.error("Unable to execute job: ", UpcomingMatchesJob.NAME)
                            console.error(error)
                        }
                        break

                    case MatchUpdateJob.NAME:
                        try {
                            const { match, matchIsDelayed } = await MatchUpdateJob.execute(job)
                            if (!match) {
                                break
                            }

                            if (matchIsDelayed) {
                                this.enqueueMatchUpdateJob(match.match2id, match.wiki, match.date)
                            } else {
                                this.enqueuePlayerStreamsJob(
                                    match.match2opponents,
                                    match.wiki,
                                    match.match2id
                                )
                                // enqueue live status job
                            }
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
            { connection, concurrency: 100 }
        )
    }

    private static enqueueUpcomingMatchesJob() {
        this.queue.upsertJobScheduler(
            UpcomingMatchesJob.NAME,
            { pattern: this.UPCOMING_MATCHES_CRON_PATTERN },
            {
                name: UpcomingMatchesJob.NAME,
            }
        )
    }

    private static enqueueMatchUpdateJob(match2id: string, wiki: string, date: Date) {
        const delay = this.calculateMatchUpdateJobDelay(date)
        const jobData = { match2id, wiki, date }

        this.queue.add(MatchUpdateJob.NAME, jobData, {
            delay,
        })
    }

    private static calculateMatchUpdateJobDelay(date: Date) {
        const oneHourInMilliseconds = 3600000
        const oneHourBeforeMatchStart = date.getTime() - oneHourInMilliseconds
        const delay = oneHourBeforeMatchStart - Date.now()

        return delay
    }

    private static enqueuePlayerStreamsJob(teams: Array<Team>, wiki: string, match2id: string) {
        this.queue.add(PlayerStreamsJob.NAME, { teams, wiki, match2id })
    }
}

export default JobQueue
