import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [username, setUsername] = useState();
    const [email, setEmail] = useState();

    return (
        <UserContext.Provider value={{ username, setUsername, email, setEmail }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
