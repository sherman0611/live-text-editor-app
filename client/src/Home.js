import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useNavigate, Link } from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid';
import axios from 'axios';

function Home() {
    const navigate = useNavigate();
    const [socket, setSocket] = useState()
    const [documents, setDocuments] = useState([])
    const [username, setUsername] = useState()

    axios.defaults.withCredentials = true
    
    // connect to server
    useEffect(() => {
        const s = io("http://localhost:3001")
        setSocket(s)

        return () => {
            s.disconnect()
        }
    }, [])

    // check if user is logged in
    useEffect(() => {
        axios.get('http://localhost:3001')
            .then(res => {
                if (res.data.valid) {
                    setUsername(res.data.username)
                } else {
                    navigate('/login')
                }
            }).catch(err => {
                console.log(err)
            })
    }, []);

    // Get all documents from the database
    useEffect(() => {
        if (socket == null) return;

        socket.emit("get-all-documents");

        socket.once("receive-all-documents", (documents) => {
            setDocuments(documents);
        });
    }, [socket]);

    const createNewFile = async () => {
        if (socket == null) return;

        let newFileId;
        let isUnique = false;

        while (!isUnique) {
            const newFileId = uuidV4();
            const existingDocument = documents.find(doc => doc._id === newFileId);
            if (!existingDocument) {
                isUnique = true;
            }
        }

        navigate(`/documents/${newFileId}`);
    };

    const deleteFile = (id) => {
        if (socket == null) return;

        socket.emit("delete-document", id);

        socket.once("receive-all-documents", (documents) => {
            setDocuments(documents);
        });
    };

    const logout = () => {
        axios.post('http://localhost:3001/logout')
            .then(() => {
                setUsername(null); 
                navigate('/login'); 
            }).catch(err => {
                console.log('Logout error:', err);
            });
    };
    
    return (
        <div>
            <div>{username} is loggged in</div>
            <h1>Home</h1>
            <ul>
                {documents.length > 0 ? (
                    documents.map((doc) => (
                        <li key={doc._id}>
                            <Link to={`/documents/${doc._id}`}>
                                {doc.filename || 'Untitled Document'}
                            </Link>
                            <button onClick={() => deleteFile(doc._id)}>Delete</button>
                        </li>
                    ))
                ) : (
                    <p>No files</p>
                )}
            </ul>
            <button onClick={createNewFile}>Create new file</button>
            <button onClick={logout}>Log out</button>
        </div>
    );
}

export default Home;