import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useNavigate, Link } from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid';
import axios from 'axios';
import { useUser } from './UserContext';

function Home() {
    const navigate = useNavigate();
    const [socket, setSocket] = useState()
    const [documents, setDocuments] = useState([])
    const { username, setUsername, email, setEmail } = useUser();

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
        axios.get('http://localhost:3001/session-check')
            .then(res => {
                if (res.data.valid) {
                    setUsername(res.data.username)
                    setEmail(res.data.email)
                } else {
                    navigate('/login')
                }
            }).catch(err => {
                console.log(err)
                navigate('/login')
            })
    }, []);

    // Get all documents from the database
    useEffect(() => {
        if (socket == null) return;
    
        socket.emit("get-user-documents", email);
    
        const receiveDocuments = (documents) => {
            setDocuments(documents)
        };
    
        socket.on("receive-user-documents", receiveDocuments)
    
        return () => {
            socket.off("receive-user-documents", receiveDocuments)
        };
    }, [socket, email]); 

    const createNewFile = async () => {
        if (socket == null) return;

        let newFileId;
        let isUnique = false;

        while (!isUnique) {
            newFileId = uuidV4();
            const existingDocument = documents.find(doc => doc._id === newFileId);
            if (!existingDocument) {
                isUnique = true;
            }
        }

        navigate(`/documents/${newFileId}`);
    };

    const deleteFile = (id) => {
        if (socket == null) return;

        socket.emit("delete-document", { documentId: id, email});
    };

    const logout = () => {
        axios.post('http://localhost:3001/logout')
            .then(() => {
                setUsername(null)
                setEmail(null)
                navigate('/login')
            }).catch(err => {
                console.log('Logout error:', err)
            });
    };
    
    return (
        <div>
            <div>{username}</div>
            <div>{email}</div>
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