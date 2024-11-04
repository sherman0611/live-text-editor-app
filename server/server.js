const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const http = require('http')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid');
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
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Incorrect email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        // // regenerate session id
        // req.session.regenerate((err) => {
        //     if (err) {
        //         console.error("Session regeneration error:", err);
        //         return res.status(500).json({ message: "Session error." });
        //     }
            
        //     req.session.username = user.username;
        //     req.session.email = user.email;

        //     res.json({ success: true, username: user.username, email: user.email });
        // });

        req.session.username = user.username;
        req.session.email = user.email;

        res.json({ success: true, username: user.username, email: user.email });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ message: "An error occurred while connecting to the database." });
    }
})

app.post("/signup", async (req, res) => {
    const { email, username, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create({
            email,
            username,
            password: hashedPassword
        });

        res.json({ success: true });
    } catch (err) {
        console.error("Error during signup:", err);
        res.status(500).json({ message: "An error occurred while creating the account." });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error during logout:", err);
            return res.status(500).send('Log out failed');
        }
        res.clearCookie('connect.sid');
        res.send({ success: true });
    });
});

app.post("/get-documents", async (req, res) => {
    const { email } = req.body;

    try {
        const userDocuments = await Document.find({ access: { $in: [email] } });
        res.json(userDocuments);
    } catch (err) {
        console.error("Error fetching documents:", err);
        res.status(500).json({ message: "Failed to fetch documents." });
    }
});

app.post("/delete-document", async (req, res) => {
    const { id, email } = req.body;

    try {
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: "Document not found." });
        }

        if (!document.access.includes(email)) {
            return res.status(403).json({ message: "You do not have permission to delete this document." });
        }

        await Document.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ message: "Failed to delete document." });
    }
});

app.post("/create-new-document", async (req, res) => {
    try {
        let uniqueId;
        let isUnique = false;

        while (!isUnique) {
            uniqueId = uuidv4();
            const existingDocument = await Document.findById(uniqueId);

            if (!existingDocument) {
                isUnique = true;
            }
        }

        res.json({ id: uniqueId });
    } catch (error) {
        console.error("Error generating unique document ID:", error);
        res.status(500).json({ message: "Failed to create unique document ID." });
    }
});

app.post("/check-document-access", async (req, res) => {
    const { documentId, email } = req.body;

    try {
        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({ message: "Document not found." });
        }

        const hasAccess = document.access.includes(email);
        res.json({ hasAccess });
    } catch (error) {
        console.error("Error checking document access:", error);
        res.status(500).json({ message: "Error checking document access." });
    }
});

const defaultFilename = "Untitled"
const defaultValue = ""

io.on("connection", socket => {
    console.log('A user is connected to: ', socket.id);

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