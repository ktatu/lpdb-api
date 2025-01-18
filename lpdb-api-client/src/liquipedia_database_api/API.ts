import { Params } from "../types"
import { queryApi } from "./client"
import { RateLimiter } from "./RateLimiter"

export enum APIName {
    MATCH = "match",
    PLAYER = "player",
}

class API {
    private rateLimiter: RateLimiter = new RateLimiter()
    name: APIName

    private static endpointInstances: Array<API> = []

    private constructor(api: APIName) {
        this.name = api
    }

    static getAPI(api: APIName) {
        const instance = this.endpointInstances.find((endpoint) => endpoint.name === api)

        if (!instance) {
            const newInstance = new API(api)
            this.endpointInstances = this.endpointInstances.concat(newInstance)

            return newInstance
        }

        return instance
    }

    async getData(params: Params) {
        return await this.rateLimiter.limitWrapper(queryApi, this.name, params)
    }
}

export default API
