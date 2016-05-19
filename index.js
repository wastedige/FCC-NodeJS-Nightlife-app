var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var session = require('express-session');

app.set('port', (process.env.PORT || 5000));
app.use(cookieParser());
app.use(session({
  secret: 'some crappy secret'
}));
// app.use(express.static(__dirname + '/public'));

// views is directory for all template files
// app.set('views', __dirname + '/views');
// app.set('view engine', 'ejs');

var OAuth = require('oauth').OAuth
var oauth = new OAuth(
      "https://api.twitter.com/oauth/request_token",
      "https://api.twitter.com/oauth/access_token",
      "xh3hmd97trRCzGjC7sBpUvsvD",
      "7LD7EGf7QNQSvyJ313unTPf8q6agsSYFrHK5lq2OfGoonrxV1R",
      "1.0",
      "http://yoursite.com/auth/twitter/callback",
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
      console.log(req.session.oauth);
      res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token)
    }
  });

});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
