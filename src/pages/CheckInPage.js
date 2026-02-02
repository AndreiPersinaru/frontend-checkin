import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createCheckIn, getCurrentTrainingSession, getAthletesForPhone, createAthleteForPhone, addAthleteViaPin, removeAthleteFromPhone } from "../services/api";

function CheckInPage() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [currentSession, setCurrentSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // New state pentru flow-ul cu multipli sportivi
    const [step, setStep] = useState("phone"); // phone | athletes | new_athlete | add_via_pin
    const [athletes, setAthletes] = useState([]);
    const [selectedAthletes, setSelectedAthletes] = useState([]);
    const [loadingAthletes, setLoadingAthletes] = useState(false);

    // New athlete creation
    const [newAthleteName, setNewAthleteName] = useState("");
    const [creatingAthlete, setCreatingAthlete] = useState(false);
    const [newAthletePin, setNewAthletePin] = useState("");

    // Add via PIN
    const [athletePin, setAthletePin] = useState("");
    const [addingViaPin, setAddingViaPin] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [removingAthlete, setRemovingAthlete] = useState(null);

    useEffect(() => {
        const savedPhone = localStorage.getItem("athlete_phone");
        if (savedPhone) {
            setPhoneNumber(savedPhone);
        }
        checkCurrentSession();
    }, []);

    // Auto-select all athletes when list is loaded
    useEffect(() => {
        if (athletes.length > 0 && step === "athletes") {
            const allAthleteIds = athletes.map((a) => a.athlete);
            setSelectedAthletes(allAthleteIds);
        }
    }, [athletes, step]);

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

    const handlePhoneSubmit = async (e) => {
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

        setLoadingAthletes(true);
        try {
            const response = await getAthletesForPhone(phoneNumber);
            localStorage.setItem("athlete_phone", phoneNumber);
            setAthletes(response.data.athletes || []);
            setStep("athletes");
        } catch (err) {
            setError("A apărut o eroare la încărcarea sportivilor.");
        } finally {
            setLoadingAthletes(false);
        }
    };

    const handleAthleteToggle = (athleteId) => {
        setSelectedAthletes((prev) => (prev.includes(athleteId) ? prev.filter((id) => id !== athleteId) : [...prev, athleteId]));
    };

    const handleCheckIn = async () => {
        if (selectedAthletes.length === 0) {
            setError("Selectează cel puțin un sportiv pentru check-in!");
            return;
        }

        if (!currentSession) {
            setError("Nu există antrenament activ în acest moment. Check-in-ul este permis doar cu 30 de minute înainte și după antrenament.");
            return;
        }

        setError("");
        setSuccess("");
        let successCount = 0;
        let failedAthletes = [];

        for (const athleteId of selectedAthletes) {
            try {
                await createCheckIn(phoneNumber, athleteId);
                successCount++;
            } catch (err) {
                const athlete = athletes.find((a) => a.athlete === athleteId);
                failedAthletes.push(athlete?.athlete_name || `ID ${athleteId}`);
            }
        }

        if (successCount > 0) {
            setSuccess(`Check-in înregistrat cu succes pentru ${successCount} sportiv${successCount > 1 ? "i" : ""}!`);
        }

        if (failedAthletes.length > 0) {
            setError(`Eroare la check-in pentru: ${failedAthletes.join(", ")}`);
        }

        setSelectedAthletes([]);

        // Refresh athletes list
        setTimeout(async () => {
            try {
                const response = await getAthletesForPhone(phoneNumber);
                setAthletes(response.data.athletes || []);
            } catch (err) {
                // Silent fail
            }
        }, 1000);
    };

    const handleCreateAthlete = async (e) => {
        e.preventDefault();
        setError("");

        if (!newAthleteName.trim()) {
            setError("Introdu numele sportivului!");
            return;
        }

        setCreatingAthlete(true);
        try {
            const response = await createAthleteForPhone(phoneNumber, newAthleteName.trim());
            setNewAthletePin(response.data.athlete_pin);
            setShowPinModal(true);

            // Refresh athletes
            const athletesResponse = await getAthletesForPhone(phoneNumber);
            setAthletes(athletesResponse.data.athletes || []);

            setNewAthleteName("");
        } catch (err) {
            setError(err.response?.data?.error || "Eroare la crearea sportivului.");
        } finally {
            setCreatingAthlete(false);
        }
    };

    const handleAddViaPin = async (e) => {
        e.preventDefault();
        setError("");

        if (!athletePin.trim() || athletePin.length !== 6) {
            setError("Introdu un PIN valid de 6 cifre!");
            return;
        }

        setAddingViaPin(true);
        try {
            await addAthleteViaPin(phoneNumber, athletePin);

            // Refresh athletes
            const response = await getAthletesForPhone(phoneNumber);
            setAthletes(response.data.athletes || []);

            setAthletePin("");
            setStep("athletes");
            setSuccess("Sportiv adăugat cu succes!");
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.non_field_errors?.[0] || "PIN invalid sau sportiv deja asociat.");
        } finally {
            setAddingViaPin(false);
        }
    };

    const resetFlow = () => {
        setStep("phone");
        setAthletes([]);
        setSelectedAthletes([]);
        setNewAthleteName("");
        setNewAthletePin("");
        setAthletePin("");
        setError("");
        setSuccess("");
        setShowPinModal(false);
        setRemovingAthlete(null);
    };

    const handleRemoveAthlete = async (athleteId, athleteName) => {
        if (window.confirm(`Ești sigur că vrei să dezasociezi pe ${athleteName} de la acest număr de telefon?`)) {
            try {
                await removeAthleteFromPhone(phoneNumber, athleteId);
                // Refresh athletes list
                const response = await getAthletesForPhone(phoneNumber);
                setAthletes(response.data.athletes || []);
                setSelectedAthletes((prev) => prev.filter((id) => id !== athleteId));
                setSuccess(`${athleteName} a fost dezasociat cu succes.`);
            } catch (err) {
                setError("Eroare la dezasocierea sportivului.");
            }
            setRemovingAthlete(null);
        }
    };

    const copyPinToClipboard = () => {
        navigator.clipboard.writeText(newAthletePin).then(() => {
            setSuccess("PIN copiat în clipboard!");
            setTimeout(() => setSuccess(""), 2000);
        });
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

                {/* Step 1: Phone Number */}
                {step === "phone" && (
                    <form onSubmit={handlePhoneSubmit}>
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

                        <button type="submit" className="btn btn-primary btn-block" disabled={loadingAthletes} style={{ width: "100%" }}>
                            {loadingAthletes ? "Se încarcă..." : "Continuă"}
                        </button>

                        <div style={{ marginTop: "30px", textAlign: "center" }}>
                            <Link to="/manager/login" className="btn btn-secondary">
                                Acces Manager
                            </Link>
                        </div>
                    </form>
                )}

                {/* Step 2: Athletes List */}
                {step === "athletes" && (
                    <div>
                        <div style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0 }}>{phoneNumber}</h3>
                            <button className="btn btn-secondary" onClick={resetFlow} style={{ fontSize: "14px", padding: "8px 12px" }}>
                                Schimbă nr.
                            </button>
                        </div>

                        {athletes.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "20px", background: "#f9fafb", borderRadius: "8px", marginBottom: "15px" }}>
                                <p style={{ color: "#666" }}>Nu există sportivi asociați cu acest număr.</p>
                            </div>
                        ) : (
                            <div style={{ marginBottom: "15px" }}>
                                {athletes.map((athlete) => (
                                    <div
                                        key={athlete.athlete}
                                        style={{
                                            padding: "12px",
                                            marginBottom: "8px",
                                            border: "2px solid " + (selectedAthletes.includes(athlete.athlete) ? "#2563eb" : "#e5e7eb"),
                                            borderRadius: "8px",
                                            background: selectedAthletes.includes(athlete.athlete) ? "#eff6ff" : "#fff",
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div onClick={() => handleAthleteToggle(athlete.athlete)} style={{ flex: 1, display: "flex", alignItems: "center", cursor: "pointer" }}>
                                            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", margin: 0, flex: 1 }}>
                                                <input type="checkbox" checked={selectedAthletes.includes(athlete.athlete)} onChange={() => {}} style={{ marginRight: "10px", cursor: "pointer" }} />
                                                <div>
                                                    <div style={{ fontWeight: "600", color: "#0f172a" }}>{athlete.athlete_name}</div>
                                                    <div style={{ fontSize: "12px", color: "#666", display: "flex", alignItems: "center", gap: "8px" }}>
                                                        PIN: {athlete.athlete_pin}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigator.clipboard.writeText(athlete.athlete_pin);
                                                                setSuccess("PIN copiat!");
                                                                setTimeout(() => setSuccess(""), 1500);
                                                            }}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                cursor: "pointer",
                                                                fontSize: "12px",
                                                                color: "#2563eb",
                                                                padding: "0",
                                                                textDecoration: "underline",
                                                            }}
                                                        >
                                                            Copiază
                                                        </button>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveAthlete(athlete.athlete, athlete.athlete_name);
                                            }}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                fontSize: "20px",
                                                color: "#dc2626",
                                                padding: "0 8px",
                                                marginLeft: "8px",
                                            }}
                                            title="Dezasociază"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {athletes.length > 0 && (
                            <button className="btn btn-primary btn-block" onClick={handleCheckIn} disabled={selectedAthletes.length === 0} style={{ width: "100%", marginBottom: "10px" }}>
                                Check-In ({selectedAthletes.length})
                            </button>
                        )}

                        <button className="btn btn-secondary btn-block" onClick={() => setStep("new_athlete")} style={{ width: "100%", marginBottom: "10px" }}>
                            + Sportiv nou
                        </button>

                        <button className="btn btn-secondary btn-block" onClick={() => setStep("add_via_pin")} style={{ width: "100%" }}>
                            Adaugă via PIN
                        </button>
                    </div>
                )}

                {/* Step 3: Create New Athlete */}
                {step === "new_athlete" && (
                    <div>
                        <h3>Sportiv nou</h3>

                        {showPinModal ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "30px",
                                    background: "#dcfce7",
                                    borderRadius: "12px",
                                    border: "2px solid #16a34a",
                                }}
                            >
                                <h2 style={{ color: "#15803d", marginBottom: "15px" }}>✓ Sportiv creat!</h2>
                                <p style={{ color: "#166534", marginBottom: "15px", fontSize: "14px" }}>
                                    PIN pentru {athletes.find((a) => a.athlete_pin === newAthletePin)?.athlete_name || "sportiv"}:
                                </p>
                                <div
                                    style={{
                                        fontSize: "48px",
                                        fontWeight: "bold",
                                        color: "#15803d",
                                        letterSpacing: "8px",
                                        marginBottom: "15px",
                                        fontFamily: "monospace",
                                    }}
                                >
                                    {newAthletePin}
                                </div>
                                <p style={{ color: "#166534", fontSize: "13px", lineHeight: "1.6" }}>
                                    Acesta este PIN-ul de identificare. Rămâne permanent disponibil în cont. Dacă se utilizează alt număr de telefon pentru check-in, va trebui să introduceți PIN-ul
                                    pentru validarea și înregistrarea prezenței.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPinModal(false);
                                        setNewAthletePin("");
                                        setStep("athletes");
                                    }}
                                    style={{
                                        marginTop: "20px",
                                        padding: "10px 30px",
                                        background: "#2563eb",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                    }}
                                >
                                    OK
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateAthlete}>
                                <div className="form-group">
                                    <label htmlFor="newAthleteName">Nume și prenume:</label>
                                    <input
                                        type="text"
                                        id="newAthleteName"
                                        className="input"
                                        value={newAthleteName}
                                        onChange={(e) => {
                                            setNewAthleteName(e.target.value);
                                            setError("");
                                        }}
                                        placeholder="Ion Popescu"
                                        autoComplete="off"
                                        autoFocus
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary btn-block" disabled={creatingAthlete} style={{ width: "100%", marginBottom: "10px" }}>
                                    {creatingAthlete ? "Se creează..." : "Creează sportiv"}
                                </button>

                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setStep("athletes")} style={{ width: "100%" }}>
                                    Anulează
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* Step 4: Add via PIN */}
                {step === "add_via_pin" && (
                    <div>
                        <h3>Adaugă sportiv via PIN</h3>
                        <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>Introdu PIN-ul sportivului pe care vrei să îl asociezi cu numărul {phoneNumber}.</p>

                        <form onSubmit={handleAddViaPin}>
                            <div className="form-group">
                                <label htmlFor="athletePin">PIN sportiv (6 cifre):</label>
                                <input
                                    type="text"
                                    id="athletePin"
                                    className="input"
                                    value={athletePin}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                        setAthletePin(value);
                                        setError("");
                                    }}
                                    placeholder="123456"
                                    autoComplete="off"
                                    maxLength="6"
                                    autoFocus
                                    style={{ fontSize: "24px", textAlign: "center", letterSpacing: "8px" }}
                                />
                                {athletePin.length > 0 && athletePin.length < 6 && (
                                    <small style={{ color: "#666", display: "block", marginTop: "5px", textAlign: "center" }}>{athletePin.length}/6 cifre</small>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary btn-block" disabled={addingViaPin || athletePin.length !== 6} style={{ width: "100%", marginBottom: "10px" }}>
                                {addingViaPin ? "Se adaugă..." : "Adaugă sportiv"}
                            </button>

                            <button type="button" className="btn btn-secondary btn-block" onClick={() => setStep("athletes")} style={{ width: "100%" }}>
                                Anulează
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CheckInPage;
