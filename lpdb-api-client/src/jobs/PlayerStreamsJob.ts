import { Job, Queue } from "bullmq"
import { SUPPORTED_WIKIS } from "../config"
import API, { APIName } from "../liquipedia_database_api/API"
import Player from "../mongodb/Player"
import { QueryParams } from "../types"
import { parsePlayerStreams, parsePlayerStreamsJobData } from "./parser"

const testFunc = async () => {
    const toAdd = [
        { id: "id1", twitch: "twitch1", wiki: "deadlock" },
        { id: "id2", twitch: "twitch2", wiki: "deadlock" },
        { id: "id3", twitch: "twitch3", wiki: "deadlock" },
    ]

    const first = new Player(toAdd[0])
    const second = new Player(toAdd[1])
    const third = new Player(toAdd[2])
    await first.save()
    await second.save()
    await third.save()

    const players = ["id1", "id2"]

    const playersFromDB = await Player.find({ wiki: "deadlock", id: { $in: players } }).lean()
    const playerIDs = playersFromDB.map((player) => player.id)
    const playersToQuery = players.filter((player) => playerIDs.includes(player))
}

class PlayerStreamsJob {
    static NAME = "player_streams"

    private static PARAMS: QueryParams = {
        wiki: [],
        conditions: ["[[namespace::0]]"],
        datapoints: [],
        limit: 100,
    }
    private static MAX_CACHE_SIZE = 20000

    private static queue: Queue
    private static playerAPI: API
    private static playerCaches: { [key: string]: Set<string> } = {}

    private constructor() {}

    static async initialize(queue: Queue) {
        this.queue = queue
        this.playerAPI = API.getAPI(APIName.PLAYER)

        //this.createPlayerCaches()
    }

    static async execute(job: Job) {
        const { wiki, players } = parsePlayerStreamsJobData(job.data)
        const cache = this.playerCaches[wiki]
        //const players = ["player11", "player12", "player13", "player21", "player22", "player23"]

        //const playersToQuery = this.playersNotInCache(cache, players)

        const playersFromDB = await Player.find({ wiki, id: { $in: players } })
        const playerNames = playersFromDB.map((player) => player.id)
        const playersToQuery2 = players.filter((player) => playerNames.includes(player))

        const params = this.getParams(wiki, playersToQuery2)

        //this.manageCache(cache, players)

        const rawPlayerData = await this.playerAPI.getData(params)
        const playersWithStreams = parsePlayerStreams(rawPlayerData)
    }

    private static getParams(wiki: string, players: Array<string>) {
        const params = structuredClone(this.PARAMS)
        const playersCondition = players.map((player) => `[[id::${player}]]`).join(" OR ")

        params.wiki.push(wiki)
        params.conditions.push(playersCondition)

        return params
    }

    private static manageCache(cache: Set<string>, players: Array<string>) {
        if (cache.size > this.MAX_CACHE_SIZE) {
            cache.clear()
        }

        players.forEach((player) => {
            cache.add(player)
        })
    }

    private static playersNotInCache(cache: Set<string>, players: Array<string>) {
        return players.filter((player) => !cache.has(player))
    }

    private static createPlayerCaches() {
        SUPPORTED_WIKIS.forEach((wiki) => {
            const cache = new Set<string>()
            this.playerCaches[wiki] = cache
        })
    }
}

export default PlayerStreamsJob
