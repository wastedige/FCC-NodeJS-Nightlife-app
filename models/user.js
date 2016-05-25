var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Avoid duplicates when adding to set http://blog.open-tribute.org/2015/05/nodejs-mongoose-addtoset-duplicates-on.html
var User = new Schema({
    userid: String,
    rsvps: [
      { businessid: String, "_id": false}
    ]
});

module.exports = mongoose.model('user', User);
