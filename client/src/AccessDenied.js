import React, { useEffect} from 'react'
import { Link, useNavigate } from "react-router-dom"
import axios from 'axios';

function AccessDenied() {
    const navigate = useNavigate();

    axios.defaults.withCredentials = true

    // check if user is logged in
    useEffect(() => {
        axios.get('http://localhost:3001/session-check')
            .then(res => {
                if (!res.data.valid) {
                    navigate('/login')
                }
            }).catch(err => {
                console.log(err)
            })
    }, []);

    return (
        <div>
            <h1>You do not have access to this file</h1>

            <Link to="/home">Return to home</Link>
        </div>
    );
}

export default AccessDenied;