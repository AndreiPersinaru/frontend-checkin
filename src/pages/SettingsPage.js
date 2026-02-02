import React, { useState, useEffect } from "react";
import { getAppSettings, updateAppSettings } from "../services/api";

function SettingsPage({ onBack }) {
    const [settings, setSettings] = useState(null);
    const [subscriptionCost, setSubscriptionCost] = useState("");
    const [sessionCost, setSessionCost] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await getAppSettings();
            setSettings(response.data);
            setSubscriptionCost(response.data.subscription_cost);
            setSessionCost(response.data.session_cost);
            setError("");
        } catch (err) {
            setError("Eroare la încărcarea setărilor.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!subscriptionCost || !sessionCost) {
            setError("Toate câmpurile sunt obligatorii!");
            return;
        }

        const subCost = parseFloat(subscriptionCost);
        const sesCost = parseFloat(sessionCost);

        if (isNaN(subCost) || subCost < 0) {
            setError("Prețul abonamentului trebuie să fie un număr pozitiv!");
            return;
        }

        if (isNaN(sesCost) || sesCost < 0) {
            setError("Prețul ședinței trebuie să fie un număr pozitiv!");
            return;
        }

        setSaving(true);
        try {
            await updateAppSettings({
                subscription_cost: subCost.toFixed(2),
                session_cost: sesCost.toFixed(2),
            });
            setSuccess("Setările au fost salvate cu succes!");
            loadSettings();
        } catch (err) {
            setError(err.response?.data?.error || "Eroare la salvarea setărilor.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading">Se încarcă setările...</div>;
    }

    return (
        <div>
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>Setări Aplicație</h2>
                <button className="btn btn-secondary" onClick={onBack}>
                    Înapoi
                </button>
            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="subscriptionCost">Preț Abonament (RON/lună):</label>
                        <input
                            type="number"
                            id="subscriptionCost"
                            className="input"
                            value={subscriptionCost}
                            onChange={(e) => {
                                setSubscriptionCost(e.target.value);
                                setError("");
                                setSuccess("");
                            }}
                            step="0.01"
                            min="0"
                            placeholder="75.00"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="sessionCost">Preț Ședință (RON):</label>
                        <input
                            type="number"
                            id="sessionCost"
                            className="input"
                            value={sessionCost}
                            onChange={(e) => {
                                setSessionCost(e.target.value);
                                setError("");
                                setSuccess("");
                            }}
                            step="0.01"
                            min="0"
                            placeholder="20.00"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: "100%" }}>
                        {saving ? "Se salvează..." : "Salvează setările"}
                    </button>
                </form>

                {settings && (
                    <div
                        style={{
                            marginTop: "20px",
                            padding: "15px",
                            background: "#f9fafb",
                            borderRadius: "8px",
                            fontSize: "14px",
                            color: "#666",
                        }}
                    >
                        <p style={{ margin: "5px 0" }}>
                            <strong>Ultima modificare:</strong> {new Date(settings.updated_at).toLocaleString("ro-RO")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SettingsPage;
