// src/components/Tracking/TrackingPage.jsx
import React, { useState } from 'react';
import Aktivitaeten from "../Aktivitaeten/Aktivitaeten";
import Projekte from "./Projekte/projekte";
import './TrackingPage.css';

export default function TrackingPage() {
  const [activeTab, setActiveTab] = useState('aktivitaeten'); // 'aktivitaeten' oder 'projekte'

  return (
    <div className="tracking-page">
      <div className="tracking-header">
        <h1>📍 Tracking & Aktivitäten</h1>
        <div className="tracking-buttons">
          <button 
            className="btn-new"
            onClick={() => setActiveTab('aktivitaeten')}
          >
            + Neue Aktivität
          </button>
          <button className="btn-new btn-project">
            + Neues Projekt
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tracking-tabs">
        <button 
          className={`tab ${activeTab === 'aktivitaeten' ? 'active' : ''}`}
          onClick={() => setActiveTab('aktivitaeten')}
        >
          📋 AKTIVITÄTEN (UNABHÄNGIG)
        </button>
        <button 
          className={`tab ${activeTab === 'projekte' ? 'active' : ''}`}
          onClick={() => setActiveTab('projekte')}
        >
          📁 PROJEKTE MIT AKTIVITÄTEN
        </button>
      </div>

      {/* Tab Content */}
      <div className="tracking-content">
        {activeTab === 'aktivitaeten' && (
          <Aktivitaeten />
        )}
        {activeTab === 'projekte' && (
          <Projekte />
        )}
      </div>
    </div>
  );
}