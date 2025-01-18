import { SUPPORTED_WIKIS } from "../config"
import API, { APIName } from "../liquipedia_database_api/API"
import Match from "../mongodb/Match"
import { parseUpcomingMatches } from "../parser"
import { QueryParams } from "../types"

// Periodically querying the LPDB API for upcoming matches
class UpcomingMatchesJob {
    static readonly NAME = "upcoming_matches"
    private static readonly PARAMS: QueryParams = {
        wiki: SUPPORTED_WIKIS,
        conditions: ["[[namespace::0]]", "[[dateexact::1]]"],
        datapoints: ["match2id", "date", "tournament", "liquipediatier"],
        limit: 100,
    }

    private static matchAPI: API

    private constructor() {}

    static initialize() {
        this.matchAPI = API.getAPI(APIName.MATCH)
    }

    static async execute() {
        const params = structuredClone(this.PARAMS)
        this.addDateParamsForMatches(params)

        const rawMatchesData = await this.matchAPI.getData(params)

        const matches = parseUpcomingMatches(rawMatchesData)

        await Match.updateAndSaveMatches(matches)

        return matches
    }

    // currently set to find matches for day after tomorrow
    private static addDateParamsForMatches(params: QueryParams) {
        const oneDayInMilliseconds = 86400000
        const dateMin = new Date(Date.now() + oneDayInMilliseconds * 2)
        const dateMax = new Date(Date.now() + oneDayInMilliseconds * 3)

        const minParam = `[[date::>${dateMin.toISOString()}]]`
        const maxParam = `[[date::<${dateMax.toISOString()}]]`

        params.conditions.push(minParam, maxParam)
    }
}

export default UpcomingMatchesJob
