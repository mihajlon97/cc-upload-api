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
let {subscriber, publisher} = require('./redis');

subscriber.subscribe("java_node_channel_1");
subscriber.subscribe("java_node_channel_2");
subscriber.subscribe("java_node_channel_3");
subscriber.subscribe("java_node_channel_4");

io.on('connection', socket => {
	console.log('Client connected');

	subscriber.on("message",(channel,message) => {
		if (channel.indexOf('java_node_channel_') !== -1) {
			console.log("Received data :"+message + " Channel: " + channel);
			socket.emit('progress', 20);
		}
	});
	/*
	publisher.publish("java_node_channel_1", 'da---da');
	setInterval(() => {
		console.log('Progress plus 10');
		socket.emit('progress', 10);
	}, 3000);
	*/
});

