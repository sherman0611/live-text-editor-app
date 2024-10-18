const mongoose = require("mongoose")
const Document = require("./Document")

mongoose.connect("mongodb://localhost/live-text-editor")

// mongoose.connect("mongodb://localhost/google-docs-clone", {
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
    socket.on("get-document", async documentId => {
        const document = await findOrCreateDocument(documentId)
        socket.join(documentId)
        socket.emit("load-document", document)

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