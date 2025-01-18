import { Job } from "bullmq"
import API, { APIName } from "../liquipedia_database_api/API"
import Match from "../mongodb/Match"
import { parsePlayerStreams, parsePlayerStreamsJobData } from "../parser"
import { Player, QueryParams, Team } from "../types"

class PlayerStreamsJob {
    static NAME = "player_streams"

    private static PARAMS: QueryParams = {
        wiki: [],
        conditions: ["[[namespace::0]]"],
        datapoints: [],
        limit: 100,
    }

    private static playerAPI: API

    private constructor() {}

    static initialize() {
        this.playerAPI = API.getAPI(APIName.PLAYER)
    }

    static async execute(job: Job) {
        const { wiki, teams, match2id } = parsePlayerStreamsJobData(job.data)

        const teamsWithPlayerStreams = await this.getTeamsWithPlayerStreams(teams, wiki)

        await Match.savePlayerStreams(match2id, teamsWithPlayerStreams)
    }

    private static async getTeamsWithPlayerStreams(teams: Array<Team>, wiki: string) {
        const playerIDs = this.getPlayerIDs(teams)
        const streams = await this.getStreamsFromAPI(wiki, playerIDs)

        const streamsMap = this.getStreamMap(streams)

        const teamsWithPlayerStreams = teams.map((team) => {
            return {
                team: team.name,
                match2players: team.match2players.map((player) => {
                    const stream = streamsMap.get(player) || ""
                    return { id: player, twitch: stream }
                }),
            }
        })

        return teamsWithPlayerStreams
    }

    private static getPlayerIDs(teams: Array<Team>) {
        return teams.flatMap((team) => team.match2players)
    }

    private static async getStreamsFromAPI(wiki: string, playerIDs: Array<string>) {
        const params = this.getParams(wiki, playerIDs)

        const rawPlayerData = await this.playerAPI.getData(params)
        const streams = parsePlayerStreams(rawPlayerData)

        return streams
    }

    private static getParams(wiki: string, players: Array<string>) {
        const params = structuredClone(this.PARAMS)
        const playersCondition = players.map((player) => `[[id::${player}]]`).join(" OR ")

        params.wiki.push(wiki)
        params.conditions.push(playersCondition)

        return params
    }

    private static getStreamMap(players: Array<Player>) {
        const map = new Map<string, string>()
        players.forEach((player) => map.set(player.id, player.twitch))

        return map
    }
}

export default PlayerStreamsJob
