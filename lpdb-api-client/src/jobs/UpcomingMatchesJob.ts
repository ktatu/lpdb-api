import { Job, Queue } from "bullmq"
import { SUPPORTED_WIKIS } from "../config"
import API, { APIName } from "../liquipedia_database_api/API"
import Match from "../mongodb/Match"
import { IMatch, QueryParams } from "../types"
import { parseUpcomingMatches } from "./parser"

// Periodically querying the LPDB API for upcoming matches
class UpcomingMatchesJob {
    static readonly NAME = "upcoming_matches"
    private static readonly JOB_RECURRENCE_CRON_PATTERN = "0 0 0 * * *"
    private static readonly PARAMS: QueryParams = {
        wiki: SUPPORTED_WIKIS,
        conditions: ["[[namespace::0]]", "[[dateexact::1]]"],
        datapoints: ["match2id", "date", "tournament", "liquipediatier"],
        limit: 100,
    }

    private static queue: Queue
    private static matchAPI: API

    private constructor() {}

    static initialize(queue: Queue) {
        this.queue = queue
        this.matchAPI = API.getAPI(APIName.MATCH)

        this.enqueueUpcomingMatchesJob()
    }

    static async execute() {
        const params = structuredClone(this.PARAMS)
        this.addDateParamsForMatches(params)

        const rawMatchesData = await this.matchAPI.getData(params)

        const matches = parseUpcomingMatches(rawMatchesData)

        await Match.updateAndSaveMatches(matches)

        this.enqueueMatchUpdateJobs(matches)
    }

    private static enqueueMatchUpdateJobs(matches: Array<IMatch>) {
        const jobs = matches.map((match) => {
            const delay = this.calculateUpdateMatchJobDelay(match.date)
            const jobData = { wiki: match.wiki, match2id: match.match2id, date: match.date }

            return new Job(this.queue, "match_update", jobData, {
                delay,
            })
        })

        this.queue.addBulk(jobs)
    }

    private static calculateUpdateMatchJobDelay(date: Date) {
        const oneHourInMilliseconds = 3600000
        const oneHourBeforeMatchStart = date.getTime() - oneHourInMilliseconds
        const delay = oneHourBeforeMatchStart - Date.now()
        console.log(`match delay (minutes): ${delay / 60000}, `)

        return delay
    }

    // currently set to find matches for day after tomorrow
    private static addDateParamsForMatches(params: QueryParams) {
        const oneDayInMilliseconds = 86400000
        /*
        const dateMin = new Date(Date.now() + oneDayInMilliseconds * 2)
        const dateMax = new Date(Date.now() + oneDayInMilliseconds * 3)
        */
        const dateMin = new Date(Date.now())
        const dateMax = new Date(Date.now() + oneDayInMilliseconds)

        const minParam = `[[date::>${dateMin.toISOString()}]]`
        const maxParam = `[[date::<${dateMax.toISOString()}]]`
        console.log("date min ", minParam)
        console.log("date max ", maxParam)

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
