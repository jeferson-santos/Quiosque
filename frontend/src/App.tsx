import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminPage from './components/AdminPage';
import WaiterPage from './components/WaiterPage';
import { SystemStatusProvider } from './components/SystemStatusProvider';

interface User {
  username: string;
  role: string;
  [key: string]: any;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há um usuário logado no localStorage
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <SystemStatusProvider>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/admin"
          element={user && user.role === 'administrator' ? <AdminPage onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/waiter"
          element={user && user.role === 'waiter' ? <WaiterPage onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="*"
          element={
            user
              ? user.role === 'administrator'
                ? <Navigate to="/admin" />
                : user.role === 'waiter'
                ? <Navigate to="/waiter" />
                : <Navigate to="/login" />
              : <Navigate to="/login" />
          }
        />
      </Routes>
    </SystemStatusProvider>
  );
}

export default App;
