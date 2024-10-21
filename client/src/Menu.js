import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useNavigate, Link } from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid';

function Menu() {
    const navigate = useNavigate();
    const [socket, setSocket] = useState()
    const [documents, setDocuments] = useState([])

    // connect to server
    useEffect(() => {
        const s = io("http://localhost:3001")
        setSocket(s)

        return () => {
            s.disconnect()
        }
    }, [])

    // Get all documents from the database
    useEffect(() => {
        if (socket == null) return;

        socket.emit("get-all-documents");

        socket.once("receive-all-documents", (documents) => {
            setDocuments(documents);
        });
    }, [socket]);

    const openNewFile = () => {
        const newFileId = uuidV4();
        navigate(`/documents/${newFileId}`);
    };

    const deleteFile = (id) => {
        if (socket == null) return;

        socket.emit("delete-document", id);

        socket.once("receive-all-documents", (documents) => {
            setDocuments(documents);
        });
    };
    
    return (
        <div>
            <h1>Home</h1>
            <ul>
                {documents.map((doc) => (
                    <li>
                        <Link to={`/documents/${doc._id}`}>
                            {doc.filename}
                        </Link>
                        <button onClick={() => deleteFile(doc._id)}>Delete</button>
                    </li>
                ))}
            </ul>
            <button onClick={openNewFile}>Open new file</button>
        </div>
    );
}

export default Menu;