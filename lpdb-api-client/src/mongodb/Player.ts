import { model, Schema } from "mongoose"

interface IPlayer {
    id: string
    twitch: string
    wiki: string
}

const schema = new Schema<IPlayer>({
    id: { type: String, required: true },
    twitch: { type: String, required: true },
    wiki: { type: String, required: true },
})

const Player = model<IPlayer>("Player", schema)

export default Player
