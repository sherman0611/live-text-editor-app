import React from 'react'
import { Link, useNavigate } from "react-router-dom"

function NotFound() {
    return (
        <div>
            <h1>Page not found</h1>

            <Link to="/home">Return to home</Link>
        </div>
    );
}

export default NotFound;