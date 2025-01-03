import axios from "axios"
import { LPDB_API_KEY, LPDB_API_URL } from "../config"
import { QueryParams } from "../types"

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
    const wikis = `wiki=${encodeURIComponent(queryParams.wiki.toString().replaceAll(",", "|"))}`
    const conditions = `conditions=${encodeURIComponent(
        queryParams.conditions.toString().replaceAll(",", " AND ")
    )}`
    const datapoints = `query=${encodeURIComponent(queryParams.datapoints.toString())}`
    const limit = `limit=${queryParams.limit || 20}`

    const query = `${wikis}&${conditions}&${datapoints}&${limit}`

    return query
}

client.interceptors.response.use((res) => {
    if (res.data.warning) {
        console.log("Warning in lpdb response: ", res.data.warning)
    }
    if (res.data.error) {
        console.log("Error in lpdp response: ", res.data.error)
    }

    const newRes = { ...res, data: res.data.result }
    return newRes
})

export const queryApi = async (endpoint: string, queryParams: QueryParams) => {
    try {
        const res = await client.get(endpoint, { params: queryParams })
    } catch (error) {
        console.log(error)
    }
}
