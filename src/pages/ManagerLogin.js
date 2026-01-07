import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/api";
import { setTokens, logout } from "../services/auth";

function ManagerLogin({ setIsAuth }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleBackToCheckIn = () => {
        logout();
        setIsAuth(false);
        navigate("/");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await login(username, password);
            setTokens(response.data.access, response.data.refresh);
            setIsAuth(true);
            navigate("/manager/dashboard");
        } catch (err) {
            setError("Nume de utilizator sau parolă greșită!");
        }
    };

    return (
        <div className="container">
            <div className="card" style={{ marginTop: "100px", maxWidth: "450px", marginLeft: "auto", marginRight: "auto" }}>
                <h1 className="text-center">Conectare Manager</h1>

                {error && <div className="error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Nume utilizator:</label>
                        <input type="text" id="username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Introdu numele de utilizator" required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Parolă:</label>
                        <input type="password" id="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Introdu parola" required />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                        Conectare
                    </button>
                </form>

                <div style={{ marginTop: "20px", textAlign: "center", paddingTop: "20px", borderTop: "1px solid #e0e0e0" }}>
                    <Link to="/" onClick={handleBackToCheckIn} style={{ color: "#0f172a", textDecoration: "none" }}>
                        Înapoi la Check-In
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ManagerLogin;
