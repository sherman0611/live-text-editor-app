import React, { useEffect, useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../UserContext';
import { useAuth } from '../hooks/UseAuth';

function Home() {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([])
    const { user } = useContext(UserContext);
    const { checkSession, logout } = useAuth();

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    useEffect(() => {
        if (!user?.email) return

        axios.post('http://localhost:3001/get-documents', { email: user.email })
            .then(res => {
                setDocuments(res.data);
            }).catch(err => {
                console.log(err);
            });
    }, [user?.email]);

    const createNewDoc = async () => {
        if (!user?.email) return;

        axios.post('http://localhost:3001/create-new-document', { email: user.email })
            .then(res => {
                navigate(`/documents/${res.data.id}`);
            }).catch(err => {
                console.log(err);
                alert("Error creating new document");
            });
    };

    const deleteDoc = (id) => {
        if (!user?.email) return;

        axios.post('http://localhost:3001/delete-document', { id, email: user.email })
            .then(() => {
                alert("Document deleted");
                setDocuments((prevDocuments) => prevDocuments.filter(doc => doc._id !== id));
            }).catch(err => {
                console.log("Error deleting document:", err);
                alert("Error deleting document");
            });
         
    }

    return (
        <div>
            <div>{user?.username}</div>
            <div>{user?.email}</div>
            <h1>Home</h1>
            <ul>
                {documents.length > 0 ? (
                    documents.map((doc) => (
                        <li key={doc._id}>
                            <Link to={`/documents/${doc._id}`}>
                                {doc.filename || 'Untitled Document'}
                            </Link>
                            <button onClick={() => deleteDoc(doc._id)}>Delete</button>
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