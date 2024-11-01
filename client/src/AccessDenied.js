import React, { useEffect } from 'react'
import { Link, useNavigate, useLocation } from "react-router-dom"
import axios from 'axios';

function AccessDenied() {
    const navigate = useNavigate();
    const location = useLocation();

    axios.defaults.withCredentials = true

    // check if user is logged in
    useEffect(() => {
        if (!location.state || !location.state.fromTextEditor) {
            navigate('/home');
            return;
        }

        axios.get('http://localhost:3001/session-check')
            .then(res => {
                if (!res.data.valid) {
                    navigate('/login');
                }
            }).catch(err => {
                console.log(err);
            });
    }, [navigate, location.state]);

    return (
        <div>
            <h1>You do not have access to this file</h1>

            <Link to="/home">Return to home</Link>
        </div>
    );
}

export default AccessDenied;