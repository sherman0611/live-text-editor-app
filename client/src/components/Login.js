import React, { useRef, useEffect, useContext, useState } from 'react'
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { UserContext } from '../UserContext';
import '../styles/Login.css';

function Login() {
    const navigate = useNavigate()
    const emailRef = useRef()
    const passwordRef = useRef()
    const { setUser } = useContext(UserContext);
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    axios.defaults.withCredentials = true

    // check if user is logged in
    useEffect(() => {
        axios.get('http://localhost:3001/check-session')
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

        if (!email || !password) {
            setMessage({ type: 'error', text: 'All fields are required.' });
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setMessage({ type: 'error', text: 'Please enter a valid email address.' });
            return;
        }

        axios.post('http://localhost:3001/login', { email, password })
            .then(res => {
                if (res.data.success) {
                    setUser({ username: res.data.user.username, email: res.data.user.email });
                    navigate('/home')
                }
            }).catch(err => {
                if (err.response && err.response.data && err.response.data.message) {
                    setMessage({ type: 'error', text: err.response.data.message });
                } else {
                    setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
                }
            });
    }

    const togglePasswordVisibility = () => {
        setShowPassword(prevState => !prevState);
    };

    return (
        <div className='login'>
            <div>
                <h1>Log in</h1>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor='email'>Email</label>
                    <input type='text' placeholder='Email' name='email' ref={emailRef} />
                    <label htmlFor='password'>Password</label>
                    <div className="password-container">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder='Password'
                            name='password'
                            ref={passwordRef}
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="show-password-button"
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <button>Log in</button>
                </form>

                <p>Don't have an account yet? <Link to="/signup">Sign up</Link></p> 
            </div>
        </div>
    );
}

export default Login;