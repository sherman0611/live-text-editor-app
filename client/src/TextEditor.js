import React, { useCallback, useEffect, useState } from 'react'
import Quill from 'quill'
import "quill/dist/quill.snow.css"
import { io } from 'socket.io-client'
import { useParams } from 'react-router-dom'
import { saveAs } from 'file-saver';
import * as quillToWord from 'quill-to-word';

const SAVE_INTERVAL = 2000
const SAVE_FILENAME_TIMEOUT = 1000

const fontSizeArr = ['10px', '12px', '14px', '16px', '20px', '24px', '32px']

var Size = Quill.import('attributors/style/size');
Size.whitelist = fontSizeArr
Quill.register(Size, true);

const TOOLBAR_OPTIONS = [
    [{ 'size': fontSizeArr }],
    [{ font: [] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: "" }, { align: "center" }, { align: "right" },  { align: "justify" }],
    ["image", "blockquote", "code-block"],
    ["clean"],
]

function TextEditor() {
    const {id: documentId} = useParams()
    const [socket, setSocket] = useState()
    const [quill, setQuill] = useState()
    const [filename, setFilename] = useState();

    // connect to server
    useEffect(() => {
        const s = io("http://localhost:3001")
        setSocket(s)

        return () => {
            s.disconnect()
        }
    }, [])

    useEffect(() => {
        if (socket == null || quill == null) return

        socket.emit("get-document", documentId)
        
        socket.once("load-document", document => {
            setFilename(document.filename)
            quill.setContents(document.data)
            quill.enable()
        })

    }, [socket, quill, documentId])

    // auto save
    useEffect(() => {
        if (socket == null || quill == null) return

        const interval = setInterval(() => {
            socket.emit("save-document", quill.getContents())
        }, SAVE_INTERVAL)

        return () => clearInterval(interval)
    }, [socket, quill])

    // handle received text change event
    useEffect(() => {
        if (socket == null || quill == null) return

        const handler = (delta) => {
            quill.updateContents(delta)
        }

        socket.on("receive-changes", handler)

        return () => {
            socket.off("receive-changes", handler)
        }
    }, [socket, quill])

    // send text change event
    useEffect(() => {
        if (socket == null || quill == null) return

        const handler = (delta, oldDelta, source) => {
            if (source !== 'user') return
            socket.emit("send-changes", delta)
        }

        quill.on("text-change", handler)

        return () => {
            quill.off("text-change", handler)
        }
    }, [socket, quill])

    // update filename
    const handleFilenameChange = (event) => {
        const newFilename = event.target.value;
        
        if (newFilename.trim() === "") {
            setFilename("Untitled");
        } else {
            setFilename(newFilename);
        }
    };

    useEffect(() => {
        if (socket == null || filename == null) return;

        const timeout = setTimeout(() => {
            socket.emit("save-filename", filename);
        }, SAVE_FILENAME_TIMEOUT);

        return () => clearTimeout(timeout);
    }, [socket, filename]);

    // handle received filename change event
    useEffect(() => {
        if (socket == null || quill == null) return

        const handler = (filename) => {
            setFilename(filename);
        }

        socket.on("receive-filename-changes", handler)

        return () => {
            socket.off("receive-filename-changes", handler)
        }
    }, [socket, quill])

    async function downloadFile() {
        const delta = quill.getContents();
        const quillToWordConfig = {
            exportAs: 'blob'
        };
        const docAsBlob = await quillToWord.generateWord(delta, quillToWordConfig);
        saveAs(docAsBlob, `${filename}.docx`);
    }

    // set up quill editor
    const wrapperRef = useCallback(wrapper => {
        if (wrapper == null) return

        wrapper.innerHTML = ""
        const editor = document.createElement('div')
        wrapper.append(editor)
        const q = new Quill(editor, {
            theme: "snow", 
            modules: { toolbar: TOOLBAR_OPTIONS }
        })
        q.enable(false)
        setQuill(q)
    }, [])
    
    return (
        <div className="container">
            <input type="text" id="filename" name="filename" value={filename} maxLength="20" onChange={handleFilenameChange} />
            <button onClick={downloadFile}>Download file</button>
            <div ref={wrapperRef}></div>
        </div>
    )
}

export default TextEditor