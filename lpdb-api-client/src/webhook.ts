import { Router } from "express"
import { z } from "zod"
import { SUPPORTED_WIKIS } from "./config"
import LiveTourneyTracker from "./LiveTourneyTracker"
import { WebhookData } from "./types"

export const router = Router()

router.post("/", (req, res) => {
    try {
        const parsedData = parseWebhookData(req.body)
        if (isPayloadForTourney(parsedData)) {
            LiveTourneyTracker.tourneyUpdate(parsedData.wiki, parsedData.page)
        }
        res.sendStatus(200)
    } catch (error) {
        console.error("malformatted data in webhook")
        console.error(error)
        res.sendStatus(400)
    }
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
