import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import AuthPage from "./pages/AuthPage";
import SnapPage from "./pages/SnapPage";
import axios from "axios";
import { BaseUrl } from "./configs/clientConfig";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${BaseUrl}/auth/protected`, { withCredentials: true });
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="text-white text-center mt-20">Checking authentication...</div>;
  }

  return (
    <Router>
      <div className="bg-gray-800 min-h-screen">
        <Routes>
          {/* Default entry point */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/snap" : "/auth"} replace />}
          />
          <Route
            path="/auth"
            element={<AuthPage onAuth={() => setIsAuthenticated(true)} />}
          />
          <Route
            path="/snap"
            element={
              isAuthenticated ? <SnapPage /> : <Navigate to="/auth" replace />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;