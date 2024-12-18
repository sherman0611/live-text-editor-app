import React, { useCallback, useEffect, useState, useContext, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Quill from 'quill'
import "quill/dist/quill.snow.css"
import { io } from 'socket.io-client'
import { saveAs } from 'file-saver';
import * as quillToWord from 'quill-to-word';
import axios from 'axios';
import { UserContext } from '../UserContext';
import { useAuth } from '../utils/authUtils';
import TopBar from './TopBar';
import PopupWindow from '../utils/PopupWindow';

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
    const navigate = useNavigate()
    const {id: documentId} = useParams()
    const [socket, setSocket] = useState()
    const [quill, setQuill] = useState()
    const [filename, setFilename] = useState("Untitled");
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [userAccessList, setUserAccessList] = useState([]);
    const [message, setMessage] = useState('');
    const emailRef = useRef()
    const { user } = useContext(UserContext);
    const { checkSession } = useAuth();

    useEffect(() => {
        if (!user) navigate('/login')
    }, [user, navigate]);

    // connect to socket server
    useEffect(() => {
        const s = io("http://localhost:3001")
        setSocket(s)

        return () => {
            s.disconnect()
        }
    }, [])

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    // handle document access
    useEffect(() => {
        if (socket == null || quill == null || !user?.email) return

        axios.post(`http://localhost:3001/documents/${documentId}`, { email: user.email })
            .then(res => {
                if (res.data.notFound) {
                    navigate('*');
                } else if (!res.data.hasAccess) {
                    navigate('/access-denied', { state: { fromTextEditor: true } });
                }
            }).catch(err => {
                console.log(err)
            })

        socket.emit("document-request", { documentId });
        
        socket.once("load-document", document => {
            setFilename(document.filename)
            quill.setContents(document.data)
            quill.enable()
        })

    }, [socket, quill, user?.email])

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
        setFilename(event.target.value.trim() === "" ? "Untitled" : event.target.value);
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

    // fetch users when opening user access window
    useEffect(() => {
        if (isPopupOpen && documentId) {
            fetchUserAccessList();
            setMessage('')
        }
    }, [isPopupOpen, documentId]);

    async function downloadFile() {
        const delta = quill.getContents();
        const quillToWordConfig = {
            exportAs: 'blob'
        };
        const docAsBlob = await quillToWord.generateWord(delta, quillToWordConfig);
        saveAs(docAsBlob, `${filename}.docx`);
    }

    function fetchUserAccessList() {
        axios.post(`http://localhost:3001/document-access/${documentId}`)
            .then(res => {
                setUserAccessList(res.data.users || []);
            })
            .catch(err => {
                console.error("Failed to fetch user access list:", err);
                alert("Failed to fetch user access list");
            });
    };

    function addUserAccess() {
        const email = emailRef.current.value;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setMessage({ type: 'error', text: 'Please enter a valid email address.' });
            return;
        }

        axios.post(`http://localhost:3001/add-user-access/${documentId}`, { email })
            .then(res => {
                if (res.data.success) {
                    fetchUserAccessList()
                    setMessage({ type: 'success', text: `${email} added.` })
                }
            }).catch(err => {
                fetchUserAccessList();
                if (err.response && err.response.data && err.response.data.message) {
                    setMessage({ type: 'error', text: err.response.data.message })
                } else {
                    setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
                }
            });
    }

    function removeUserAccess(email) {
        axios.post(`http://localhost:3001/remove-user-access/${documentId}`, { email })
            .then(res => {
                if (res.data.success) {
                    fetchUserAccessList();
                    setMessage({ type: 'success', text: `${email} removed.` })
                }
            })
            .catch(err => {
                fetchUserAccessList();
                if (err.response && err.response.data && err.response.data.message) {
                    setMessage({ type: 'error', text: err.response.data.message })
                } else {
                    setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
                }
            });
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
        <div>
            <TopBar/>
            <div className='main-container'>
                <div className="container">
                    <input type="text" id="filename" name="filename" value={filename} maxLength="20" onChange={handleFilenameChange} />
                    <button onClick={downloadFile}>Download file</button>
                    <button onClick={() => setPopupOpen(true)}>User access</button>
                    <div ref={wrapperRef}></div>
                </div>
            </div>

            <PopupWindow isOpen={isPopupOpen} onClose={() => setPopupOpen(false)}>
                <h3>User Access</h3>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <h4>Users with access:</h4>
                <div className='scrollable'>
                    {userAccessList.map((email, index) => (
                        <div key={index}>
                            <span>{email}</span>
                            {email !== user?.email && (
                                <button onClick={() => removeUserAccess(email)}>
                                    x
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <h4>Add user access:</h4>
                <input type='text' placeholder='Email' name='email' ref={emailRef} />
                <button className='submit-button' onClick={addUserAccess}>Add</button>
            </PopupWindow>
        </div>
    )
}

export default TextEditor