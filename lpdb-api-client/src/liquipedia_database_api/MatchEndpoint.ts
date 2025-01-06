import { SUPPORTED_WIKIS } from "../config"
import { QueryParams } from "../types"
import { queryApi } from "./client"
import { RateLimiter } from "./RateLimiter"

export class MatchEndpoint {
    private static rateLimiter: RateLimiter = new RateLimiter()
    private static ENDPOINT_NAME = "match"

    /*
    Rate limit may cause queries to pile up
    Queries that use same params can be combined
    */
    private static matchQueryBuffer: Array<string>

    // jos tämä olisi vaan getMatches() joka saa parametrina objektin jossa on muut tarvittavat parametrit?
    static async getMatches(additionalParams?: QueryParams) {
        let params = structuredClone(defaultParams)

        if (additionalParams) {
            // add additionalParams to params
        }

        const rawMatchData = await this.getMatchData(params)
        return rawMatchData
    }

    private static addDateInterval(conditions: Array<string>) {
        const dayInMilliseconds = 86400000

        const d = new Date(Date.now() + dayInMilliseconds)
        const dateMin = `[[date::>${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}]]`

        const d2 = new Date(Date.now() + dayInMilliseconds * 2)
        const dateMax = `[[date::<${d2.getFullYear()}-${d2.getMonth() + 1}-${d2.getDate()}]]`

        return conditions.concat([dateMin, dateMax])
    }

    private static async getMatchData(queryParams: QueryParams) {
        await this.rateLimiter.enforceLimit()

        const rawMatchData = await queryApi(this.ENDPOINT_NAME, queryParams)

        this.rateLimiter.setNewEnforcementTimestamp()

        return rawMatchData
    }
}

const defaultParams: QueryParams = {
    wiki: SUPPORTED_WIKIS,
    conditions: ["[[dateexact::1]]"],
    datapoints: [
        "match2id",
        "date",
        //"stream", TODO: handling JSON objects
        "tournament",
        "liquipediatier",
        //"match2opponents",
    ],
    limit: 1000,
}
