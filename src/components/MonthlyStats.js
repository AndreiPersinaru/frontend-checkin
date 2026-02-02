import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMonthlyStats, updateAthleteSubscription, getAppSettings } from "../services/api";

function MonthlyStats() {
    const navigate = useNavigate();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [togglingId, setTogglingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [appSettings, setAppSettings] = useState(null);

    const currentDate = new Date();

    // Inițializare cu valori din localStorage sau default
    const getInitialMonth = () => {
        const saved = localStorage.getItem("statsSelectedMonth");
        return saved ? parseInt(saved) : currentDate.getMonth() + 1;
    };

    const getInitialYear = () => {
        const saved = localStorage.getItem("statsSelectedYear");
        return saved ? parseInt(saved) : currentDate.getFullYear();
    };

    const [selectedYear, setSelectedYear] = useState(getInitialYear());
    const [selectedMonth, setSelectedMonth] = useState(getInitialMonth());

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
        let cancelled = false;
        const fetchStats = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await getMonthlyStats(selectedYear, selectedMonth);
                const athletes = response.data.athletes || [];

                const settingsResponse = await getAppSettings();
                setAppSettings(settingsResponse.data);

                if (!cancelled) {
                    setStats(Array.isArray(athletes) ? athletes : []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError("Eroare la încărcarea statisticilor");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        fetchStats();
        return () => {
            cancelled = true;
        };
    }, [selectedYear, selectedMonth]);

    const handleToggleSubscription = async (athleteId, currentStatus) => {
        setTogglingId(athleteId);
        try {
            await updateAthleteSubscription(athleteId, !currentStatus);
            setError("");
            // Trigger data refresh by fetching directly
            setLoading(true);
            const response = await getMonthlyStats(selectedYear, selectedMonth);
            const athletes = response.data.athletes || [];
            const settingsResponse = await getAppSettings();
            setAppSettings(settingsResponse.data);
            setStats(Array.isArray(athletes) ? athletes : []);
        } catch (err) {
            setError("Eroare la actualizarea abonamentului");
        } finally {
            setTogglingId(null);
            setLoading(false);
        }
    };

    const calculatePayment = (athlete) => {
        if (!appSettings) return 0;

        const sessionCost = parseFloat(appSettings.session_cost) || 20;
        const subscriptionCost = parseFloat(appSettings.subscription_cost) || 75;

        if (athlete.subscription_active) {
            return subscriptionCost;
        } else {
            return athlete.checkin_count * sessionCost;
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
        localStorage.setItem("statsSelectedMonth", newMonth);
        localStorage.setItem("statsSelectedYear", newYear);
    };

    const handleMonthSelect = (newMonth) => {
        setSelectedMonth(parseInt(newMonth));
        localStorage.setItem("statsSelectedMonth", newMonth);
    };

    const handleYearSelect = (newYear) => {
        setSelectedYear(parseInt(newYear));
        localStorage.setItem("statsSelectedYear", newYear);
    };

    return (
        <div className="card">
            <h2>Statistici prezență</h2>

            <style>{`
                .month-navigation-container {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                
                .month-navigation-container .btn-prev,
                .month-navigation-container .btn-next {
                    white-space: nowrap;
                    min-height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                @media (max-width: 767px) {
                    .month-navigation-container {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                    }
                    
                    .month-navigation-container .btn-prev {
                        grid-column: 1;
                        grid-row: 1;
                    }
                    
                    .month-navigation-container .btn-next {
                        grid-column: 2;
                        grid-row: 1;
                    }
                    
                    .month-navigation-container .month-selectors {
                        grid-column: 1 / 3;
                        grid-row: 2;
                        display: flex;
                        justify-content: center;
                        gap: 10px;
                    }
                    
                    .month-navigation-container .btn-prev,
                    .month-navigation-container .btn-next {
                        font-size: 13px;
                        padding: 10px 8px;
                    }
                }
            `}</style>

            <div className="month-navigation-container">
                <button className="btn btn-secondary btn-prev" onClick={() => handleMonthChange(-1)}>
                    ← Luna anterioară
                </button>

                <div className="month-selectors" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <select className="select" value={selectedMonth} onChange={(e) => handleMonthSelect(e.target.value)} style={{ width: "auto" }}>
                        {months.map((month) => (
                            <option key={month.value} value={month.value}>
                                {month.label}
                            </option>
                        ))}
                    </select>

                    <select className="select" value={selectedYear} onChange={(e) => handleYearSelect(e.target.value)} style={{ width: "auto" }}>
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                <button className="btn btn-secondary btn-next" onClick={() => handleMonthChange(1)}>
                    Luna următoare →
                </button>
            </div>

            {/* Search Filter */}
            <div className="form-group" style={{ marginBottom: "20px" }}>
                <input
                    type="text"
                    className="input"
                    placeholder="Caută sportiv după nume..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: "100%", maxWidth: "400px" }}
                />
                {searchQuery && (
                    <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
                        Găsite: {stats.filter((athlete) => athlete.athlete_name.toLowerCase().includes(searchQuery.toLowerCase())).length} rezultate
                    </small>
                )}
            </div>

            {error && <div className="error">{error}</div>}

            {loading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>Se încarcă...</div>
            ) : (
                <>
                    {stats.filter((athlete) => athlete.athlete_name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "40px",
                                background: "#f8f9fa",
                                borderRadius: "8px",
                            }}
                        >
                            <p style={{ color: "#666", margin: 0 }}>
                                {searchQuery ? `Nu s-au găsit sportivi care să corespundă căutării "${searchQuery}"` : "Nicio prezență înregistrată în această lună"}
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
                                    <strong>Total sportivi activi:</strong> {stats.filter((athlete) => athlete.athlete_name.toLowerCase().includes(searchQuery.toLowerCase())).length}
                                </p>
                                <p style={{ margin: "5px 0", fontSize: "16px" }}>
                                    <strong>Total check-in-uri:</strong> {stats.filter((athlete) => athlete.athlete_name.toLowerCase().includes(searchQuery.toLowerCase())).reduce((sum, s) => sum + s.checkin_count, 0)}
                                </p>
                                <p style={{ margin: "5px 0", fontSize: "16px" }}>
                                    <strong>Media check-in-uri/sportiv:</strong>{" "}
                                    {stats.filter((athlete) => athlete.athlete_name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0
                                        ? (
                                              stats.filter((athlete) => athlete.athlete_name.toLowerCase().includes(searchQuery.toLowerCase())).reduce((sum, s) => sum + s.checkin_count, 0) /
                                              stats.filter((athlete) => athlete.athlete_name.toLowerCase().includes(searchQuery.toLowerCase())).length
                                          ).toFixed(1)
                                        : "0.0"}
                                </p>
                            </div>

                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "50px" }}>#</th>
                                            <th>Nume Sportiv</th>
                                            <th style={{ width: "120px", textAlign: "center" }}>Check-in-uri</th>
                                            <th style={{ width: "100px", textAlign: "center" }}>Abonament</th>
                                            <th style={{ width: "100px", textAlign: "center" }}>Plată</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats
                                            .filter((athlete) => athlete.athlete_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((athlete, index) => {
                                                const checkInCount = athlete.checkin_count || 0;
                                                const isSubscriptionActive = athlete.subscription_active;
                                                const paymentAmount = calculatePayment(athlete);

                                                return (
                                                    <tr
                                                        key={athlete.athlete_id}
                                                        onClick={() => navigate(`/athlete/${athlete.athlete_id}`)}
                                                        style={{
                                                            cursor: "pointer",
                                                            transition: "background-color 0.2s",
                                                        }}
                                                        onMouseEnter={(e) => (e.target.closest("tr").style.backgroundColor = "#f5f5f5")}
                                                        onMouseLeave={(e) => (e.target.closest("tr").style.backgroundColor = "")}
                                                    >
                                                        <td style={{ width: "50px", fontWeight: "bold" }}>{index + 1}</td>
                                                        <td style={{ fontWeight: "600" }}>{athlete.athlete_name}</td>
                                                        <td style={{ width: "120px", textAlign: "center" }}>
                                                            <strong style={{ color: "#667eea", fontSize: "18px" }}>{checkInCount}</strong>
                                                        </td>
                                                        <td style={{ width: "100px", textAlign: "center" }}>
                                                            <label
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    cursor: togglingId === athlete.athlete_id ? "not-allowed" : "pointer",
                                                                    opacity: togglingId === athlete.athlete_id ? 0.6 : 1,
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSubscriptionActive}
                                                                    onChange={() => handleToggleSubscription(athlete.athlete_id, isSubscriptionActive)}
                                                                    disabled={togglingId === athlete.athlete_id}
                                                                    style={{
                                                                        cursor: togglingId === athlete.athlete_id ? "not-allowed" : "pointer",
                                                                    }}
                                                                />
                                                            </label>
                                                        </td>
                                                        <td style={{ width: "100px", textAlign: "center", fontWeight: "bold" }}>{paymentAmount.toFixed(2)} lei</td>
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
