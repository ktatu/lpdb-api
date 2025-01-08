import { Job, Queue } from "bullmq"
import MatchAPI from "../liquipedia_database_api/MatchAPI"
import { QueryParams } from "../types"

class UpcomingMatchesJob {
    private static NAME = "upcoming_matches"
    private static JOB_RECURRENCE_CRON_PATTERN = "1 * * * * *"
    /* TODO: this replaces using params in MatchAPI
    private static DEFAULT_PARAMS: QueryParams = {
        wiki: SUPPORTED_WIKIS,
        conditions: ["[[namespace::0]]", "[[dateexact::1]]"],
        datapoints: ["match2id", "date", "tournament", "pagename"],
        limit: 1000,
    }
    */

    private static queue: Queue

    private constructor() {}

    static initialize(queue: Queue) {
        this.queue = queue
        this.enqueue()
    }

    static async execute(job: Job) {
        let upcomingParams: QueryParams = { conditions: ["[[dateexact::1]]"] } as QueryParams
        this.addDateParamsForMatchesTomorrow(upcomingParams)

        const matches = await MatchAPI.getMatches(upcomingParams)
        //await Match.updateAndSaveMatches(matches)

        matches.forEach((match) => this.scheduleUpdateMatchJob(match.match2id, match.date))
    }

    private static scheduleUpdateMatchJob(match2id: string, date: Date) {
        /*
        const delay = this.calculateUpdateMatchJobDelay(date)

        this.queue.add(
            "update_match",
            { match2id, params: { conditions: ["[[stream::![]]]"] } },
            { jobId: match2id, delay }
        )
        */
        console.log("schedule update")
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
                name: "upcoming_matches",
                opts: { removeOnComplete: true, removeOnFail: true },
            }
        )
    }

    private static async jobIsInQueue() {
        return Boolean(await this.queue.getJob(this.NAME))
    }
}

export default UpcomingMatchesJob
