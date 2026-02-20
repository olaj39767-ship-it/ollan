// "use client";
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { User } from '../types/auth';

// interface AuthContextType {
//   user: User | null;
//   setUser: (user: User | null) => void;
//   logout: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     const storedUser = localStorage.getItem('user');
//     console.log('Token from localStorage:', token ? 'Present' : 'Missing');
//     console.log('Stored user from localStorage:', storedUser);

//     if (storedUser) {
//       try {
//         const parsedUser: User = JSON.parse(storedUser);
//         console.log('Parsed user from localStorage:', parsedUser);
//         setUser(parsedUser);
//       } catch (error) {
//         console.error('Error parsing stored user:', error);
//         localStorage.removeItem('user');
//         localStorage.removeItem('token');
//         setUser(null);
//       }
//     } else if (token) {
//       try {
//         const base64Url = token.split('.')[1];
//         const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//         const jsonPayload = decodeURIComponent(
//           atob(base64)
//             .split('')
//             .map(function (c) {
//               return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//             })
//             .join('')
//         );
//         console.log('Raw JWT payload:', jsonPayload);
//         const decoded: User = JSON.parse(jsonPayload);
//         console.log('Decoded JWT:', decoded);
//         if (decoded.exp && decoded.exp * 1000 < Date.now()) {
//           console.log('Token expired, exp:', new Date(decoded.exp * 1000).toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
//           localStorage.removeItem('token');
//           localStorage.removeItem('user');
//           setUser(null);
//         } else {
//           setUser(decoded);
//           localStorage.setItem('user', JSON.stringify(decoded)); // Store decoded user as fallback
//           console.log('User set from JWT:', decoded);
//         }
//       } catch (error) {
//         console.error('JWT decode error:', error);
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         setUser(null);
//       }
//     } else {
//       console.log('No token or user found in localStorage');
//     }
//   }, []);

//   const logout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user'); // Clear user on logout
//     setUser(null);
//     console.log('Logged out, user and token cleared');
//   };

//   return (
//     <AuthContext.Provider value={{ user, setUser, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used within AuthProvider');
//   return context;
// };

"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Function to check token expiration
  const checkTokenExpiration = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded: User = JSON.parse(jsonPayload);
        console.log('Decoded JWT:', decoded);

        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.log('Token expired, exp:', new Date(decoded.exp * 1000).toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        } else if (!user) {
          // Only set user if not already set to avoid unnecessary updates
          setUser(decoded);
          localStorage.setItem('user', JSON.stringify(decoded)); // Store decoded user as fallback
          console.log('User set from JWT:', decoded);
        }
      } catch (error) {
        console.error('JWT decode error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } else {
      // No token, ensure user is cleared
      if (user) {
        localStorage.removeItem('user');
        setUser(null);
      }
      console.log('No token found in localStorage');
    }
  };

  useEffect(() => {
    // Initial check on mount
    const storedUser = localStorage.getItem('user');
    console.log('Token from localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('Stored user from localStorage:', storedUser);

    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        console.log('Parsed user from localStorage:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      }
    }

    // Periodic check for token expiration every 60 seconds
    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('Logged out, user and token cleared');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};