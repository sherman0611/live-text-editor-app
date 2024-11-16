import React, { useEffect, useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../UserContext';
import { useAuth } from '../utils/authUtils';
import TopBar from './TopBar';
import ClipLoader from 'react-spinners/ClipLoader';
import '../styles/Home.css';

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
                alert("Document deleted.");
                setDocuments((prevDocuments) => prevDocuments.filter(doc => doc._id !== id));
            }).catch(err => {
                console.log("Error deleting document:", err);
                if (err.response && err.response.data && err.response.data.message) {
                    alert(err.response.data.message);
                } else {
                    alert('Something went wrong. Please try again.');
                }
            });
    }

    function DocumentCard({ doc, onDelete }) {
        const isOwner = doc.access?.[0] === user?.email;

        return (
            <div className="document-card">
                <Link to={`/documents/${doc._id}`}>
                    <div className="document-icon" />
                    <div className="document-info">
                        <p className="document-title">{doc.filename || 'Untitled Document'}</p>
                    </div>
                </Link>
                {isOwner && (
                    <div className="document-actions">
                        <button onClick={onDelete}>Delete</button>
                    </div>
                )}
            </div>
        );
    }

    const myDocuments = documents.filter((doc) => doc.access?.[0] === user?.email);
    const sharedDocuments = documents.filter((doc) => doc.access?.[0] !== user?.email);

    return (
        <div>
            <TopBar />
            <div className="main-container">
                <div className="home-container">
                    <h1>My Documents</h1>

                    {loading && (
                        <div className="loading-screen">
                            <p>Loading documents...</p>
                            <ClipLoader color="#00BFFF" size={50} />
                        </div>
                    )}

                    {!loading && error && <p className="error-message">{error}</p>}

                    {!loading && !error && (
                        <>
                            <h2>My Documents</h2>
                            <div className="document-grid">
                                {myDocuments.length > 0 ? (
                                    myDocuments.map((doc) => (
                                        <DocumentCard
                                            key={doc._id}
                                            doc={doc}
                                            onDelete={() => deleteDoc(doc._id)}
                                        />
                                    ))
                                ) : (
                                    <p>No documents found</p>
                                )}
                            </div>

                            <h2>Shared With Me</h2>
                            <div className="document-grid">
                                {sharedDocuments.length > 0 ? (
                                    sharedDocuments.map((doc) => (
                                        <DocumentCard
                                            key={doc._id}
                                            doc={doc}
                                            onDelete={() => alert('You cannot delete this document.')}
                                        />
                                    ))
                                ) : (
                                    <p>No documents shared with you</p>
                                )}
                            </div>
                        </>
                    )}

                    <button className="create-btn" onClick={createNewDoc}>
                        Create New Document
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Home;