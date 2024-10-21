const mongoose = require("mongoose")
const Document = require("./Document")

mongoose.connect("mongodb://localhost/live-text-editor")

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// mongoose.connect("mongodb://localhost/live-text-editor", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     // useFindAndModify: false,
//     // useCreateIndex: true,
// })

const io = require('socket.io')(3001, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
})

const defaultFilename = "Untitled"
const defaultValue = ""

io.on("connection", socket => {

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