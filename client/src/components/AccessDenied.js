import React, { useEffect } from 'react'
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from '../utils/authUtils';

function AccessDenied() {
    const navigate = useNavigate();
    const location = useLocation();
    const { checkSession } = useAuth();

    useEffect(() => {
        if (!location.state || !location.state.fromTextEditor) {
            navigate('/home');
            return;
        }
    }, [navigate, location.state]);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    return (
        <div>
            <h1>You do not have access to this file</h1>

            <Link to="/home">Return to home</Link>
        </div>
    );
}

export default AccessDenied;