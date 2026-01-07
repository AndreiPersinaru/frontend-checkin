import React, { useState, useEffect } from "react";
import { getMonthlyStats, updateAthleteSubscription, updateAthlete } from "../services/api";

function MonthlyStats() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [togglingId, setTogglingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [savingId, setSavingId] = useState(null);

    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

    const months = [
        { value: 1, label: "Ianuarie" },
        { value: 2, label: "Februarie" },
        { value: 3, label: "Martie" },
        { value: 4, label: "Aprilie" },
        { value: 5, label: "Mai" },
        { value: 6, label: "Iunie" },
        { value: 7, label: "Iulie" },
        { value: 8, label: "August" },
        { value: 9, label: "Septembrie" },
        { value: 10, label: "Octombrie" },
        { value: 11, label: "Noiembrie" },
        { value: 12, label: "Decembrie" },
    ];

    const years = [];
    for (let year = 2020; year <= currentDate.getFullYear() + 1; year++) {
        years.push(year);
    }

    useEffect(() => {
        loadStats();
    }, [selectedYear, selectedMonth]);

    const loadStats = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getMonthlyStats(selectedYear, selectedMonth);
            const athletes = response.data.athletes || [];
            setStats(Array.isArray(athletes) ? athletes : []);
        } catch (err) {
            setError("Eroare la încărcarea statisticilor");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSubscription = async (athleteId, currentStatus) => {
        setTogglingId(athleteId);
        try {
            await updateAthleteSubscription(athleteId, !currentStatus);
            // Reîncarcă statisticile după toggle
            await loadStats();
            setError("");
        } catch (err) {
            setError("Eroare la actualizarea abonamentului");
        } finally {
            setTogglingId(null);
        }
    };

    const startEditAthlete = (athlete) => {
        setEditingId(athlete.athlete_id);
        setEditName(athlete.athlete_name || "");
        setEditPhone((athlete.phone_number || "").replace(/\D/g, ""));
        setError("");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName("");
        setEditPhone("");
    };

    const saveEditAthlete = async () => {
        if (!editName.trim()) {
            setError("Completează numele sportivului");
            return;
        }
        const phone = editPhone.replace(/\D/g, "");
        if (phone && (!/^\d{10}$/.test(phone) || !phone.startsWith("07"))) {
            setError("Telefonul trebuie să fie 10 cifre și să înceapă cu 07");
            return;
        }
        setSavingId(editingId);
        try {
            await updateAthlete(editingId, { name: editName.trim(), phone_number: phone });
            await loadStats();
            cancelEdit();
        } catch (err) {
            setError("Eroare la actualizarea sportivului");
        } finally {
            setSavingId(null);
        }
    };

    const handleMonthChange = (direction) => {
        let newMonth = selectedMonth + direction;
        let newYear = selectedYear;

        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }

        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
    };

    return (
        <div className="card">
            <h2>Statistici prezență</h2>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                }}
            >
                <button className="btn btn-secondary" onClick={() => handleMonthChange(-1)} style={{ padding: "12px 16px", marginBottom: "14px" }}>
                    ← Luna anterioară
                </button>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <select className="select" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} style={{ width: "auto" }}>
                        {months.map((month) => (
                            <option key={month.value} value={month.value}>
                                {month.label}
                            </option>
                        ))}
                    </select>

                    <select className="select" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ width: "auto" }}>
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                <button className="btn btn-secondary" onClick={() => handleMonthChange(1)} style={{ padding: "12px 16px", marginBottom: "14px" }}>
                    Luna următoare →
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            {loading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>Se încarcă...</div>
            ) : (
                <>
                    {stats.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "40px",
                                background: "#f8f9fa",
                                borderRadius: "8px",
                            }}
                        >
                            <p style={{ fontSize: "18px", color: "#6c757d" }}>
                                Nu există date pentru {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div
                                style={{
                                    marginBottom: "20px",
                                    padding: "15px",
                                    background: "#e3f2fd",
                                    borderRadius: "8px",
                                    border: "2px solid #2196f3",
                                }}
                            >
                                <h3 style={{ margin: "0 0 10px 0", color: "#0f172a" }}>
                                    Rezumat {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                                </h3>
                                <p style={{ margin: "5px 0", fontSize: "16px" }}>
                                    <strong>Total sportivi activi:</strong> {stats.length}
                                </p>
                                <p style={{ margin: "5px 0", fontSize: "16px" }}>
                                    <strong>Total check-in-uri:</strong> {stats.reduce((sum, s) => sum + s.checkin_count, 0)}
                                </p>
                                <p style={{ margin: "5px 0", fontSize: "16px" }}>
                                    <strong>Media check-in-uri/sportiv:</strong> {(stats.reduce((sum, s) => sum + s.checkin_count, 0) / stats.length).toFixed(1)}
                                </p>
                            </div>

                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Nume Sportiv</th>
                                            <th>Telefon</th>
                                            <th>Check-in-uri</th>
                                            <th>Abonament</th>
                                            <th>Plată</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.map((athlete, index) => {
                                            const checkInCount = athlete.checkin_count || 0;
                                            const isSubscriptionActive = athlete.subscription_active;
                                            const paymentAmount = checkInCount * 75;

                                            return (
                                                <tr key={athlete.athlete_id}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        {editingId === athlete.athlete_id ? (
                                                            <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ maxWidth: "180px" }} />
                                                        ) : (
                                                            <>
                                                                <strong>{athlete.athlete_name}</strong>
                                                                <button className="btn btn-link" style={{ marginLeft: "8px", padding: 0, fontSize: "12px" }} onClick={() => startEditAthlete(athlete)}>
                                                                    Editează
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {editingId === athlete.athlete_id ? (
                                                            <input
                                                                className="input"
                                                                value={editPhone}
                                                                onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                                placeholder="07..."
                                                                style={{ maxWidth: "130px" }}
                                                            />
                                                        ) : (
                                                            <code style={{ color: "#666" }}>{athlete.phone_number || "N/A"}</code>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <strong style={{ color: "#667eea", fontSize: "18px" }}>{checkInCount}</strong>
                                                    </td>
                                                    <td>
                                                        <label
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                cursor: togglingId === athlete.athlete_id ? "not-allowed" : "pointer",
                                                                opacity: togglingId === athlete.athlete_id ? 0.6 : 1,
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSubscriptionActive}
                                                                onChange={() => handleToggleSubscription(athlete.athlete_id, isSubscriptionActive)}
                                                                disabled={togglingId === athlete.athlete_id}
                                                                style={{
                                                                    marginRight: "8px",
                                                                    cursor: togglingId === athlete.athlete_id ? "not-allowed" : "pointer",
                                                                }}
                                                            />
                                                            <span
                                                                style={{
                                                                    color: isSubscriptionActive ? "#4caf50" : "#999",
                                                                    fontWeight: isSubscriptionActive ? "bold" : "normal",
                                                                }}
                                                            >
                                                                {isSubscriptionActive ? "Activ" : "Inactiv"}
                                                            </span>
                                                        </label>
                                                    </td>
                                                    <td>
                                                        {isSubscriptionActive ? (
                                                            <span style={{ color: "#166534", fontWeight: "bold" }}>Abonament activ</span>
                                                        ) : (
                                                            <span style={{ color: "#0f172a", fontWeight: "bold" }}>{paymentAmount} lei</span>
                                                        )}
                                                    </td>
                                                    {editingId === athlete.athlete_id && (
                                                        <td colSpan="2" style={{ paddingTop: "8px" }}>
                                                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                                <button
                                                                    className="btn btn-success"
                                                                    onClick={saveEditAthlete}
                                                                    disabled={savingId === athlete.athlete_id}
                                                                    style={{ padding: "6px 10px" }}
                                                                >
                                                                    Salvează
                                                                </button>
                                                                <button className="btn btn-secondary" onClick={cancelEdit} style={{ padding: "6px 10px" }}>
                                                                    Anulează
                                                                </button>
                                                                {savingId === athlete.athlete_id && <span style={{ color: "#666" }}>Se salvează...</span>}
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export default MonthlyStats;
