const { Schema, model } = require("mongoose")

const AccountSchema = new Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    password: { type: String, required: true }
});

module.exports = model("Account", AccountSchema)