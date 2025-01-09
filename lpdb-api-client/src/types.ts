export interface QueryParams {
    wiki: Array<string>
    conditions: Array<string>
    datapoints: Array<string>
    limit?: number
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
    liquipediatier: number
    match2opponents?: Array<Team>
    stream?: string
}

export interface Team {
    name: string
    match2players: Array<string>
}
