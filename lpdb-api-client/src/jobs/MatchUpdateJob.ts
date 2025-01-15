import { Job } from "bullmq"
import API, { APIName } from "../liquipedia_database_api/API"
import Match from "../mongodb/Match"
import { QueryParams } from "../types"
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

    private static matchAPI: API

    private constructor() {}

    static initialize() {
        this.matchAPI = API.getAPI(APIName.MATCH)
    }

    static async execute(job: Job) {
        const { match2id, date, wiki } = parseUpdateMatchJobData(job.data)
        const params = this.getParams(match2id, wiki)

        const rawMatchData = await this.matchAPI.getData(params)

        // rawMatchData can be empty if param condition [[stream::![]]] is not met
        if (rawMatchData.length === 0 || this.matchIsOld(date)) {
            await Match.deleteOne({ match2id: match2id })
            return { match: null, matchIsDelayed: null }
        }

        const match = parseMatchUpdate(rawMatchData)

        await Match.findOneAndUpdate({ match2id: match.match2id }, match)

        return { match, matchIsDelayed: this.matchIsDelayed(date, match.date) }
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
}

export default MatchUpdateJob
