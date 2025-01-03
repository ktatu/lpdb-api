/*
The word "query" has two contexts in the app:
1. req.query from the request, which is the argument of parse()
2. Parameter for a request to the LPDB, which declares the datapoints being fetched
*/

export const parse = (queryObj) => {
    const wikis = parseWiki(queryObj.wiki)
    const datapoints = parseDatapoints(queryObj.query)
    const limit = parseLimit(queryObj.limit)

    return { wikis: wikis, datapoints: datapoints, limit: limit }
}

const parseWiki = (wikiStr) => {
    if (!wikiStr) {
        throw new Error(errorMsg("wiki"))
    }

    return wikiStr.split("|")
}

const parseDatapoints = (queryStr) => {
    if (!queryStr) {
        throw new Error(errorMsg("query"))
    }

    return queryStr.split(",")
}

const parseLimit = (limitStr) => {
    if (!limitStr) {
        throw new Error(errorMsg("limit"))
    }

    return parseInt(limitStr)
}

const errorMsg = (missingParam) => `Parameter missing: ${missingParam}`
