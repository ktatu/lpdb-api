import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"
import { REDIS_CONNECTION_URL } from "../config"
import { Team } from "../types"
import MatchUpdateJob from "./MatchUpdateJob"
import PlayerStreamsJob from "./PlayerStreamsJob"
import UpcomingMatchesJob from "./UpcomingMatchesJob"

// bullmq throws an error if maxRetriesPerRequest != null
const redis = new IORedis(REDIS_CONNECTION_URL, { maxRetriesPerRequest: null })

class JobQueue {
    private static readonly JOB_HANDLERS = [MatchUpdateJob, UpcomingMatchesJob, PlayerStreamsJob]
    private static readonly MATCH_LIVE_JOB_NAME = "match_live"
    private static readonly UPCOMING_MATCHES_CRON_PATTERN = "24 * * * * *"
    private static readonly QUEUE_NAME = "queue"

    private static queue: Queue
    private static initialized = false

    private constructor() {}

    static initialize() {
        if (this.initialized) {
            return
        }
        this.initialized = true

        this.initializeQueue()
        this.initializeWorker()
        this.JOB_HANDLERS.forEach((handler) => handler.initialize())
        // might need changes if not checking for upcoming matches job before adding it causes problems
        this.enqueueUpcomingMatchesJob()
    }

    private static initializeQueue() {
        this.queue = new Queue(this.QUEUE_NAME, {
            connection: redis,
            defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
        })
    }

    private static initializeWorker() {
        new Worker(
            this.QUEUE_NAME,
            async (job) => {
                switch (job.name) {
                    case UpcomingMatchesJob.NAME:
                        try {
                            const matches = await UpcomingMatchesJob.execute()
                            matches.forEach((match) => {
                                this.enqueueMatchUpdateJob(match.match2id, match.wiki, match.date)
                            })
                            console.log("asd")
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
                                this.enqueueMatchLiveJob(
                                    match.match2id,
                                    match.pagename,
                                    match.wiki,
                                    match.date
                                )
                            }
                        } catch (error) {
                            console.error("Unable to execute job: ", MatchUpdateJob.NAME)
                            console.error(error)
                        }
                        break

                    case PlayerStreamsJob.NAME:
                        try {
                            await PlayerStreamsJob.execute(job)
                        } catch (error) {
                            console.error("Unable to execute job: ", PlayerStreamsJob.NAME)
                            console.error(error)
                        }
                        break

                    case this.MATCH_LIVE_JOB_NAME:
                        try {
                            //LiveTourneyTracker.addMatch()
                        } catch (error) {
                            console.error("Unable to execute job: ", this.MATCH_LIVE_JOB_NAME)
                            console.error(error)
                        }
                        break

                    default:
                        console.error(`Job with no matching job class: ${job.name}`)
                        break
                }
            },
            { connection: redis, concurrency: 100 }
        )
    }

    static enqueueMatchLiveUpdateJob() {}

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

    private static enqueueMatchLiveJob(
        match2id: string,
        pagename: string,
        wiki: string,
        date: Date
    ) {
        const delay = this.calculateMatchLiveJobDelay(date)

        this.queue.add(this.MATCH_LIVE_JOB_NAME, { match2id, pagename, wiki }, { delay })
    }

    private static calculateMatchLiveJobDelay(date: Date) {
        return date.getTime() - Date.now()
    }
}

export default JobQueue
