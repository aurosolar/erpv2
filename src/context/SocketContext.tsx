import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: any | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<any | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Send JWT access token in handshake — server extracts tenantId from verified token
      const accessToken = localStorage.getItem('accessToken');
      const newSocket = io(window.location.origin, {
        auth: { token: accessToken }
      });

      newSocket.on('connect', () => {
        setConnected(true);
        // No manual join-tenant — server auto-joins from verified JWT
      });

      newSocket.on('connect_error', (err: Error) => {
        console.error('Socket auth error:', err.message);
        if (err.message === 'INVALID_TOKEN' || err.message === 'AUTHENTICATION_REQUIRED') {
          setConnected(false);
        }
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      setSocket(null);
      setConnected(false);
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
