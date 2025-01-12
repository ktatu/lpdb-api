export class RateLimiter {
    // Liquipedia rate limit (per endpoint) is 1 request per minute
    private cooldown: number = 60000
    /*
    Date.now() as initial value to prevent the following scenario:
    1. enforceLimit()
    2. App crashes, restarts
    4. enforceLimit()
    Less than 60 seconds between steps 1 and 4 => rate limit will be hit
    */
    private lastEnforcementTimestamp: number = Date.now()

    async limitWrapper(func: (...funcArgs: any) => Promise<unknown[]>, ...funcArgs: any) {
        await this.enforceLimit()

        const queryData = await func(...funcArgs)

        this.setNewEnforcementTimestamp()

        return queryData
    }

    async enforceLimit() {
        const timeoutDuration = Math.max(0, this.timeSinceLastEnforcement())

        await new Promise((resolve) => setTimeout(resolve, timeoutDuration))
    }

    setNewEnforcementTimestamp() {
        this.lastEnforcementTimestamp = Date.now()
    }

    private timeSinceLastEnforcement = () =>
        this.lastEnforcementTimestamp + this.cooldown - new Date().getTime()
}
