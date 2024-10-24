import React, { useRef } from 'react'
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"

function Login() {
    const emailRef = useRef()
    const passwordRef = useRef()
    const navigate = useNavigate()

    const handleSubmit = (e) => {
        e.preventDefault()

        const email = emailRef.current.value;
        const password = passwordRef.current.value;

        axios.post('http://localhost:3001/login', { email, password })
            .then(result => {
                if (result.data === "success") {
                    navigate('/home')
                }
            }).catch(err => {
                alert(err.response.data.message || "Log in failed");
            });
    }

    return (
        <div>
            <h1>Log in</h1>

            <form onSubmit={handleSubmit}>
                <label htmlFor='email'>Email</label>
                <input type='text' placeholder='Email' name='email' ref={emailRef} />
                <label htmlFor='password'>Password</label>
                <input type='password' placeholder='Password' name='password' ref={passwordRef} />
                <button>Log in</button>
            </form>

            <p>Don't have an account yet?</p>

            <Link to="/signup">Sign up</Link>
        </div>
    );
}

export default Login;