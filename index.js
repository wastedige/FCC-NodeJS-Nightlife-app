var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

// app.use(express.static(__dirname + '/public'));

// views is directory for all template files
// app.set('views', __dirname + '/views');
// app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.send('Please provide a date!');
});

app.get('/:date', function(request, response) {
  // response.render('pages/index');
});

app.param('date', function(req,res, next, date){
  //do something with id
  //store id or other info in req object
  //call next when done

  res.setHeader('Content-Type', 'application/json');
  res.send( dateToJson(date) );
  //next();
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

var dateToJson = function (date) {
  var dateobj;
  if (isNaN(date) == false) {
    dateobj = new Date(date * 1000) // converts it to milliseconds
  } else {
    if ( isNaN(Date.parse(date)) == false  ) {
      dateobj = new Date(date)
    }
    else {
      dateobj = null;
    }
  }

  // compose JSON
  if (dateobj == null)
    return {
      unix: null,
      natural: null
    }
  else
    return {
      unix: dateobj.getTime() / 1000,
      natural: dateobj.toDateString()
    }
}
