const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const http = require('http')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
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

app.get("/session-check", (req, res) => {
    if (req.session && req.session.username && req.session.email) {
        res.json({valid: true, username: req.session.username, email: req.session.email})
    } else {
        res.json({valid: false})
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body

    await User.findOne({ email })
        .then(async exist => {
            if (exist) {
                const isMatch = await bcrypt.compare(password, exist.password);
                if (isMatch) {
                    req.session.username = exist.username
                    req.session.email = exist.email
                    res.json({success: true})
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

    await User.findOne({ email })
        .then(async exist => {
            if (exist) {
                return res.status(400).json({ message: "Email already in use." })
            } else {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(req.body.password, salt);

                await User.create({email, username, password: hashedPassword})
                    .then(() => {
                        res.json({success: true})
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

    socket.on("get-user-documents", async (email) => {
        try {
            const userDocuments = await Document.find({ access: { $in: [email] } });
            socket.emit("receive-user-documents", userDocuments);
        } catch (error) {
            console.error("Error fetching documents:", error);
            socket.emit("receive-user-documents", { error: "Failed to fetch documents." });
        }
    });

    socket.on("delete-document", async ({ documentId, email }) => {
        try {
            await Document.findByIdAndDelete(documentId);
            const userDocuments = await Document.find({ access: { $in: [email] } });
            socket.emit("receive-user-documents", userDocuments);
        } catch (error) {
            console.error("Error deleting document:", error);
        }
    });

    socket.on("get-document", async ({ documentId, email }) => {
        try {
            const document = await findOrCreateDocument(documentId, email)
            if (!document.access.includes(email)) {
                socket.emit("access-denied")
                return
            }
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