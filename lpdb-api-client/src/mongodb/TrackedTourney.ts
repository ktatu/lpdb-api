import { model, Schema } from "mongoose"
import { TrackedTourney as ITrackedTourney } from "../types"

const schema = new Schema<ITrackedTourney>({
    matchesByID: { type: [String], required: true },
    wiki: { type: String, required: true },
    pagename: { type: String, required: true },
})

const TrackedTourney = model<ITrackedTourney>("LiveMatch", schema)

export default TrackedTourney
