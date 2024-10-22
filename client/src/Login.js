import React, { useState } from 'react'
import { Link } from "react-router-dom"
import axios from "axios"

function Login() {
    const [username, setUsername] = useState()
    const [password, setPassword] = useState()

    const handleSubmit = (e) => {
        // e.preventDefault()
        // axios.post('', {username, password})
        // .then(result => {
        //     console.log(result)
        // }).catch(err => {
        //     console.log(err)
        // })
    }

    return (
        <div>
            <h1>Log in</h1>

            <form onSubmit={handleSubmit}>
                <label htmlFor='username'>Username</label>
                <input type='text' placeholder='Username' name='username' onChange={(e) => setUsername(e.target.value)} />
                <label htmlFor='password'>Password</label>
                <input type='text' placeholder='Password' name='password' onChange={(e) => setPassword(e.target.value)} />
                <button>Login</button>
            </form>

            <p>Don't have an account yet?</p>

            <Link to="/signup">Sign up</Link>
        </div>
    );
}

export default Login;