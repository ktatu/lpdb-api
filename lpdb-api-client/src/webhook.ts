import { z } from "zod"
import { SUPPORTED_WIKIS } from "./config"
import { app } from "./index"
import LiveTourneyTracker from "./LiveTourneyTracker"
import { WebhookData } from "./types"

app.post("/", (req, res) => {
    const parsedData = parseWebhookData(req.body)

    if (isPayloadForTourney(parsedData)) {
        LiveTourneyTracker.tourneyUpdate(parsedData.wiki, parsedData.page)
    }

    res.sendStatus(200)
})

const parseWebhookData = (data: unknown) => {
    const schema = z.object({
        page: z.string(),
        namespace: z.number(),
        wiki: z.string(),
        event: z.string(),
    })

    return schema.parse(data)
}

const isPayloadForTourney = (data: WebhookData) => {
    if (data.event !== "edit" || !SUPPORTED_WIKIS.includes(data.wiki) || data.namespace !== 0) {
        return false
    }
    return true
}
