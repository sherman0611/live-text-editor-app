import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../UserContext';
import { useAuth } from '../hooks/UseAuth';
import '../styles.css';

const TopBar = () => {
    const { user } = useContext(UserContext);
    const { logout } = useAuth();

    return (
        <header className="top-bar">
            <nav className='top-bar__nav'>
                <div className="top-bar__logo">
                    <Link to="/home">Home</Link>
                </div>

                <div className="top-bar__user-info">
                    {user && (
                        <>
                            <span>{user.username}</span>
                            <span>{user.email}</span>
                        </>
                    )}
                </div>

                <button className="top-bar__logout" onClick={logout}>Log out</button>
            </nav>
        </header>
    );
};

export default TopBar;
