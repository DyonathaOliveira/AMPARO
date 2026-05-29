import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User, AuthResponse } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("amparo_user");
    return saved ? JSON.parse(saved) : null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("amparo_token");
  });

  useEffect(() => {
    if (user) localStorage.setItem("amparo_user", JSON.stringify(user));
    else localStorage.removeItem("amparo_user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("amparo_token", token);
    else localStorage.removeItem("amparo_token");
  }, [token]);

  const login = (authResponse: AuthResponse) => {
    setUser(authResponse.user);
    setToken(authResponse.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
