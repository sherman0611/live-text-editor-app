import React, { useRef, useState } from 'react'
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import '../styles/Login.css';

function Signup() {
    const navigate = useNavigate()
    const emailRef = useRef()
    const usernameRef = useRef()
    const passwordRef = useRef()
    const passwordRef2 = useRef()
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordRules, setPasswordRules] = useState({
        minLength: false,
        hasUppercase: false,
        hasSpecialChar: false,
    });

    const togglePasswordVisibility = () => {
        setShowPassword(prevState => !prevState);
    };

    const validatePassword = (password) => {
        const rules = {
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
        setPasswordRules(rules);
        return rules;
    };

    const isPasswordValid = (rules) => {
        return Object.values(rules).every(Boolean);
    };

    const handlePasswordChange = (e) => {
        const password = e.target.value;
        validatePassword(password);
    };

    const handleSubmit = (e) => {
        e.preventDefault()

        const email = emailRef.current.value;
        const username = usernameRef.current.value;
        const password = passwordRef.current.value;
        const password2 = passwordRef2.current.value;

        if (!email || !username || !password || !password2) {
            setMessage({ type: 'error', text: 'All fields are required.' });
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setMessage({ type: 'error', text: 'Please enter a valid email address.' });
            return;
        }

        if (!username || username.trim().length === 0) {
            setMessage({ type: 'error', text: 'Username is required.' });
            return;
        }
    

        if (!isPasswordValid(passwordRules)) {
            setMessage({ type: 'error', text: 'Password does not meet the criteria.' });
            return 
        }

        if (password != password2) {
            setMessage({ type: 'error', text: 'Passwords does not match.' });
            return
        }

        axios.post('http://localhost:3001/signup', { email, username, password })
            .then(res => {
                if (res.data.success) {
                    setMessage({ type: 'success', text: 'Account created successfully!' });
                    setTimeout(() => navigate('/login'), 2000)
                }
            }).catch(err => {
                if (err.response && err.response.data && err.response.data.message) {
                    setMessage({ type: 'error', text: err.response.data.message });
                } else {
                    setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
                }
            });
    }

    return (
        <div className='login-container'>
            <div>
                <h1>Sign up</h1>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor='email'>Email</label>
                    <input type='text' placeholder='Email' name='email' ref={emailRef} />

                    <label htmlFor='username'>Username</label>
                    <input type='text' placeholder='Username' name='username' ref={usernameRef} />

                    <label htmlFor='password'>Password</label>
                    <div className="password-container">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder='Password'
                            name='password'
                            ref={passwordRef}
                            onChange={handlePasswordChange}
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="show-password-button"
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <div className="password-rules">
                        <p className={passwordRules.minLength ? "valid" : "invalid"}>
                            Password must be at least 8 characters long
                        </p>
                        <p className={passwordRules.hasUppercase ? "valid" : "invalid"}>
                            Password must contain at least one uppercase letter
                        </p>
                        <p className={passwordRules.hasSpecialChar ? "valid" : "invalid"}>
                            Password must contain at least one special character
                        </p>
                    </div>

                    <label htmlFor='password'>Re-enter Password</label>
                    <input type='password' placeholder='Re-enter Password' name='password' ref={passwordRef2} />

                    <button>Sign up</button>
                </form>

                <p>Already have an account? <Link to="/login">Log in</Link></p>
            </div>
        </div>
    );
}

export default Signup;