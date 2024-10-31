const { Schema, model } = require("mongoose")

const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    password: { type: String, required: true }
});

module.exports = model("User", UserSchema)