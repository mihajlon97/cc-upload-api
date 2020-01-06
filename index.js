require('dotenv').config()
const express 		= require('express');
const logger 	    = require('morgan');
const bodyParser 	= require('body-parser');
const pe         = require('parse-error');
const cors       = require('cors');

const routes = require('./routes')(express);

const app = express();
var http = require('http').Server(app);

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


const port = '7878';

//Listen to port
// let server = app.listen(port);
// console.log("Listening to port: " + port);
// http.listen(port, () => {
// 	console.log("Listening to port: " + port);
// });

http.listen(port, function(){
	console.log('Listening on port:' + port);
});

// Socket.io
let io = require('socket.io')(http);

io.on('connection', socket => {
	console.log('SOCKET CONNECTED');
	socket.on('image_selected', function(data){
		console.log('SOCKET', data)
	});

	setInterval(() => {
		socket.emit('progress', 10);
	}, 1000);
});


