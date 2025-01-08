import { Job, Queue } from "bullmq"
import { SUPPORTED_WIKIS } from "../config"
import MatchAPI from "../liquipedia_database_api/MatchAPI"
import Match from "../mongodb/Match"
import { IMatch, QueryParams } from "../types"
import { parseUpcomingMatches } from "./parser"

class UpcomingMatchesJob {
    private static NAME = "upcoming_matches"
    private static JOB_RECURRENCE_CRON_PATTERN = "1 * * * * *"
    private static DEFAULT_PARAMS: QueryParams = {
        wiki: SUPPORTED_WIKIS,
        conditions: ["[[namespace::0]]", "[[dateexact::1]]"],
        datapoints: ["match2id", "date", "stream", "tournament", "liquipediatier"],
        limit: 1000,
    }

    private static queue: Queue

    private constructor() {}

    static initialize(queue: Queue) {
        this.queue = queue
        this.enqueue()
    }

    static async execute() {
        const params = structuredClone(this.DEFAULT_PARAMS)
        this.addDateParamsForMatchesTomorrow(params)

        const rawMatchesData = await MatchAPI.getMatches(params)
        const matches = parseUpcomingMatches(rawMatchesData)

        await Match.updateAndSaveMatches(matches)

        this.enqueueMatchUpdates(matches)
    }

    private static enqueueMatchUpdates(matches: Array<IMatch>) {
        const jobs = matches.map((match) => {
            const delay = this.calculateUpdateMatchJobDelay(match.date)
            return new Job(this.queue, "update_match", match, {
                delay,
                removeOnComplete: true,
                removeOnFail: true,
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

    private static async enqueue() {
        // this can happen if app crashes
        if (await this.jobIsInQueue()) {
            return
        }

        this.queue.upsertJobScheduler(
            this.NAME,
            { pattern: this.JOB_RECURRENCE_CRON_PATTERN },
            {
                name: this.NAME,
                opts: { removeOnComplete: true, removeOnFail: true },
            }
        )
    }

    private static async jobIsInQueue() {
        return Boolean(await this.queue.getJob(this.NAME))
    }
}

export default UpcomingMatchesJob
