import React, { useState, useEffect } from "react";
import { getUsers, createUser, deleteUser, getCurrentUser } from "../services/api";

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        password_confirm: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersResponse, currentUserResponse] = await Promise.all([getUsers(), getCurrentUser()]);
            setUsers(usersResponse.data);
            setCurrentUser(currentUserResponse.data);
            setError("");
        } catch (err) {
            if (err.response?.status === 403) {
                setError("Nu ai permisiuni de admin pentru a gestiona utilizatorii.");
            } else {
                setError("Eroare la încărcarea utilizatorilor");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.password_confirm) {
            setError("Parolele nu coincid!");
            return;
        }

        if (formData.password.length < 8) {
            setError("Parola trebuie să aibă minimum 8 caractere!");
            return;
        }

        try {
            await createUser(formData.username, formData.password, formData.password_confirm);
            await loadData();
            resetForm();
        } catch (err) {
            if (err.response?.data?.username) {
                setError("Acest nume de utilizator există deja!");
            } else if (err.response?.data?.password) {
                setError("Parolă: " + err.response.data.password[0]);
            } else {
                setError(err.response?.data?.detail || "Eroare la crearea utilizatorului");
            }
        }
    };

    const handleDelete = async (id, username) => {
        if (window.confirm(`Ești sigur că vrei să ștergi utilizatorul "${username}"?`)) {
            setDeletingId(id);
            try {
                await deleteUser(id);
                await loadData();
            } catch (err) {
                setError("Eroare la ștergerea utilizatorului");
            } finally {
                setDeletingId(null);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            username: "",
            password: "",
            password_confirm: "",
        });
        setShowForm(false);
    };

    if (loading) {
        return <div className="card">Se încarcă...</div>;
    }

    if (error && !currentUser) {
        return (
            <div className="card">
                <div className="error">{error}</div>
            </div>
        );
    }

    const isAdmin = currentUser && (currentUser.is_admin || currentUser.is_superuser);

    if (!isAdmin) {
        return (
            <div className="card">
                <div className="error">Nu ai permisiuni de admin pentru a accesa această pagină.</div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="flex-between">
                <h2>Gestionare Manageri</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Anulează" : "+ Adaugă Manager"}
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            {showForm && (
                <form onSubmit={handleSubmit} style={{ marginTop: "20px", padding: "20px", background: "#f8f9fa", borderRadius: "8px" }}>
                    <h3>Manager nou</h3>

                    <div className="form-group">
                        <label>Nume utilizator:</label>
                        <input type="text" name="username" className="input" value={formData.username} onChange={handleInputChange} placeholder="Introdu numele de utilizator" required />
                    </div>

                    <div className="form-group">
                        <label>Parolă:</label>
                        <input type="password" name="password" className="input" value={formData.password} onChange={handleInputChange} placeholder="Minimum 8 caractere" required />
                    </div>

                    <div className="form-group">
                        <label>Confirmă parola:</label>
                        <input type="password" name="password_confirm" className="input" value={formData.password_confirm} onChange={handleInputChange} placeholder="Reintroduceți parola" required />
                    </div>

                    <div className="flex" style={{ gap: "10px" }}>
                        <button type="submit" className="btn btn-success">
                            Creează Manager
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={resetForm}>
                            Anulează
                        </button>
                    </div>
                </form>
            )}

            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Nume Utilizator</th>
                            <th>Rol</th>
                            <th>Data Creare</th>
                            <th>Ultimul Login</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                                    Nu există manageri creați
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <strong>{user.username}</strong>
                                        {currentUser.id === user.id && <span style={{ marginLeft: "8px", color: "#667eea", fontSize: "12px" }}>(tu)</span>}
                                    </td>
                                    <td>
                                        {user.is_superuser ? (
                                            <span style={{ color: "#dc3545", fontWeight: "bold" }}>Superadmin</span>
                                        ) : user.is_staff ? (
                                            <span style={{ color: "#667eea", fontWeight: "bold" }}>Admin</span>
                                        ) : (
                                            <span style={{ color: "#28a745" }}>Manager</span>
                                        )}
                                    </td>
                                    <td>{new Date(user.date_joined).toLocaleDateString("ro-RO")}</td>
                                    <td>{user.last_login ? new Date(user.last_login).toLocaleDateString("ro-RO") : "Niciodată"}</td>
                                    <td>
                                        {currentUser.id !== user.id && !user.is_superuser && (
                                            <button
                                                className="btn btn-danger"
                                                style={{ padding: "6px 12px", fontSize: "14px" }}
                                                onClick={() => handleDelete(user.id, user.username)}
                                                disabled={deletingId === user.id}
                                            >
                                                {deletingId === user.id ? "Se șterge..." : "Șterge"}
                                            </button>
                                        )}
                                        {(currentUser.id === user.id || user.is_superuser) && <span style={{ color: "#999", fontSize: "14px" }}>—</span>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserManagement;
