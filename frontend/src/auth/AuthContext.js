import { createContext, useContext } from 'react';

// { agent, loading, login, logout }
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
