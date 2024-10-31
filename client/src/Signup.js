import React, { useRef } from 'react'
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"

function Signup() {
    const emailRef = useRef()
    const usernameRef = useRef()
    const passwordRef = useRef()
    const navigate = useNavigate()

    const handleSubmit = (e) => {
        e.preventDefault()

        const email = emailRef.current.value;
        const username = usernameRef.current.value;
        const password = passwordRef.current.value;

        axios.post('http://localhost:3001/signup', { email, username, password })
            .then(result => {
                if (result.data === "success") {
                    alert("Account created successfully");
                    navigate('/login')
                }
            }).catch(err => {
                alert(err.response.data.message || "Account creation failed");
            });
    }

    return (
        <div>
            <h1>Sign up</h1>

            <form onSubmit={handleSubmit}>
                <label htmlFor='email'>Email</label>
                <input type='text' placeholder='Email' name='email' ref={emailRef} />
                <label htmlFor='username'>Username</label>
                <input type='text' placeholder='Username' name='username' ref={usernameRef} />
                <label htmlFor='password'>Password</label>
                <input type='password' placeholder='Password' name='password' ref={passwordRef} />
                <button>Sign up</button>
            </form>

            <p>Already have an account?</p>

            <Link to="/login">Log in</Link>
        </div>
    );
}

export default Signup;