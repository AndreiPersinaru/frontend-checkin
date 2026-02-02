import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addAthleteViaPin, getAthlete, getAthleteAttendance, getAthletePhones, removeAthleteFromPhone, updateAthlete, updateAthleteAttendance, updateAthleteSubscription } from "../services/api";

function AthleteDetail() {
    const { athleteId } = useParams();
    const navigate = useNavigate();

    const [athlete, setAthlete] = useState(null);
    const [phones, setPhones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [subscriptionActive, setSubscriptionActive] = useState(true);
    const [phoneInput, setPhoneInput] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceDays, setAttendanceDays] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSessions, setSelectedSessions] = useState([]);

    const currentDate = new Date();
    const getInitialMonth = () => {
        const saved = localStorage.getItem(`athleteCalendarMonth_${athleteId}`);
        return saved ? parseInt(saved) : currentDate.getMonth() + 1;
    };
    const getInitialYear = () => {
        const saved = localStorage.getItem(`athleteCalendarYear_${athleteId}`);
        return saved ? parseInt(saved) : currentDate.getFullYear();
    };

    const [selectedMonth, setSelectedMonth] = useState(getInitialMonth());
    const [selectedYear, setSelectedYear] = useState(getInitialYear());

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

    const loadAthlete = async () => {
        setLoading(true);
        try {
            const response = await getAthlete(athleteId);
            setAthlete(response.data);
            setNameInput(response.data.name || "");
            setSubscriptionActive(!!response.data.subscription_active);
            setError("");
        } catch (err) {
            setError("Eroare la încărcarea datelor sportivului.");
        } finally {
            setLoading(false);
        }
    };

    const loadPhones = async () => {
        try {
            const response = await getAthletePhones(athleteId);
            setPhones(response.data.phones || []);
        } catch (err) {
            // silent
        }
    };

    const loadAttendance = async () => {
        setAttendanceLoading(true);
        try {
            const response = await getAthleteAttendance(athleteId, selectedYear, selectedMonth);
            setAttendanceDays(response.data.days || []);
        } catch (err) {
            setError("Eroare la încărcarea prezenței.");
        } finally {
            setAttendanceLoading(false);
        }
    };

    useEffect(() => {
        loadAthlete();
        loadPhones();
    }, [athleteId]);

    useEffect(() => {
        setSelectedDate(null);
        setSelectedSessions([]);
        loadAttendance();
        localStorage.setItem(`athleteCalendarMonth_${athleteId}`, selectedMonth);
        localStorage.setItem(`athleteCalendarYear_${athleteId}`, selectedYear);
    }, [athleteId, selectedMonth, selectedYear]);

    const attendanceMap = useMemo(() => {
        const map = {};
        attendanceDays.forEach((day) => {
            map[day.date] = day.sessions;
        });
        return map;
    }, [attendanceDays]);

    const buildCalendarCells = () => {
        const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
        const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();
        const startIndex = (firstDay.getDay() + 6) % 7; // Monday-first

        const cells = [];
        for (let i = 0; i < startIndex; i++) {
            cells.push(null);
        }
        for (let day = 1; day <= totalDays; day++) {
            cells.push(day);
        }
        return cells;
    };

    const formatDate = (year, month, day) => {
        const m = String(month).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        return `${year}-${m}-${d}`;
    };

    const handleSelectDay = (day) => {
        if (!day) return;
        const dateKey = formatDate(selectedYear, selectedMonth, day);
        const sessions = attendanceMap[dateKey];
        if (!sessions || sessions.length === 0) return;
        setSelectedDate(dateKey);
        setSelectedSessions(sessions);
    };

    const handleToggleAttendance = async (sessionId, present) => {
        if (!selectedDate) return;
        try {
            await updateAthleteAttendance(athleteId, {
                training_session_id: sessionId,
                date: selectedDate,
                present,
            });
            await loadAttendance();

            const sessions = attendanceMap[selectedDate] || [];
            setSelectedSessions(sessions);
        } catch (err) {
            setError("Eroare la actualizarea prezenței.");
        }
    };

    const handleSaveName = async () => {
        if (!nameInput.trim()) {
            setError("Numele este obligatoriu.");
            return;
        }
        setSaving(true);
        try {
            await updateAthlete(athleteId, { name: nameInput.trim() });
            await loadAthlete();
            setIsEditingName(false);
            setError("");
        } catch (err) {
            setError("Eroare la salvarea numelui.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEditName = () => {
        setNameInput(athlete?.name || "");
        setIsEditingName(false);
        setError("");
    };

    const handleToggleSubscription = async () => {
        setSaving(true);
        try {
            await updateAthleteSubscription(athleteId, !subscriptionActive);
            setSubscriptionActive((prev) => !prev);
            setError("");
        } catch (err) {
            setError("Eroare la actualizarea abonamentului.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddPhone = async () => {
        const phone = phoneInput.replace(/\D/g, "");
        if (!/^07\d{8}$/.test(phone)) {
            setPhoneError("Numărul trebuie să fie 07XXXXXXXX");
            return;
        }
        if (!athlete?.pin) {
            setPhoneError("PIN-ul sportivului nu este disponibil.");
            return;
        }
        setPhoneError("");
        try {
            await addAthleteViaPin(phone, athlete.pin);
            setPhoneInput("");
            await loadPhones();
        } catch (err) {
            setPhoneError(err.response?.data?.error || "Eroare la asocierea numărului.");
        }
    };

    const handleRemovePhone = async (phoneNumber) => {
        if (!window.confirm(`Sigur vrei să dezasociezi ${phoneNumber}?`)) return;
        try {
            await removeAthleteFromPhone(phoneNumber, athleteId);
            await loadPhones();
        } catch (err) {
            setError("Eroare la dezasocierea numărului.");
        }
    };

    if (loading) {
        return <div className="loading">Se încarcă...</div>;
    }

    if (error && !athlete) {
        return (
            <div className="container">
                <div className="error">{error}</div>
                <button
                    onClick={() => {
                        localStorage.setItem("managerActiveTab", "stats");
                        navigate("/manager/dashboard");
                    }}
                    className="btn btn-secondary"
                >
                    ← Înapoi
                </button>
            </div>
        );
    }

    return (
        <div className="container athlete-detail">
            <div style={{ marginTop: "20px" }}>
                {error && (
                    <div className="error" style={{ marginBottom: "12px" }}>
                        {error}
                    </div>
                )}

                <div className="info-card">
                    <div className="detail-card-header">
                        <h3>Detalii</h3>
                        <button
                            onClick={() => {
                                localStorage.setItem("managerActiveTab", "stats");
                                navigate("/manager/dashboard");
                            }}
                            className="btn btn-secondary"
                        >
                            ← Înapoi
                        </button>
                    </div>

                    <div className="field-row">
                        <label>Nume sportiv</label>
                        {isEditingName ? (
                            <div className="name-edit">
                                <input className="input" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
                                <div className="name-edit-actions">
                                    <button className="btn btn-primary" onClick={handleSaveName} disabled={saving}>
                                        Salvează
                                    </button>
                                    <button className="btn btn-secondary" onClick={handleCancelEditName} disabled={saving}>
                                        Anulează
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="name-display">
                                <div className="name-text">
                                    {athlete?.name || "-"}
                                    {athlete?.pin ? <span className="name-pin">({athlete.pin})</span> : null}
                                </div>
                                <button className="btn btn-link" onClick={() => setIsEditingName(true)} aria-label="Editează numele" title="Editează">
                                    ✎
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="field-row">
                        <label>Abonament</label>
                        <div className="field-actions">
                            <button className={`btn ${subscriptionActive ? "btn-success" : "btn-secondary"}`} onClick={handleToggleSubscription} disabled={saving}>
                                {subscriptionActive ? "Activ" : "Inactiv"}
                            </button>
                        </div>
                    </div>

                    <div className="field-row" style={{ marginTop: "24px" }}>
                        <label>Numere de telefon</label>
                        <div className="phone-list">
                            {phones.length === 0 ? (
                                <div style={{ color: "#666" }}>Niciun număr asociat.</div>
                            ) : (
                                phones.map((p) => (
                                    <div key={p.id} className="phone-item">
                                        <span>{p.phone_number}</span>
                                        <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => handleRemovePhone(p.phone_number)}>
                                            Elimină
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="phone-add">
                            <input className="input" placeholder="07XXXXXXXX" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
                            <button className="btn btn-primary" onClick={handleAddPhone}>
                                Adaugă
                            </button>
                        </div>
                        {phoneError && <div style={{ color: "#dc2626", marginTop: "6px" }}>{phoneError}</div>}
                    </div>
                </div>

                <div className="info-card" style={{ marginTop: "20px" }}>
                    <div className="calendar-header">
                        <h3>Calendar prezență</h3>
                        <div className="calendar-controls">
                            <select className="select" style={{ minWidth: "120px" }} value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                                {months.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                            <select className="select" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {attendanceLoading ? (
                        <div style={{ padding: "20px", textAlign: "center" }}>Se încarcă prezența...</div>
                    ) : (
                        <>
                            <div className="calendar-grid">
                                {["L", "M", "M", "J", "V", "S", "D"].map((d) => (
                                    <div key={d} className="calendar-day calendar-day-header">
                                        {d}
                                    </div>
                                ))}
                                {buildCalendarCells().map((day, idx) => {
                                    if (!day) {
                                        return <div key={`empty-${idx}`} className="calendar-day empty" />;
                                    }
                                    const dateKey = formatDate(selectedYear, selectedMonth, day);
                                    const sessions = attendanceMap[dateKey];
                                    const attendedCount = sessions ? sessions.filter((s) => s.attended).length : 0;
                                    const totalSessions = sessions ? sessions.length : 0;

                                    let className = "calendar-day";
                                    if (sessions && totalSessions > 0) {
                                        if (attendedCount === 0) className += " calendar-day-missed";
                                        else if (attendedCount === totalSessions) className += " calendar-day-present";
                                        else className += " calendar-day-partial";
                                    }

                                    if (selectedDate === dateKey) {
                                        className += " calendar-day-selected";
                                    }

                                    return (
                                        <div key={dateKey} className={className} onClick={() => handleSelectDay(day)}>
                                            {day}
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedDate && (
                                <div className="attendance-list">
                                    <h4>Prezențe pentru {selectedDate}</h4>
                                    {selectedSessions.length === 0 ? (
                                        <div style={{ color: "#666" }}>Nu există antrenamente în această zi.</div>
                                    ) : (
                                        selectedSessions.map((s) => (
                                            <div key={s.id} className="attendance-item" style={{ marginBottom: "5px" }}>
                                                <div className="session-info">
                                                    <div className="session-name">{s.name}</div>
                                                    <div className="session-time">
                                                        {s.start_time} - {s.end_time}
                                                    </div>
                                                </div>
                                                <div className="attendance-actions">
                                                    <span className={s.attended ? "status-present" : "status-missed"}>{s.attended ? "Prezent" : "Absent"}</span>
                                                    <button className={`btn ${s.attended ? "btn-danger" : "btn-success"}`} onClick={() => handleToggleAttendance(s.id, !s.attended)}>
                                                        {s.attended ? "Șterge prezența" : "Adaugă prezență"}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AthleteDetail;
