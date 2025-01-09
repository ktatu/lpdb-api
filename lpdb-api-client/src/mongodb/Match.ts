import { Model, model, Schema } from "mongoose"
import { IMatch } from "../types"

interface MatchModel extends Model<IMatch> {
    updateAndSaveMatches(matches: IMatch[]): Promise<void>
}

const schema = new Schema<IMatch, MatchModel>({
    match2id: { type: String, required: true, unique: true, index: true },
    date: { type: Date, required: true },
    tournament: { type: String, required: true },
    wiki: { type: String, required: true },
    pagename: { type: String, required: true },
    liquipediatier: { type: Number, required: true },
    match2opponents: { type: [Object] },
    stream: { type: String },
})

schema.static("updateAndSaveMatches", async function (matches: IMatch[]) {
    const operations = matches.map((match) => ({
        updateOne: {
            filter: { match2id: match.match2id },
            update: { $set: match },
            upsert: true,
        },
    }))

    await this.bulkWrite(operations)
})

const Match = model<IMatch, MatchModel>("Match", schema)

export default Match
