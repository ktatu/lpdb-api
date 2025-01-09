import { Job, Queue } from "bullmq"
import API, { APIName } from "../liquipedia_database_api/API"
import Match from "../mongodb/Match"
import { QueryParams, Team } from "../types"
import { parseMatchUpdate, parseUpdateMatchJobData } from "./parser"

// Querying a specific match from LPDB API to get more datapoints / updated datapoints
class MatchUpdateJob {
    static readonly NAME = "match_update"
    private static readonly PARAMS: QueryParams = {
        wiki: [],
        conditions: ["[[namespace::0]]", "[[stream::![]]]"],
        datapoints: [
            "match2id",
            "date",
            "tournament",
            "liquipediatier",
            "pagename",
            "match2opponents",
            "stream",
        ],
        limit: 1,
    }

    private static queue: Queue
    private static matchAPI: API

    private constructor() {}

    static initialize(queue: Queue) {
        this.queue = queue
        this.matchAPI = API.getAPI(APIName.MATCH)
    }

    static async execute(job: Job) {
        const { match2id, date, wiki } = parseUpdateMatchJobData(job.data)
        const params = this.getParams(match2id, wiki)

        const rawMatchData = await this.matchAPI.getData(params)

        /*
        response can be empty if param condition [[stream::![]]] is not met
        match has no streams -> it should not be displayed in the app
        */
        if (!rawMatchData || this.matchIsOld(date)) {
            await Match.deleteOne({ match2id: match2id })
            return
        }

        const match = parseMatchUpdate(rawMatchData)

        if (this.matchIsDelayed(date, match.date)) {
            this.enqueueMatchUpdateJob(match.match2id, match.wiki, match.date)
        } else {
            await Match.findOneAndUpdate({ match2id: match.match2id }, match)
            this.enqueuePlayerStreamsJob(match.match2opponents, match.wiki)
        }
    }

    private static getParams(match2id: string, wiki: string) {
        const params = structuredClone(this.PARAMS)

        params.wiki.push(wiki)
        params.conditions.push(`[[match2id::${match2id}]]`)

        return params
    }

    // checking if an old match (=likely already over) is being processed for whatever reason
    private static matchIsOld(matchDate: Date) {
        return Date.now() > matchDate.getTime()
    }

    private static matchIsDelayed(dateFromJobData: Date, dateFromAPI: Date) {
        // if the match is delayed by an hour or less then match data probably won't change again
        const oneHourInMilliseconds = 3600000
        return dateFromJobData.getTime() + oneHourInMilliseconds <= dateFromAPI.getTime()
    }

    private static enqueueMatchUpdateJob(match2id: string, wiki: string, date: Date) {
        const delay = this.calculateMatchUpdateJobDelay(date)
        const jobData = { match2id, wiki, date }

        this.queue.add(this.NAME, jobData, {
            delay,
        })
    }

    private static calculateMatchUpdateJobDelay(date: Date) {
        const oneHourInMilliseconds = 3600000
        const oneHourBeforeMatchStart = date.getTime() - oneHourInMilliseconds
        const delay = oneHourBeforeMatchStart - Date.now()

        return delay
    }

    private static enqueuePlayerStreamsJob(teams: Array<Team>, wiki: string) {
        this.queue.add("player_streams", { teams, wiki })
    }
}

export default MatchUpdateJob
