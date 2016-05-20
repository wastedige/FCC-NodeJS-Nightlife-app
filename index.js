var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var session = require('express-session');
var path = require('path');
var twitterAPI = require('node-twitter-api');

app.set('port', (process.env.PORT || 5000));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

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

app.get('/', function(request, response) {
  response.send('hi!');
});

app.get('/2', function(req, res) {
  res.send('h2!');
});


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
          		//something was wrong with either accessToken or accessTokenSecret
          		//start over with Step 1
          	} else {
          		//accessToken and accessTokenSecret can now be used to make api-calls (not yet implemented)
          		//data contains the user-data described in the official Twitter-API-docs
          		//you could e.g. display his screen_name
          		console.log(data);
          	}
          });

          res.redirect('/2'); // You might actually want to redirect!
        }
      }
    );



  }
  else {
    res.redirect('/login'); // Redirect to login page
    console.log("no token?", req.session.oauth);
  }

});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
