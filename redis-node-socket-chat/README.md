# Chat App with Redis + Node + Socket.io

This repository contains code for a chat application built using the following web technologies:

- [Redis](https://redis.io/)
- [Node.js](https://nodejs.org/en/)
- [Express.js](http://expressjs.com/)
- [Socket.IO](http://socket.io/)

The original blog post can be found at the following link: [Link_Blog_Here](http://google.com)

The Installation process assumes that you already have the above technologies installed on your machine.

## Install

Give download link here

Navigate to the folder and run:

```
npm install
```

To start the server, you can run:

```
npm start
```

The server should start at port 8080 (default). Navigate to [http://localhost:8080](http://localhost:8080) to see the demo.

Although, before doing that, you might want to flush the DB and start with 0 users.

For that, you can uncomment the line in `index.js` that says `client.flushdb();`

Once that is done, you are ready to go. Remember to restart the server if you intend to make any changes to the code.

You can also use something like [nodemon](https://nodemon.io/) to watch your files and restart the server automatically!

## Additional Info

For the full blog post, check out the following link: https://scalegrid.io/blog/using-redis-with-node-js-and-socket-io/

Check out a hosted version of the demo: https://node-socket-redis-chat.herokuapp.com/

[Start your free 14-day trial](https://console.scalegrid.io/users/register) by creating your first Redis cluster on ScaleGrid! No credit card required.
