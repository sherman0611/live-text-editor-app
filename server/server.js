const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const http = require('http') 
const Document = require("./models/Document")
const Account = require("./models/Account")

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
app.use(cors())

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
    res.send("Server is running");
});

app.post("/register", (req, res) => {
    const { email, username } = req.body;

    Account.findOne({
        $or: [
            { email: email },
            { username: username }
        ]
    }).then(exist => {
        if (exist) {
            if (exist.email === email) {
                return res.status(400).json({ message: "Email already in use." });
            }
            if (exist.username === username) {
                return res.status(400).json({ message: "Username already exist." });
            }
        } else {
            Account.create(req.body)
                .then(account => {
                    res.json(account);
                    console.log("New account created: ", req.body);
                }).catch(err => {
                    console.error(err);
                    res.status(500).json({ message: "An error occurred while creating the account." });
                });
        }
    }).catch(err => {
        console.error(err);
        res.status(500).json({ message: "An error occurred while connecting to the database." });
    });
});

const defaultFilename = "Untitled"
const defaultValue = ""

io.on("connection", socket => {
    console.log('A user is connected to: ', socket.id);

    socket.on("get-all-documents", async () => {
        try {
            const allDocuments = await Document.find();
            socket.emit("receive-all-documents", allDocuments);
        } catch (error) {
            console.error("Error fetching documents:", error);
        }
    });

    socket.on("delete-document", async (documentId) => {
        try {
            await Document.findByIdAndDelete(documentId);
            const allDocuments = await Document.find();
            socket.emit("receive-all-documents", allDocuments);
        } catch (error) {
            console.error("Error deleting document:", error);
        }
    });

    socket.on("get-document", async documentId => {
        try {
            const document = await findOrCreateDocument(documentId)
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

async function findOrCreateDocument(id) {
    if (id == null) return

    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({ _id: id, filename: defaultFilename, data: defaultValue })
}