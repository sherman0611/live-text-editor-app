const { Schema, model } = require("mongoose")

const DocumentSchema = new Schema({
    _id: String,
    filename: { type: String, required: true },
    data: Object
})

module.exports = model("Document", DocumentSchema)