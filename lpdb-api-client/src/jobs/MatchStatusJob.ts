import { QueryParams } from "../types"

// Checking if a match has ended
class MatchStatusJob {
    static readonly NAME = "match_status"
    private static readonly PARAMS: QueryParams = {
        wiki: [],
        conditions: ["[[namespace::0]]"],
        datapoints: ["status"],
        limit: 1,
    }
}

export default MatchStatusJob
