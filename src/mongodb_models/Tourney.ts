interface ITourney {
    wiki: string
    liveMatches: Array<string> // this will be refs of Match objects (that are ongoing)
    pagename: string
}

// timestamps true

/*
this type of code to check if liveMatches has been emptied
if yes, then the tourney no longer needs to be tracked by webhook

userSchema.pre('save', function (next) {
    // Check if the `age` field has been modified
    if (this.isModified('age')) {
        console.log(`Age is changing to: ${this.age}`);
        // You can trigger any custom logic here
    }
    next();
});
*/
