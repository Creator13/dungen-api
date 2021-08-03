const lifetime = 10 * 60 * 1000;
// const lifetime = 10 * 1000;

const store = {};

setInterval(() => {
    console.log("Clearing unused game sessions...");
    let counter = 0;
    for (const [id, gameServerSession] of Object.entries(store)) {
        if (gameServerSession.created && gameServerSession.created + lifetime < Date.now()) {
            counter++;
            delete store[id];
        }
    }
    if (counter > 0) {
        console.log(`Cleared ${counter} sessions!`);
    }
    console.log(store);
    console.log(Date.now());
}, lifetime);

module.exports = store;