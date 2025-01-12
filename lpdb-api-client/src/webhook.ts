import { z } from "zod"
import { SUPPORTED_WIKIS } from "./config"
import { app } from "./index"
import { WebhookData } from "./types"

let trackedEvents = new Set<string>()

app.post("/", (req, res) => {
    const parsedData = parseWebhookData(req.body)

    if (isPayloadForTrackedTourney(parsedData)) {
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

const isPayloadForTrackedTourney = (data: WebhookData) => {
    if (
        data.event !== "edit" ||
        !SUPPORTED_WIKIS.includes(data.wiki) ||
        data.namespace !== 0 ||
        !trackedEvents.has(data.page)
    ) {
        return false
    }
    return true
}
