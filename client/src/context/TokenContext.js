import { createContext, useContext, useState, useEffect } from "react";

const TokenContext = createContext();

export const TokenProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem("accessToken"); // Load from localStorage on app start
  });

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken); // Save whenever accessToken changes
    } else {
      localStorage.removeItem("accessToken"); // Cleanup if token is cleared
    }
  }, [accessToken]);

  return (
    <TokenContext.Provider value={{ accessToken, setAccessToken }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useToken = () => useContext(TokenContext);
