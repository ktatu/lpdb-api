import merge from "lodash.mergewith"
import { SUPPORTED_WIKIS } from "../config"
import { QueryParams } from "../types"
import { queryApi } from "./client"
import { RateLimiter } from "./RateLimiter"

export class MatchAPI {
    private static rateLimiter: RateLimiter = new RateLimiter()
    private static ENDPOINT_NAME = "match"

    private static DEFAULT_PARAMS: QueryParams = {
        wiki: SUPPORTED_WIKIS,
        conditions: [],
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

    /*
    Rate limit may cause queries to pile up
    Queries that use same params can be combined
    */
    private static matchQueryBuffer: Array<string>

    private constructor() {}

    static async getMatches(extraParams: QueryParams) {
        const params = this.appendExtraParams(structuredClone(this.DEFAULT_PARAMS), extraParams)
        const matches = await this.fetchWithinRateLimit(params)

        return matches
    }

    private static appendExtraParams(params: QueryParams, extraParams: QueryParams) {
        merge(params, extraParams, this.mergeArrays)

        return params
    }

    private static mergeArrays(valueFromParams: unknown, valueFromExtraParams: unknown) {
        if (Array.isArray(valueFromParams) && Array.isArray(valueFromExtraParams)) {
            return valueFromParams.concat(valueFromExtraParams)
        }

        return undefined
    }

    private static async fetchWithinRateLimit(params: QueryParams) {
        return await this.rateLimiter.limitWrapper(queryApi, this.ENDPOINT_NAME, params)
    }
}
/*
    private static addDateInterval(conditions: Array<string>) {
        const dayInMilliseconds = 86400000

        const d = new Date(Date.now() + dayInMilliseconds)
        const dateMin = `[[date::>${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}]]`

        const d2 = new Date(Date.now() + dayInMilliseconds * 2)
        const dateMax = `[[date::<${d2.getFullYear()}-${d2.getMonth() + 1}-${d2.getDate()}]]`

        return conditions.concat([dateMin, dateMax])
    }
*/
