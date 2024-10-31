const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const http = require('http')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
// const jwt = require('jsonwebtoken') 
const Document = require("./models/Document")
const User = require("./models/User")

// connect server to mongodb
mongoose.connect("mongodb://localhost/live-text-editor")
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// set up express server
const app = express()
app.use(express.json())
app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["POST", "GET"],
    credentials: true
}))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24
    }
}))

const server = http.createServer(app)

// set up socket.io server
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
})

// start server
server.listen(3001, () => {
    console.log("Server is running on port 3001")
})

app.get("/", (req, res) => {
    if (req.session.username && req.session.email) {
        res.json({valid: true, username: req.session.username, email: req.session.email})
    } else {
        res.json({valid: false})
    }
});

app.post("/login", async (req, res) => {
    const {email, password} = req.body

    await User.findOne({email: email})
        .then(result => {
            if (result) {
                if (result.password == password) {
                    req.session.username = result.username
                    req.session.email = result.email
                    res.json({login: true})
                } else {
                    res.status(400).json({ message: "Incorrect password" })
                }
            } else {
                res.status(400).json({ message: "Incorrect email" })
            }
        }).catch(err => {
            console.error(err)
            res.status(500).json({ message: "An error occurred while connecting to the database." })
        });
})

app.post("/signup", async (req, res) => {
    const { email, username } = req.body

    await User.findOne({
        $or: [
            { email: email },
            { username: username }
        ]
    }).then(async exist => {
        if (exist) {
            if (exist.email === email) {
                return res.status(400).json({ message: "Email already in use." })
            }
            if (exist.username === username) {
                return res.status(400).json({ message: "Username already exist." })
            }
        } else {
            await User.create(req.body)
                .then(user => {
                    res.status(200).json("success")
                    console.log("New account created: ", req.body);
                }).catch(err => {
                    console.error(err)
                    res.status(500).json({ message: "An error occurred while creating account." })
                });
        }
    }).catch(err => {
        console.error(err)
        res.status(500).json({ message: "An error occurred while connecting to the database." })
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Log out failed');
        }
        res.clearCookie('connect.sid');
        res.send({ success: true });
    });
});

const defaultFilename = "Untitled"
const defaultValue = ""

io.on("connection", socket => {
    console.log('A user is connected to: ', socket.id);

    socket.on("get-all-documents", async (email) => {
        try {
            const allDocuments = await Document.find({ access: { $in: [email] } });
            socket.emit("receive-all-documents", allDocuments);
        } catch (error) {
            console.error("Error fetching documents:", error);
        }
    });

    socket.on("delete-document", async ({ documentId, email }) => {
        try {
            await Document.findByIdAndDelete(documentId);
            const allDocuments = await Document.find({ access: { $in: [email] } });
            socket.emit("receive-all-documents", allDocuments);
        } catch (error) {
            console.error("Error deleting document:", error);
        }
    });

    socket.on("get-document", async ({ documentId, email }) => {
        try {
            const document = await findOrCreateDocument(documentId, email)
            socket.join(documentId)
            socket.emit("load-document", document)
        } catch (error) {
            console.error("Error loading document:", error);
        }
        

        socket.on("send-changes", delta => {
            socket.broadcast.to(documentId).emit("receive-changes", delta)
        })

        socket.on("save-document", async data => {
            await Document.findByIdAndUpdate(documentId, { data })
        })

        socket.on("save-filename", async filename => {
            await Document.findByIdAndUpdate(documentId, { filename })
            socket.broadcast.to(documentId).emit("receive-filename-changes", filename)
        })
    })
})

async function findOrCreateDocument(id, email) {
    if (id == null) return

    const document = await Document.findById(id)
    if (document) return document

    return await Document.create({ _id: id, 
        filename: defaultFilename, 
        data: defaultValue,
        access: [email]
    })
}