import { HydratedDocument } from "mongoose"
import API, { APIName } from "./liquipedia_database_api/API"
import TrackedTourney from "./mongodb/TrackedTourney"
import { parseMatchStatusesData } from "./parsers"
import { ConditionUnionParams, ITrackedTourney, condition } from "./types"

class LiveTourneyTracker {
    private static readonly PARAMS: ConditionUnionParams = {
        wiki: [],
        conditions: ["[[namespace::0]]", "[[finished::1]]"],
        datapoints: ["match2id"],
        limit: 1000,
    }

    private static matchAPI = API.getAPI(APIName.MATCH)

    private constructor() {}

    static async addMatch(pagename: string, wiki: string, match2id: string) {
        const tourney = await TrackedTourney.findOne({ pagename, wiki })

        if (!tourney) {
            await TrackedTourney.create({ pagename, wiki, matches: [match2id] })
        } else {
            tourney.matchesByID.push(match2id)
            await tourney.save()
        }
    }

    static async tourneyUpdate(wiki: string, pagename: string) {
        const tourney = await TrackedTourney.findOne({ pagename, wiki })

        if (!tourney || tourney.matchesByID.length === 0) {
            return
        }

        const matches = await this.getFinishedMatchesFromAPI(tourney.matchesByID, tourney.wiki)
        await this.removeFinishedMatchesFromDB(tourney, matches)
    }

    private static async getFinishedMatchesFromAPI(matchesByID: Array<string>, wiki: string) {
        const params = this.getParams(matchesByID, wiki)
        const rawStatusesData = await this.matchAPI.getData(params)

        return parseMatchStatusesData(rawStatusesData)
    }

    private static async removeFinishedMatchesFromDB(
        tourney: HydratedDocument<ITrackedTourney>,
        finishedMatchesByID: Array<string>
    ) {
        const ongoingMatches = tourney.matchesByID.filter(
            (match) => !finishedMatchesByID.includes(match)
        )

        if (ongoingMatches.length === 0) {
            await tourney.deleteOne()
        } else {
            tourney.matchesByID = ongoingMatches
            await tourney.save()
        }
    }

    private static getParams(match2ids: Array<string>, wiki: string) {
        const params = structuredClone(this.PARAMS)

        const match2idConditions: Array<condition> = match2ids.map((id) => {
            const condition: condition = `[[match2id::${id}]]`
            return condition
        })

        params.wiki.push(wiki)
        params.conditions.push(match2idConditions)

        return params
    }
}

export default LiveTourneyTracker
