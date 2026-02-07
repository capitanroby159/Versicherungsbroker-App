import React, { useState } from 'react'
import Aktivitaeten from '../Aktivitaeten/Aktivitaeten'
import Projekte from './Projekte/projekte'
import './TrackingPage.css'

export default function TrackingPage() {  // ← Das ist TrackingPage!
  const [activeTab, setActiveTab] = useState('aktivitaeten')
  
  return (
    <div className="tracking-page">
      {/* ... */}
    </div>
  )
}