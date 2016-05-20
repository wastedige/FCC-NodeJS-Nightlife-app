var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var session = require('express-session');

app.set('port', (process.env.PORT || 5000));
app.use(cookieParser());
app.use(session({
  secret: 'some crappy secret'
}));

// http://codetheory.in/how-to-use-twitter-oauth-with-node-oauth-in-your-node-js-express-application/
var OAuth = require('oauth').OAuth
var oauth = new OAuth(
      "https://api.twitter.com/oauth/request_token",
      "https://api.twitter.com/oauth/access_token",
      "xh3hmd97trRCzGjC7sBpUvsvD",
      "7LD7EGf7QNQSvyJ313unTPf8q6agsSYFrHK5lq2OfGoonrxV1R",
      "1.0",
      "http://localhost:5000/auth/twitter/callback",
      "HMAC-SHA1"
    );

app.get('/', function(request, response) {
  response.send('hi!');
});


app.get('/auth/twitter', function(req, res) {
  console.log("auth");
  oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
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

    oauth.getOAuthAccessToken(
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
          console.log("results", req.session.oauth);
          res.send("Authentication Successful");
          // res.redirect('/'); // You might actually want to redirect!
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
