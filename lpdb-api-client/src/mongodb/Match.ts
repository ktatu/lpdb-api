import { Model, model, Schema } from "mongoose"
import { Match as IMatch } from "../types"

interface MatchModel extends Model<IMatch> {
    updateAndSaveMatches(matches: IMatch[]): Promise<void>
}

const schema = new Schema<IMatch, MatchModel>({
    match2id: { type: String, required: true, unique: true, index: true },
    date: { type: Date, required: true },
    tournament: { type: String, required: true },
    wiki: { type: String, required: true },
    pagename: { type: String, required: true },
})

schema.static("updateAndSaveMatches", async function (matches: IMatch[]) {
    const operations = matches.map((match) => ({
        updateOne: {
            filter: { match2id: match.match2id },
            update: { $set: match },
            upsert: true,
        },
    }))

    try {
        await this.bulkWrite(operations)
    } catch (error) {
        console.log(error)
    }
})

const Match = model<IMatch, MatchModel>("Match", schema)

export default Match
