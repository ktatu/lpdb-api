class RateLimiter {
    // Liquipedia rate limit (per endpoint) is 1 request per minute
    private cooldown: number = 60000
    /*
    Date.now() as initial value to prevent the following scenario:
    1. waitForRateLimit()
    2. App crashes
    3. Restarts
    4. waitForRateLimit()
    Less than 60 seconds between steps 1 and 4 => rate limit will be hit
    */
    private limitStart: number = Date.now()

    // call before work that needs to be rate limited
    async waitForRateLimit() {
        const timeoutDuration = Math.max(0, this.timeSinceLastEnforcement())

        await new Promise((resolve) => setTimeout(resolve, timeoutDuration))
    }

    // call after work that needs to be rate limited
    setNewLimitStart() {
        this.limitStart = Date.now()
    }

    private timeSinceLastEnforcement = () => this.limitStart + this.cooldown - new Date().getTime()
}
