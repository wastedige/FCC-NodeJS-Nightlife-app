var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require('path');
var twitterAPI = require('node-twitter-api');
var Yelp = require('yelp');
var parse = require('./parse.js')

app.set('port', (process.env.PORT || 5000));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
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


app.post('/search', function(req, res, next) {
  console.log("req", req.body)
  var search = req.body.search;
  var zip = req.body.zipcode;
  // See http://www.yelp.com/developers/documentation/v2/search_api
  yelp.search({ term: search, location: zip })
  .then(function (data) {
    // console.log(data);
    // console.log(parse(data.businesses))
    res.render('index', {results: parse(data.businesses)});
  })
  .catch(function (err) {
    console.error(err);
  });
})


app.get('/auth/twitter', function(req, res) {
  console.log("auth");
  twitter.getRequestToken(function(error, oauth_token, oauth_token_secret, results) {
    if (error) {
      console.log(error);
      res.send("Authentication Failed!");
    }
    else {
      req.session.oauth = {
        token: oauth_token,
        token_secret: oauth_token_secret
      };
      console.log("init auth", req.session.oauth);
      res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token)
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
        }
        else {
          req.session.oauth.access_token = oauth_access_token;
          req.session.oauth.access_token_secret = oauth_access_token_secret;
          console.log("results", JSON.stringify(req.session.oauth.access_token));
          // res.send("Authentication Successful");

          twitter.verifyCredentials(oauth_access_token, oauth_access_token_secret, null, function(error, data, response) {
          	if (error) {
              console.log("something was wrong with either accessToken or accessTokenSecret ")
          	} else {
          		//accessToken and accessTokenSecret can now be used to make api-calls (not yet implemented)
          		//data contains the user-data described in the official Twitter-API-docs
          		//you could e.g. display his screen_name
          		console.log(data);
              res.render('index', {user: data['screen_name']});
          	}
          });

        }
      }
    );

  }
  else {
    res.redirect('/login'); // Redirect to login page
    console.log("no token?", req.session.oauth);
  }

});

// catch all!
app.get('*', function (req, res) {
  res.render('index');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
