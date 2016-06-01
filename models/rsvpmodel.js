var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Avoid duplicates when adding to set http://blog.open-tribute.org/2015/05/nodejs-mongoose-addtoset-duplicates-on.html
var Biz = new Schema({
    biz_id: String,
    rsvps: []
});

module.exports = mongoose.model('biz', Biz);
