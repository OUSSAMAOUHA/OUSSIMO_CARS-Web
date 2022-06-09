const { default: mongoose } = require("mongoose")

function connectToDb() {
    mongoose.connect("mongodb+srv://oouhayou:ouhayou2001@cluster0.nv5k0.mongodb.net/?retryWrites=true&w=majority")
    mongoose.connection.once("open", () => {
        console.log("connected")
    }).on("error", err => {
        console.log("Your error", err)
    })
}

module.exports = connectToDb;