import dbData from "./data.json" assert { type: "json" }

export const fetch = (queryParams) => {
    const requestedData = filterByWiki(queryParams).map((match) =>
        filterDatapoints(match, queryParams)
    )

    return { result: requestedData }
}

const filterByWiki = (queryParams) =>
    dbData.filter((match) => queryParams.wikis.includes(match.wiki))

// filtering away the fields not specified in the query, namely "shouldnotbefetched"
const filterDatapoints = (match, query) =>
    Object.fromEntries(
        Object.entries(match).filter(([datapoint]) => query.datapoints.includes(datapoint))
    )
