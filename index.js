var express = require('express');
var app = express();
var mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require('path');
var twitterAPI = require('node-twitter-api');
var Yelp = require('yelp');
var parse = require('./parseYelpResults.js')
var RsvpList = require('./models/rsvpmodel');
var UserRsvpList =  function(userid, callback) {
  console.log("find init RsvpList:")
  RsvpList.find({
    // https://docs.mongodb.com/manual/reference/operator/query-comparison/
    // https://docs.mongodb.com/manual/reference/operator/query/elemMatch/#op._S_elemMatch
      rsvps: { $elemMatch: { $eq: userid } }
  }, function(err, data) {
      if (err) {
          console.log("Error find in RsvpList:", err)
          callback(err, null);
      } else {
          console.log("User's current list: ", JSON.stringify(data, null, 4));
          callback(null, data);
      }
    })
}

var FetchUserData = function(dataid, callback) {
  user_rsvps = [];
  rsvps_count = [];
  UserRsvpList(dataid, function(err, resp){
    if (err) {
        console.log("Error find in UserList:", err)
        callback(err, null)
    } else {
        console.log("User's current list: ", resp);

        if ( !resp || resp.length < 1) { // no DB? create new one
            console.log("No RSVPs for this user.")
        } else { // pass along user's RSVP information to the Jade file
          for (var i = 0; i < resp.length; i++ ) {
            user_rsvps.push( resp[i]["biz_id"] )
            rsvps_count.push( resp[i]["rsvps"].length)
          }
          console.log("Biz's RSVPs: ", user_rsvps)
          console.log("RSVPs count: ", rsvps_count)
        }
        callback(null, true);
    }
  })
}

app.set('port', (process.env.PORT || 5000));

var db = mongoose.connect("mongodb://wastedige:salamsalam@ds011883.mlab.com:11883/heroku_ddddmk9g");
app.set('db', db)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(session({
    secret: 'some crappy secret'
}));


// https://www.npmjs.com/package/node-twitter-api
// http://codetheory.in/how-to-use-twitter-oauth-with-node-oauth-in-your-node-js-express-application/ without using node-twitter-api module
var twitter = new twitterAPI({
    consumerKey: "xh3hmd97trRCzGjC7sBpUvsvD",
    consumerSecret: "7LD7EGf7QNQSvyJ313unTPf8q6agsSYFrHK5lq2OfGoonrxV1R",
    callback: "http://localhost:5000/auth/twitter/callback",
});

// https://github.com/olalonde/node-yelp
var yelp = new Yelp({
    consumer_key: 'HfQNywD4Gly5CMJ8AYNs_A',
    consumer_secret: 'BoAv-JX1YTTad0RpAZ5TTusAIOc',
    token: 'lhXbJGUQV_XGEvzqp2lldx04LAY-g3Ce',
    token_secret: 'jO38_lb-6QE7nQTqffxWXt9dXfQ',
});

var logged_user = null;
var user_rsvps = [];
var rsvps_count = [];
var parsed_search_results = null;

app.post('/search', function(req, res, next) {
    console.log("req", req.body)
    var search = req.body.search;
    var zip = req.body.zipcode;
    // See http://www.yelp.com/developers/documentation/v2/search_api
    yelp.search({
            term: search,
            location: zip
        })
        .then(function(data) {
            // console.log(data);
            // console.log("data.biz: ", parse(data.businesses))
            console.log("rsvps: ", user_rsvps)
            parsed_search_results = parse(data.businesses)
            res.render('index', {
                user: logged_user,
                userdata: user_rsvps,
                rsvps_count: rsvps_count,
                results: parsed_search_results
            });
        })
        .catch(function(err) {
            console.error(err);
        });
})


app.get('/auth/twitter', function(req, res) {
    console.log("auth");
    twitter.getRequestToken(function(error, oauth_token, oauth_token_secret, results) {
        if (error) {
            console.log(error);
            res.send("Authentication Failed!");
        } else {
            req.session.oauth = {
                token: oauth_token,
                token_secret: oauth_token_secret
            };
            // console.log("init auth", req.session.oauth);
            res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token)
        }
    });

});

app.get('/auth/twitter/callback', function(req, res, next) {

    if (req.session.oauth) {
        req.session.oauth.verifier = req.query.oauth_verifier;
        var oauth_data = req.session.oauth;

        twitter.getAccessToken(
            oauth_data.token,
            oauth_data.token_secret,
            oauth_data.verifier,
            function(error, oauth_access_token, oauth_access_token_secret, results) {
                if (error) {
                    console.log(error);
                    res.send("Authentication Failure!");
                } else {
                    req.session.oauth.access_token = oauth_access_token;
                    req.session.oauth.access_token_secret = oauth_access_token_secret;
                    console.log("results", JSON.stringify(req.session.oauth.access_token));
                    // res.send("Authentication Successful");

                    twitter.verifyCredentials(oauth_access_token, oauth_access_token_secret, null, function(error, data, response) {
                        if (error) {
                            console.log("something was wrong with either accessToken or accessTokenSecret ")
                        } else {
                            // console.log( JSON.stringify(data, null, 4) )
                              logged_user = data
                              FetchUserData(data.id, function(err, done){
                                if (done) {
                                  res.render('index', {
                                      user: logged_user,
                                      userdata: user_rsvps,
                                      rsvps_count: rsvps_count
                                  });
                                }
                              })
                          }


                    });
                }
            }
        );

    } else {
        res.redirect('/login'); // Redirect to login page
        console.log("no token?", req.session.oauth);
    }

});

app.get('/rsvp/:id', function(req, res) {


  var id = req.params.id;
  if (logged_user == null) // make sure it's not an anonymous user!
      res.render('index')


  RsvpList.findOneAndUpdate({
      "biz_id": id
    },
    {
      "$addToSet": {
          rsvps: logged_user['id']
      }
    }, { upsert: true },
    function(err, data) {
      if (err)
        console.log("er", err)
      else
        console.log("Data from findOneAndUpdate RSVP: ", data)
        FetchUserData(logged_user['id'], function(err, done){
          if (done) {
            res.render('index', {
                user: logged_user,
                userdata: user_rsvps,
                rsvps_count: rsvps_count,
                results: parsed_search_results
            });
          }
        })
    }
  );



});


app.get('/unrsvp/:id', function(req, res) {


  var id = req.params.id;
  if (logged_user == null) // make sure it's not an anonymous user!
      res.render('index')


  RsvpList.findOneAndUpdate({
      "biz_id": id
    },
    {
      "$pull": {
          rsvps: logged_user['id']
      }
    }, { update: true },
    function(err, data) {
      if (err)
        console.log("er", err)
      else
        console.log("Data from findOneAndUpdate Un-RSVP: ", data)
        FetchUserData(logged_user['id'], function(err, done){
          if (done) {
            res.render('index', {
                user: logged_user,
                userdata: user_rsvps,
                rsvps_count: rsvps_count,
                results: parsed_search_results
            });
          }
        })
    }
  );



});


// catch all!
app.get('*', function(req, res) {
    res.render('index', {
        user: logged_user
    })
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
