import React, { useRef, useEffect, useContext } from 'react'
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { UserContext } from '../UserContext';

function Login() {
    const emailRef = useRef()
    const passwordRef = useRef()
    const navigate = useNavigate()
    const { user, setUser } = useContext(UserContext);

    axios.defaults.withCredentials = true

    // check if user is logged in
    useEffect(() => {
        axios.get('http://localhost:3001/session-check')
            .then(res => {
                if (res.data.valid) {
                    navigate('/home')
                }
            }).catch(err => {
                console.log(err)
            })
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault()

        const email = emailRef.current.value;
        const password = passwordRef.current.value;

        axios.post('http://localhost:3001/login', { email, password })
            .then(res => {
                if (res.data.success) {
                    setUser({ username: res.data.username, email: res.data.email });
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