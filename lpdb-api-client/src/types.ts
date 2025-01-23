type wiki = "deadlock" | "counterstrike" | "dota2"
type operator = "::" | "::!" | "::>" | "::<"
type value = string
type datapoint =
    | "date"
    | "dateexact"
    | "finished"
    | "id"
    | "links"
    | "liquipediatier"
    | "match2id"
    | "match2opponents"
    | "namespace"
    | "stream"
    | "pagename"
    | "tournament"

export type condition = `[[${datapoint}${operator}${value}]]`

export interface Params {
    wiki: Array<string>
    datapoints: Array<datapoint>
    limit?: number
}

export interface QueryParams extends Params {
    conditions: Array<condition>
}

export interface ConditionUnionParams extends Params {
    conditions: Array<Array<condition> | condition>
}

export interface LPDBResponse {
    result: Array<unknown>
    error?: Array<string>
    warning?: Array<string>
}

// TODO: split the interface into different parts to match the different phases data goes through with jobs
// UpcomingMatch -> UpdatedMatch -> IMatch(?)
export interface IMatch {
    match2id: string
    date: Date
    tournament: string
    wiki: string
    pagename: string
    liquipediatier: string
    match2opponents?: Array<Team>
    stream?: string
    teamsWithPlayerStreams?: Array<{ name: string; streams: Array<Player> }>
}

export interface Team {
    name: string
    match2players: Array<string>
}

export interface Player {
    id: string
    twitch: string
}

export interface WebhookData {
    page: string
    namespace: number
    wiki: string
    event: string
}

export interface ITrackedTourney {
    pagename: string
    wiki: string
    matchesByID: Array<string>
}
