const express 		= require('express');
const logger 	    = require('morgan');
const bodyParser 	= require('body-parser');
const pe         = require('parse-error');
const cors       = require('cors');

const routes = require('./routes')(express);

const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// CORS
app.use(cors());

// API Routes
app.use('/', routes);

// Serve frontend app
app.get('/', function(req, res) {
	res.sendFile(require('path').join(__dirname + '/frontend/index.html'));
});

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//This is here to handle all the uncaught promise rejections
process.on('unhandledRejection', error => {
    console.error('Uncaught Error', pe(error));
});

const port = '7878';
//Listen to port
app.listen(port);
console.log("Listening to port: " + port);
