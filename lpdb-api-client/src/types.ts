export interface QueryParams {
    wiki: Array<string>
    conditions: Array<string>
    datapoints: Array<string>
    limit?: number
}

export interface LPDBResponse {
    result: Array<Match>
    error?: Array<string>
    warning?: Array<string>
}

// TODO: stream and match2opponents
export interface Match {
    match2id: string
    date: Date
    //stream: JSON
    tournament: string
    wiki: string
    pagename: string
    //match2opponents: JSON
}
