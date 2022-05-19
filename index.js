
const express = require('express')
const app = express()
const http = require('http')
const socketio = require('socket.io')
const redis = require('redis')
const { message } = require('statuses')
const client = redis.createClient()
client.connect();

app.set('view engine','ejs')
port = 3001
const server = http.createServer(app)
const io = socketio(server).listen(server)

function sendMessage(socket){
    client.lRange('messages','0','-1', (err,data) => {
        data.map(x => {
            const usernameMessage = x.split(':')
            const redisUsername = usernameMessage[0]
            const redisMessage = usernameMessage[1]

            io.emit('message', {
                from: redisUsername,
                message: redisMessage
            })
        })
    })
}

io.on('connection',  socket => {
    sendMessage()
    socket.on("message", async ({ message, from }) => {
        await client.rPush('messages', `${from}: ${message}`)

        io.emit("message", { from, message });
    });
})


app.get("/chat", (req, res) => {
    const username = req.query.username;

    io.emit("joined", username);
    res.render("chat", { username });
})

app.get('/', (req,res) => {
    res.render('index')
})

server.listen(port, () => {
    console.log(`server up and running on http://localhost:${port}`)
})