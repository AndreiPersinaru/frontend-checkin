import React, { useState, useEffect } from "react";
import TrainingSessionsManager from "../components/TrainingSessionsManager";
import MonthlyStats from "../components/MonthlyStats";
import UserManagement from "../components/UserManagement";
import { getCurrentUser } from "../services/api";

function ManagerDashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState("sessions");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const response = await getCurrentUser();
                setIsAdmin(response.data.is_admin || response.data.is_superuser || false);
            } catch (err) {
                setIsAdmin(false);
            }
        };
        checkAdmin();
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setMobileMenuOpen(false);
    };

    const handleLogout = () => {
        setMobileMenuOpen(false);
        onLogout();
    };

    return (
        <div className="container">
            <div style={{ marginTop: "20px" }}>
                <div className="flex-between" style={{ marginBottom: "30px" }}>
                    <h1>Dashboard Manager</h1>
                    <div className="desktop-menu flex" style={{ gap: "10px" }}>
                        <button onClick={handleLogout} className="btn btn-danger">
                            Deconectare
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="mobile-menu-wrapper">
                        <button className="btn btn-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ width: "48px", padding: "10px" }}>
                            ☰
                        </button>

                        {/* Mobile Menu Dropdown */}
                        {mobileMenuOpen && (
                            <div className="mobile-menu">
                                <button className={`mobile-menu-item ${activeTab === "sessions" ? "active" : ""}`} onClick={() => handleTabChange("sessions")}>
                                    Antrenamente
                                </button>
                                <button className={`mobile-menu-item ${activeTab === "stats" ? "active" : ""}`} onClick={() => handleTabChange("stats")}>
                                    Statistici
                                </button>
                                {isAdmin && (
                                    <button className={`mobile-menu-item ${activeTab === "users" ? "active" : ""}`} onClick={() => handleTabChange("users")}>
                                        Utilizatori
                                    </button>
                                )}
                                <button className="mobile-menu-item mobile-menu-logout" onClick={handleLogout}>
                                    Deconectare
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop Navigation */}
                <div className="nav desktop-nav">
                    <button className={`btn ${activeTab === "sessions" ? "btn-primary" : "btn-secondary"}`} style={{ marginRight: "10px" }} onClick={() => handleTabChange("sessions")}>
                        Antrenamente
                    </button>
                    <button className={`btn ${activeTab === "stats" ? "btn-primary" : "btn-secondary"}`} onClick={() => handleTabChange("stats")}>
                        Statistici
                    </button>
                    {isAdmin && (
                        <button className={`btn ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`} style={{ marginLeft: "10px" }} onClick={() => handleTabChange("users")}>
                            Utilizatori
                        </button>
                    )}
                </div>

                {activeTab === "sessions" && <TrainingSessionsManager />}
                {activeTab === "stats" && <MonthlyStats />}
                {activeTab === "users" && <UserManagement />}
            </div>
        </div>
    );
}

export default ManagerDashboard;
