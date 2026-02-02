import React, { useState, useEffect } from "react";
import { getTrainingSessions, createTrainingSession, updateTrainingSession, deleteTrainingSession } from "../services/api";
import TimeInput from "./TimeInput";

function TrainingSessionsManager() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingSession, setEditingSession] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        frequency: "weekly",
        date: "",
        weekday: "0",
        start_time: "",
        end_time: "",
        active: true,
    });

    const weekdays = [
        { value: 0, label: "Luni" },
        { value: 1, label: "Marți" },
        { value: 2, label: "Miercuri" },
        { value: 3, label: "Joi" },
        { value: 4, label: "Vineri" },
        { value: 5, label: "Sâmbătă" },
        { value: 6, label: "Duminică" },
    ];

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const response = await getTrainingSessions();
            // Django REST Framework poate returna fie un array, fie un obiect paginat
            const data = Array.isArray(response.data) ? response.data : response.data.results || [];
            setSessions(data);
            setError("");
        } catch (err) {
            setError("Eroare la încărcarea antrenamentelor");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.start_time >= formData.end_time) {
            setError("Ora de început trebuie să fie mai mică decât ora de sfărșit");
            return;
        }

        try {
            const dataToSend = {
                name: formData.name,
                frequency: formData.frequency,
                start_time: formData.start_time,
                end_time: formData.end_time,
                active: formData.active,
            };

            if (formData.frequency === "once") {
                dataToSend.date = formData.date;
                dataToSend.weekday = null;
            } else {
                dataToSend.weekday = parseInt(formData.weekday);
                dataToSend.date = null;
            }

            if (editingSession) {
                await updateTrainingSession(editingSession.id, dataToSend);
            } else {
                await createTrainingSession(dataToSend);
            }

            await loadSessions();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.detail || "Eroare la salvarea antrenamentului");
        }
    };

    const handleEdit = (session) => {
        setError("");
        setEditingSession(session);
        setFormData({
            name: session.name,
            frequency: session.frequency,
            date: session.date || "",
            weekday: session.weekday !== null ? session.weekday.toString() : "0",
            start_time: session.start_time ? session.start_time.substring(0, 5) : "",
            end_time: session.end_time ? session.end_time.substring(0, 5) : "",
            active: session.active,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Ești sigur că vrei să ștergi acest antrenament?")) {
            try {
                await deleteTrainingSession(id);
                await loadSessions();
            } catch (err) {
                setError("Eroare la ștergerea antrenamentului");
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            frequency: "weekly",
            date: "",
            weekday: "0",
            start_time: "",
            end_time: "",
            active: true,
        });
        setEditingSession(null);
        setShowForm(false);
    };

    if (loading) {
        return <div className="card">Se încarcă...</div>;
    }

    return (
        <div className="card">
            <div className="flex-between">
                <h2>Antrenamente</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Anulează" : "+ Adaugă antrenament"}
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            {showForm && (
                <form onSubmit={handleSubmit} style={{ marginTop: "20px", padding: "20px", background: "#f8f9fa", borderRadius: "8px" }}>
                    <h3>{editingSession ? "Editează antrenament" : "Antrenament nou"}</h3>

                    <div className="form-group">
                        <label>Nume antrenament:</label>
                        <input type="text" name="name" className="input" value={formData.name} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                        <label>Frecvență:</label>
                        <select name="frequency" className="select" value={formData.frequency} onChange={handleInputChange}>
                            <option value="weekly">Săptămânal</option>
                            <option value="once">O singură dată</option>
                        </select>
                    </div>

                    {formData.frequency === "weekly" ? (
                        <div className="form-group">
                            <label>Ziua săptămânii:</label>
                            <select name="weekday" className="select" value={formData.weekday} onChange={handleInputChange}>
                                {weekdays.map((day) => (
                                    <option key={day.value} value={day.value}>
                                        {day.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>Data:</label>
                            <input type="date" name="date" className="input" value={formData.date} onChange={handleInputChange} required />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Ora de început:</label>
                        <TimeInput name="start_time" value={formData.start_time} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                        <label>Ora de sfârșit:</label>
                        <TimeInput name="end_time" value={formData.end_time} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                        <label>
                            <input type="checkbox" name="active" className="checkbox" checked={formData.active} onChange={handleInputChange} />
                            Activ
                        </label>
                    </div>

                    <div className="flex" style={{ gap: "10px" }}>
                        <button type="submit" className="btn btn-success">
                            {editingSession ? "Actualizează" : "Creează"}
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
                            <th>Nume</th>
                            <th>Frecvență</th>
                            <th>Zi</th>
                            <th>Ora</th>
                            <th>Status</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                                    Nu există antrenamente configurate
                                </td>
                            </tr>
                        ) : (
                            sessions.map((session) => (
                                <tr key={session.id}>
                                    <td>{session.name}</td>
                                    <td>{session.frequency_display}</td>
                                    <td>{session.frequency === "weekly" ? session.weekday_display : session.date}</td>
                                    <td>
                                        {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                color: session.active ? "#28a745" : "#dc3545",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {session.active ? "✓ Activ" : "✗ Inactiv"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex" style={{ gap: "5px" }}>
                                            <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "14px" }} onClick={() => handleEdit(session)}>
                                                Editează
                                            </button>
                                            <button className="btn btn-danger" style={{ padding: "6px 12px", fontSize: "14px" }} onClick={() => handleDelete(session.id)}>
                                                Șterge
                                            </button>
                                        </div>
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

export default TrainingSessionsManager;
