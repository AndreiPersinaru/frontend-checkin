import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createCheckIn, getCurrentTrainingSession } from "../services/api";

function CheckInPage() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [currentSession, setCurrentSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showNamePopup, setShowNamePopup] = useState(false);
    const [athleteName, setAthleteName] = useState("");
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmNameAck, setConfirmNameAck] = useState(false);

    useEffect(() => {
        const savedPhone = localStorage.getItem("athlete_phone");
        if (savedPhone) {
            setPhoneNumber(savedPhone);
        }
        checkCurrentSession();
    }, []);

    const checkCurrentSession = async () => {
        try {
            const response = await getCurrentTrainingSession();
            setCurrentSession(response.data);
            setError("");
        } catch (err) {
            setError("Nu există antrenament activ în acest moment. Check-in-ul este permis doar cu 30 de minute înainte și după antrenament.");
            setCurrentSession(null);
        } finally {
            setLoading(false);
        }
    };

    const validatePhoneNumber = (phone) => {
        if (!/^\d{10}$/.test(phone)) {
            return "Telefonul trebuie să aibă exact 10 cifre (format: 07XXXXXXXXX)";
        }
        if (!phone.startsWith("07")) {
            return "Telefonul trebuie să înceapă cu 07";
        }
        return null;
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
        setPhoneNumber(value);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!phoneNumber.trim()) {
            setError("Te rog introdu numărul de telefon!");
            return;
        }

        const phoneError = validatePhoneNumber(phoneNumber);
        if (phoneError) {
            setError(phoneError);
            return;
        }

        if (!currentSession) {
            setError("Nu există antrenament activ în acest moment.");
            return;
        }

        try {
            const response = await createCheckIn(phoneNumber);
            localStorage.setItem("athlete_phone", phoneNumber);
            const name = response?.data?.athlete_name;
            if (name) {
                setSuccess(`Bine ai revenit, ${name}! Check-in înregistrat cu succes!`);
            } else {
                setSuccess("Check-in înregistrat cu succes!");
            }
        } catch (err) {
            const nonField = err.response?.data?.non_field_errors;
            if (err.response?.status === 400 && Array.isArray(nonField)) {
                setShowNamePopup(true);
                setError("");
                setSuccess("");
                setConfirmNameAck(false);
                return;
            }
            if (err.response?.data?.error) {
                setError(err.response.data.error);
                return;
            }
            if (err.response?.data?.phone_number) {
                setError("Eroare la numărul de telefon: " + err.response.data.phone_number[0]);
                return;
            }
            setError("A apărut o eroare. Verifică dacă nu te-ai înregistrat deja astăzi.");
        }
    };

    const handleNameConfirm = async (e) => {
        e.preventDefault();
        setError("");
        setConfirmLoading(true);

        if (!athleteName.trim()) {
            setError("Te rog introdu numele complet!");
            setConfirmLoading(false);
            return;
        }

        if (!confirmNameAck) {
            setError("Confirmă că numele și prenumele sunt complete și nu se vor putea modifica ulterior.");
            setConfirmLoading(false);
            return;
        }

        try {
            const response = await createCheckIn(phoneNumber, athleteName.trim());
            localStorage.setItem("athlete_phone", phoneNumber);
            const name = response?.data?.athlete_name || athleteName.trim();
            setSuccess(`Bine ai venit, ${name}! Check-in înregistrat cu succes!`);
            setShowNamePopup(false);
            setAthleteName("");
            setConfirmNameAck(false);
        } catch (err) {
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError("A apărut o eroare la înregistrare.");
            }
        } finally {
            setConfirmLoading(false);
        }
    };

    const formatTime = (time) => time.substring(0, 5);

    if (loading) {
        return <div className="loading">Se încarcă...</div>;
    }

    return (
        <div className="container">
            <div
                className="card"
                style={{
                    marginTop: "50px",
                    maxWidth: "600px",
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
            >
                <h1 className="text-center">Gym Check-In</h1>

                {currentSession && (
                    <div
                        style={{
                            background: "#f9fafb",
                            padding: "16px",
                            borderRadius: "12px",
                            marginBottom: "20px",
                            border: "1px solid #e5e7eb",
                        }}
                    >
                        <h3 style={{ marginBottom: "8px", color: "#0f172a" }}>Antrenament activ</h3>
                        <p style={{ margin: "4px 0", color: "#0f172a" }}>
                            <strong>Nume:</strong> {currentSession.name}
                        </p>
                        <p style={{ margin: "4px 0", color: "#0f172a" }}>
                            <strong>Orar:</strong> {formatTime(currentSession.start_time)} - {formatTime(currentSession.end_time)}
                        </p>
                        {currentSession.frequency === "weekly" && (
                            <p style={{ margin: "4px 0", color: "#0f172a" }}>
                                <strong>Zi:</strong> {currentSession.weekday_display}
                            </p>
                        )}
                        {currentSession.frequency === "once" && (
                            <p style={{ margin: "4px 0", color: "#0f172a" }}>
                                <strong>Data:</strong> {currentSession.date}
                            </p>
                        )}
                    </div>
                )}

                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}

                <form onSubmit={showNamePopup ? handleNameConfirm : handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="phoneNumber">Numărul tău de telefon:</label>
                        <input
                            type="text"
                            id="phoneNumber"
                            className="input"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            placeholder="07..."
                            autoComplete="off"
                            disabled={!currentSession}
                            maxLength="10"
                        />
                        {phoneNumber.length > 0 && phoneNumber.length < 10 && <small style={{ color: "#666", display: "block", marginTop: "5px" }}>{phoneNumber.length}/10 cifre</small>}
                    </div>

                    {showNamePopup && (
                        <div className="form-group">
                            <label htmlFor="athleteName">Nume și prenume:</label>
                            <input
                                type="text"
                                id="athleteName"
                                className="input"
                                value={athleteName}
                                onChange={(e) => {
                                    setAthleteName(e.target.value);
                                    setError("");
                                }}
                                placeholder="Introdu numele complet..."
                                autoComplete="off"
                                autoFocus
                            />
                            <small style={{ color: "#666", display: "block", marginTop: "5px" }}>Ești nou? Te rog să introduci numele și prenumele.</small>
                            <div style={{ marginTop: "10px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#333", fontSize: "14px" }}>
                                    <input type="checkbox" checked={confirmNameAck} onChange={(e) => setConfirmNameAck(e.target.checked)} />
                                    Confirm că numele și prenumele sunt complete și nu se pot modifica ulterior.
                                </label>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-block" disabled={!currentSession || confirmLoading} style={{ width: "100%" }}>
                        {confirmLoading ? "Se înregistrează..." : showNamePopup ? "Confirmă și Check-In" : "Check-In"}
                    </button>

                    {showNamePopup && (
                        <button
                            type="button"
                            className="btn btn-secondary btn-block"
                            onClick={() => {
                                setShowNamePopup(false);
                                setAthleteName("");
                                setError("");
                            }}
                            style={{ marginTop: "10px", width: "100%" }}
                        >
                            Anulează
                        </button>
                    )}

                    <div style={{ marginTop: "30px", textAlign: "center" }}>
                        <Link to="/manager/login" className="btn btn-secondary">
                            Acces Manager
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CheckInPage;
