var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var a =require('./routes/join');
var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/data',a);


// error handler
app.use(function(err, req, res, next) {
	if(err.name=="SequelizeConnectionError")
 {
  console.log("Hi")
  // set locals, only providing error in development
 
  res.locals.message = "in valid database name";
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
 };
});
/*if(err.name=="SequelizeConnectionError")
 {
  console.log("Hello")
  res.locals.message ="Invalid DB Name";
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
   
 }*/
module.exports = app;