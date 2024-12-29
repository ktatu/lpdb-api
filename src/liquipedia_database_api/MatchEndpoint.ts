import { QueryParams } from "../types"
import { query } from "./client"

export class MatchEndpoint {
    private static rateLimiter: RateLimiter = new RateLimiter()

    /*
    Rate limit may cause queries to pile up
    Queries that use same params can be combined
    */
    private static matchQueryBuffer: Array<string>

    static async getUpcomingMatches() {
        const params: QueryParams = {
            wiki: ["deadlock", "counterstrike"],
            conditions: ["[[dateexact::1]]"],
            datapoints: [
                "match2id",
                "date",
                "stream",
                "tournament",
                "liquipediatier",
                "match2opponents",
            ],
            limit: 1000,
        }

        const { dateStart, dateEnd } = this.getDateInterval()
        params.conditions.push(`[[date::>${dateStart}]]`, `[[date::<${dateEnd}]]`)

        const matches = await this.getMatchData(params)
    }

    private static getDateInterval() {
        const d = new Date()
        const dateStart = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

        const d2 = new Date(Date.now() + 86400000) // adding 24 hours
        const dateEnd = `${d2.getFullYear()}-${d2.getMonth() + 1}-${d2.getDate()}`

        return { dateStart, dateEnd }
    }

    private static async getMatchData(queryParams: QueryParams) {
        await this.rateLimiter.waitForRateLimit()

        await query("match", queryParams)

        this.rateLimiter.setNewLimitStart()

        return 0
    }
}
