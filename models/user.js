var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    userid: String,
    rsvps: [{ businessid: String }]
});

module.exports = mongoose.model('user', User);
