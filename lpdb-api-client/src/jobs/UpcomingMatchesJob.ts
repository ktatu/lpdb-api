import { Job, Queue } from "bullmq"
import { SUPPORTED_WIKIS } from "../config"
import MatchAPI from "../liquipedia_database_api/MatchAPI"
import Match from "../mongodb/Match"
import { IMatch, QueryParams } from "../types"
import { parseUpcomingMatches } from "./parser"

// Periodically querying the LPDB API for upcoming matches
class UpcomingMatchesJob {
    static readonly NAME = "upcoming_matches"
    private static readonly JOB_RECURRENCE_CRON_PATTERN = "1 * * * * *"
    private static readonly PARAMS: QueryParams = {
        wiki: SUPPORTED_WIKIS,
        conditions: ["[[namespace::0]]", "[[dateexact::1]]"],
        datapoints: ["match2id", "date", "tournament", "liquipediatier"],
        limit: 1000,
    }

    private static queue: Queue

    private constructor() {}

    static initialize(queue: Queue) {
        this.queue = queue
        this.enqueueUpcomingMatchesJob()
    }

    static async execute() {
        const params = structuredClone(this.PARAMS)
        this.addDateParamsForMatchesTomorrow(params)

        const rawMatchesData = await MatchAPI.getData(params)
        const matches = parseUpcomingMatches(rawMatchesData)

        await Match.updateAndSaveMatches(matches)

        this.enqueueMatchUpdateJobs(matches)
    }

    private static enqueueMatchUpdateJobs(matches: Array<IMatch>) {
        const jobs = matches.map((match) => {
            const delay = this.calculateUpdateMatchJobDelay(match.date)
            const jobData = { wiki: match.wiki, match2id: match.match2id, date: match.date }

            return new Job(this.queue, "update_match", jobData, {
                delay,
            })
        })

        this.queue.addBulk(jobs)
    }

    private static calculateUpdateMatchJobDelay(date: Date) {
        const oneHourInMilliseconds = 3600000
        const oneHourBeforeMatchStart = date.getTime() - oneHourInMilliseconds
        const delay = oneHourBeforeMatchStart - Date.now()

        return delay
    }

    private static addDateParamsForMatchesTomorrow(params: QueryParams) {
        const oneDayInMilliseconds = 86400000
        const dateMin = new Date(Date.now() + oneDayInMilliseconds)
        const dateMax = new Date(Date.now() + oneDayInMilliseconds * 2)

        const minParam = `[[date::>${dateMin.toISOString()}]]`
        const maxParam = `[[date::<${dateMax.toISOString()}]]`

        params.conditions.push(minParam, maxParam)
    }

    private static async enqueueUpcomingMatchesJob() {
        // this can happen if app crashes
        if (await this.jobIsInQueue()) {
            return
        }

        this.queue.upsertJobScheduler(
            this.NAME,
            { pattern: this.JOB_RECURRENCE_CRON_PATTERN },
            {
                name: this.NAME,
            }
        )
    }

    private static async jobIsInQueue() {
        return Boolean(await this.queue.getJob(this.NAME))
    }
}

export default UpcomingMatchesJob
