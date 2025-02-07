let mongoose = require('mongoose')
let plm = require('passport-local-mongoose')

let userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
})

userSchema.plugin(plm)
module.exports = mongoose.model('User', userSchema)