import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useUser } from './UserContext';

function Home() {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([])
    const { username, setUsername, email, setEmail } = useUser();

    axios.defaults.withCredentials = true

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

    // Get documents from the database
    useEffect(() => {
        axios.post('http://localhost:3001/get-documents', { email })
            .then(res => {
                setDocuments(res.data)
            }).catch(err => {
                console.log(err)
            })
    }, [email, documents]); 

    const createNewDoc = async () => {
        axios.post('http://localhost:3001/create-new-document')
            .then(res => {
                navigate(`/documents/${res.data.id}`);
            }).catch(err => {
                console.log(err)
                alert("Error creating new document")
            })

        
    };

    const deleteFile = (id) => {
        axios.post('http://localhost:3001/delete-document', {  id, email })
            .then(() => {
                alert("Document deleted")
                setDocuments((prevDocuments) => prevDocuments.filter(doc => doc._id !== id));
            })
            .catch(err => {
                console.log("Error deleting document:", err);
                alert("Error deleting document")
            });
    };

    const logout = () => {
        axios.get('http://localhost:3001/logout')
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
            <button onClick={createNewDoc}>Create new document</button>
            <button onClick={logout}>Log out</button>
        </div>
    );
}

export default Home;