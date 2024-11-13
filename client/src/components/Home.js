import React, { useEffect, useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../UserContext';
import { useAuth } from '../hooks/UseAuth';
import TopBar from './TopBar';
import ClipLoader from 'react-spinners/ClipLoader';

function Home() {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(UserContext);
    const { checkSession } = useAuth();

    useEffect(() => {
        if (!user) {
            navigate('/login')
        } else {
            setLoading(false);
        }
    }, [user, navigate]);

    useEffect(() => {
        checkSession()
    }, [checkSession]);

    useEffect(() => {
        if (!user) return;

        axios.post('http://localhost:3001/get-documents', { email: user.email })
            .then(res => {
                setDocuments(res.data)
                setError(null);
            }).catch(err => {
                console.log(err)
                setError('Failed to retrieve documents');
            }).finally(() => {
                setLoading(false)
            });
    }, [user?.email]);

    const createNewDoc = async () => {
        if (!user) return;

        axios.post('http://localhost:3001/create-new-document', { email: user.email })
            .then(res => {
                navigate(`/documents/${res.data.id}`);
            }).catch(err => {
                console.log(err);
                alert("Error creating new document");
            });
    };

    const deleteDoc = (id) => {
        if (!user) return;

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
            <TopBar/>
            <div className='main-container'>
                <h1>Home</h1>

                {loading && (
                    <div className="loading-screen">
                        <p>Loading documents...</p>
                        <ClipLoader color="#00BFFF" size={50} />
                    </div>
                )}

                {!loading && error && (
                    <p className="error-message">{error}</p>
                )}

                {!loading && !error && (
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
                )}

                <button onClick={createNewDoc}>Create new document</button>
            </div>
        </div>
    );
}

export default Home;