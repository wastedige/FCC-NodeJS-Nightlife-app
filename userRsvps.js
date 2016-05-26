var UserList = require('./models/user');

module.exports = function(userid, callback) {
  console.log("find init UserList:")
  UserList.find({
      'userid': userid
  }, function(err, data) {
      if (err) {
          console.log("Error find in UserList:", err)
          callback(err, null);
      } else {
          console.log("User's current list: ", JSON.stringify(data, null, 4));
          callback(null, data);
      }
    })
}
