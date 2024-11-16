import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../UserContext';

axios.defaults.withCredentials = true;

export function useAuth() {
    const navigate = useNavigate();
    const { setUser } = useContext(UserContext);

    const checkSession = () => {
        axios.get('http://localhost:3001/check-session')
            .then(res => {
                if (!res.data.valid) {
                    logout();
                }
            }).catch(err => {
                console.log(err);
                logout();
            });
    };

    const logout = () => {
        axios.get('http://localhost:3001/logout')
            .then(() => {
                setUser(null);
                navigate('/login');
            }).catch(err => {
                console.log('Logout error:', err);
            });
    };

    return { checkSession, logout };
}