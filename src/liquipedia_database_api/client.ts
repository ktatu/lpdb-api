import axios from "axios"
import { LPDB_API_KEY } from "../config"
import { QueryParams } from "../types"

const client = axios.create({
    baseURL: "https://api.liquipedia.net/api/v3",
    headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip",
        Authorization: LPDB_API_KEY,
    },
    timeout: 5000,
    paramsSerializer: (params) => buildQueryString(params),
})

const buildQueryString = (queryParams: QueryParams) => {
    const wikis = `wiki=${encodeURIComponent(queryParams.wiki.toString().replaceAll(",", "|"))}`
    const conditions = `conditions=${encodeURIComponent(
        queryParams.conditions.toString().replaceAll(",", " AND ")
    )}`
    const datapoints = `query=${encodeURIComponent(queryParams.datapoints.toString())}`
    const limit = `limit=${queryParams.limit || 20}`

    const query = `${wikis}&${conditions}&${datapoints}&${limit}`

    return query
}

export const query = async (endpoint: string, queryParams: QueryParams) => {
    console.log("sending query")
}
