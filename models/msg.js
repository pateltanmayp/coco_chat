const mongoose = require('mongoose')
const Schema = mongoose.Schema

const msgSchema = new Schema({
    name: String,
    txt: String,
    time: String
});

module.exports = msgSchema;