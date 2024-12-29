import { model, Schema } from "mongoose"

/*
stream and match2opponents to be implemented later
*/
interface IMatch {
    match2id: string
    date: Date
    //stream: JSON
    tournament: string
    wiki: string
    pagename: string
    //match2opponents: JSON
}

const schema = new Schema<IMatch>({
    match2id: { type: String, required: true },
    date: { type: Date, required: true },
    tournament: { type: String, required: true },
    wiki: { type: String, required: true },
    pagename: { type: String, required: true },
})

export const Match = model<IMatch>("Match", schema)
