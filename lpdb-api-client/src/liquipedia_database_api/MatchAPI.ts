import merge from "lodash.mergewith"
import { z } from "zod"
import { SUPPORTED_WIKIS } from "../config"
import { IMatch, QueryParams } from "../types"
import { queryApi } from "./client"
import { RateLimiter } from "./RateLimiter"

export class MatchAPI {
    private static rateLimiter: RateLimiter = new RateLimiter()
    private static ENDPOINT_NAME = "match"

    private static DEFAULT_PARAMS: QueryParams = {
        wiki: SUPPORTED_WIKIS,
        conditions: ["[[namespace::0]]"],
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
        const rawMatchesData = await this.fetchWithinRateLimit(params)

        let parsedData: Array<IMatch> = []

        try {
            parsedData = this.parseMatches(rawMatchesData)
        } catch (error) {
            console.log(error)
        }

        return parsedData
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

    private static parseMatches(rawMatchData: unknown) {
        const matchSchema = z.array(
            z.object({
                wiki: z.string(),
                pagename: z.string(),
                match2id: z.string(),
                date: z.string().transform((dateStr) => {
                    // dates from api arrive as strings in the format (UTC 0): 2025-02-10 23:30:00
                    // needs to be converted into ISO 8601 format: 2025-02-10T23:30:00Z for Date object
                    dateStr.replace(" ", "T").concat("Z")
                    return new Date(dateStr)
                }),
                tournament: z.string(),
                liquipediatier: z.number(),
            })
        )

        return matchSchema.parse(rawMatchData)
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
