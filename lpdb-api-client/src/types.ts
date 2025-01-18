export interface Params {
    wiki: Array<string>
    datapoints: Array<string>
    limit?: number
}

export interface QueryParams extends Params {
    conditions: Array<string>
}

export interface ConditionUnionParams extends Params {
    conditions: Array<Array<string> | string>
}

export interface LPDBResponse {
    result: Array<unknown>
    error?: Array<string>
    warning?: Array<string>
}

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
