import API, { APIName } from "../liquipedia_database_api/API"
import { parseMatchUpdate } from "../parsers"
import { Match, QueryParams, Team } from "../types"

// Querying a specific match from LPDB API to get more datapoints / updated datapoints
class MatchUpdateJob {
    static readonly NAME = "match_update"
    private static readonly PARAMS: QueryParams = {
        wiki: [],
        conditions: ["[[namespace::0]]", "[[stream::![]]]"],
        datapoints: [
            "match2id",
            "date",
            "tournament",
            "liquipediatier",
            "pagename",
            "match2opponents",
            "stream",
        ],
        limit: 1,
    }

    private static matchAPI: API

    private constructor() {}

    static initialize() {
        this.matchAPI = API.getAPI(APIName.MATCH)
    }

    static async execute(match2id: string, wiki: string) {
        const params = this.getParams(match2id, wiki)
        const rawMatchData = await this.matchAPI.getData(params)

        const match = parseMatchUpdate(rawMatchData)

        if (!match) {
            return undefined
        }

        this.validateMatch(match)

        return match
    }

    private static getParams(match2id: string, wiki: string) {
        const params = structuredClone(this.PARAMS)

        params.wiki.push(wiki)
        params.conditions.push(`[[match2id::${match2id}]]`)

        return params
    }

    private static validateMatch(match: Match) {
        if (this.matchIsOld(match.date)) {
            throw new Error("match is old")
        }
        if (this.teamDataIsMissing(match.match2opponents as Array<Team>)) {
            throw new Error("match is missing team information")
        }
    }

    private static matchIsOld(matchDate: Date) {
        return Date.now() > matchDate.getTime()
    }

    private static teamDataIsMissing(teams: Array<Team>) {
        let dataMissing = false
        teams.forEach((team) => {
            if (!Boolean(team.name) || team.match2players.length === 0) {
                dataMissing = true
            }
        })

        return dataMissing
    }
}

export default MatchUpdateJob
