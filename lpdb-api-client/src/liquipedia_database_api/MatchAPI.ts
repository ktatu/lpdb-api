import { QueryParams } from "../types"
import { queryApi } from "./client"
import { RateLimiter } from "./RateLimiter"

class MatchAPI {
    private static rateLimiter: RateLimiter = new RateLimiter()
    private static ENDPOINT_NAME = "match"

    private constructor() {}

    static async getMatches(params: QueryParams) {
        return await this.rateLimiter.limitWrapper(queryApi, this.ENDPOINT_NAME, params)
    }
}

export default MatchAPI
