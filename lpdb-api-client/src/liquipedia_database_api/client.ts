import axios from "axios"
import { LPDB_API_KEY, LPDB_API_URL } from "../config"
import { LPDBResponse, QueryParams } from "../types"

const client = axios.create({
    baseURL: LPDB_API_URL,
    headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip",
        Authorization: LPDB_API_KEY,
    },
    timeout: 5000,
    paramsSerializer: (params) => buildQueryString(params),
})

const buildQueryString = (queryParams: Record<string, any>) => {
    const conditions = stringifyConditionValues(queryParams.conditions)

    const queryParts = [
        `wiki=${encodeURIComponent(queryParams.wiki.toString().replaceAll(",", "|"))}`,
        `conditions=${encodeURIComponent(conditions.toString().replaceAll(",", " AND "))}`,
        `query=${encodeURIComponent(queryParams.datapoints.toString())}`,
        `limit=${queryParams.limit || 20}`,
    ]

    return queryParts.join("&")
}

const stringifyConditionValues = (conditions: unknown) => {
    if (!Array.isArray(conditions)) {
        return []
    }

    return conditions.reduce((acc: Array<any>, curr) => {
        if (Array.isArray(curr)) {
            const stringified = `(${curr.toString().replaceAll(",", " OR ")})`
            return acc.concat(stringified)
        }
        return acc.concat(curr)
    }, [])
}

export const queryApi = async (endpoint: string, queryParams: QueryParams) => {
    try {
        console.log(
            `Querying api: ${endpoint}, Date: ${new Date().toUTCString()}, queryparams: ${queryParams} timestamp: ${Date.now()}`
        )
        const res = await client.get<LPDBResponse>(endpoint, { params: queryParams })

        logAdditionalResponseInfo(res.data)

        return res.data.result || []
    } catch (error) {
        console.log(error)
        return []
    }
}

const logAdditionalResponseInfo = (resData: LPDBResponse) => {
    if (resData?.warning) {
        console.log("Warning in lpdb response: ", resData.warning)
    }
    if (resData?.error) {
        console.log("Error in lpdp response: ", resData.error)
    }
}
