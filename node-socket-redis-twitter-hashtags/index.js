var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    fs = require('fs'),
    _ = require('underscore'),
    redis = require('redis'),
    twitter = require('ntwitter'),
    creds, client, twit,
    port = process.env.PORT || 8080,
    STREAM_TIMEOUT = 20, // The stream will automatically end after this value (in seconds), defaults to 20
    TWEETS_TO_KEEP = 10; // The number of tweets to keep in Redis, defaults to 10

/**
 * Start the server
 */
http.listen(port, function() {
    console.log('Server Started. Listening on *:' + port);
});

/**
 * Express Middleware
 */
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

/**
 * Route - Default
 */
app.get('/', function(req, res) {
    res.sendFile('views/index.html', {
        root: __dirname
    });
});

/**
 * API - Search
 */
app.post('/search', function(req, res, next) {
    _searchTwitter(req.body.val);
    res.send({
        status: 'OK'
    });
});

/**
 * Read Cluster credentials from JSON and create a Twitter client
 */
fs.readFile('creds.json', 'utf-8', function(err, data) {
    if(err) throw err;
    creds = JSON.parse(data);
    client = redis.createClient('redis://' + creds.user + ':' + creds.password + '@' + creds.host + ':' + creds.port);
    client.once('ready', function() {
        twit = new twitter({
            consumer_key: creds.consumer_key,
            consumer_secret: creds.consumer_secret,
            access_token_key: creds.access_token_key,
            access_token_secret: creds.access_token_secret
        });
    });
});

/**
 * Stream data from Twitter for input text
 *
 * 1. Use the Twitter streaming API to track a specific value entered by the user
 * 2. Once we have the data from Twitter, add it to a Redis list using LPUSH
 * 3. After adding to list, limit the list using LTRIM so the stream doesn't overflow the disk
 * 4. Use LRANGE to fetch the latest tweet and emit it to the front-end using Socket.io
 *
 * @param  {String} val Query String
 * @return
 */
var _searchTwitter = function(val) {
    twit.stream('statuses/filter', {track: val}, function(stream) {
        stream.on('data', function(data) {
            client.lpush('tweets', JSON.stringify(data), function() {
                client.ltrim('tweets', 0, TWEETS_TO_KEEP, function() {
                    client.lrange('tweets', 0, 1, function(err, tweetListStr) {
                        io.emit('savedTweetToRedis', JSON.parse(tweetListStr[0]));
                    });
                });
            });
        });
        stream.on('destroy', function(response) {
            io.emit('stream:destroy');
        });
        stream.on('end', function(response) {
            io.emit('stream:destroy');
        });
        setTimeout(stream.destroy, STREAM_TIMEOUT * 1000);
    });
}
