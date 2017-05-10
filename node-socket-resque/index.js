var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var fs = require('fs');
var creds = '';

var striptags = require('striptags');

var redis = require('redis');
var client = '';

var util = require('util');

var NR = require('node-resque');

var async = require('async');
var _ = require('underscore');

var errorHandler = require('api-error-handler');

var port = process.env.PORT || 8080;

var multiWorker, scheduler;

var statusPolling = 0, statusWorking = 0, statusDone = 0;

var interval;

http.listen(port, function() {
    console.log('Server Started. Listening on *:' + port);
});

app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

var api = new express.Router();
api.use(errorHandler());
app.use('/api', api);

app.get('/', function(req, res) {
    res.sendFile('views/index.html', {
        root: __dirname
    });
});

app.post('/api/reset', function(req, res, next) {
    clearInterval(interval);
    io.close();
    res.send({
        status: 'OK'
    });
});

app.post('/api/connect', function(req, res, next) {
    var password = req.body.conn_password,
        host = req.body.conn_host,
        port = req.body.conn_port;
    client = redis.createClient('redis://' + ':' + password + '@' + host + ':' + port);
    client.on('connect', function() {
        res.send({
            status: 'OK'
        });
        _init();
    });
    client.on('error', function(err) {
        return next(err);
    });
});

var _init = function() {
    var connectionDetails = {
        redis: client
    };

    var queue = new NR.queue({
        connection: connectionDetails
    });

    queue.on('error', function(error) {
        console.log(error);
    });

    var _processQueue = function() {
        var mainData = [];
        var count = 0;
        queue.queues(function(e, qList) {
            async.each(qList, function(q, cb) {
                queue.queued(q, 0, -1, function(e, jobs) {
                    var data = {
                        q: q,
                        jobs: jobs
                    };
                    mainData.push(data);
                    count++;
                    if (count === qList.length) {
                        cb(mainData);
                    }
                });
            }, function(e) {
                io.emit('qData', mainData);
            });
        });
        queue.allWorkingOn(function(e, hashList) {
            io.emit('qWorkersHashList', hashList);
        });
        queue.stats(function(e, cs) {
            io.emit('clusterStats', cs);
        });
    };

    var _updateQueue = function() {
        var mainData = [];
        var count = 0;
        queue.queues(function(e, qList) {
            async.each(qList, function(q, cb) {
                queue.queued(q, 0, -1, function(e, jobs) {
                    var data = {
                        q: q,
                        jobs: jobs
                    };
                    mainData.push(data);
                    count++;
                    console.log(count, qList.length);
                    if (count === qList.length) {
                        cb(mainData);
                    }
                });
            }, function(e) {
                console.log('woot');
                io.emit('qDataUpdate', mainData);
            });
        });
        queue.allWorkingOn(function(e, hashList) {
            io.emit('qWorkersHashListUpdate', hashList);
        });
        queue.stats(function(e, cs) {
            io.emit('clusterStatsUpdate', cs);
        });
    };

    queue.connect(function() {
        _processQueue();
        interval = setInterval(function() {
            _updateQueue();
        }, 3000);
    });
};
