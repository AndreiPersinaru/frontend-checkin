import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import CheckInPage from "./pages/CheckInPage";
import ManagerLogin from "./pages/ManagerLogin";
import ManagerDashboard from "./pages/ManagerDashboard";
import { isAuthenticated, logout } from "./services/auth";

function App() {
    const [isAuth, setIsAuth] = useState(isAuthenticated());

    useEffect(() => {
        setIsAuth(isAuthenticated());
    }, []);

    const handleLogout = () => {
        logout();
        setIsAuth(false);
    };

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<CheckInPage />} />
                    <Route path="/manager/login" element={<ManagerLogin setIsAuth={setIsAuth} />} />
                    <Route path="/manager/dashboard" element={isAuth ? <ManagerDashboard onLogout={handleLogout} /> : <CheckInPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
