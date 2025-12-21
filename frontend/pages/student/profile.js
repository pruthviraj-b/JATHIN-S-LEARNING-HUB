import { getProxiedImageUrl } from '../../lib/imageUrl'
import { useState, useEffect } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import StudentLayout from '../../components/StudentLayout'
import { useAuth } from '../../hooks/useAuth'
import { apiCall } from '../../lib/api'

export default function Profile() {
    const { user } = useAuth()
    const s = user?.student

    if (!s) return <div style={{ padding: 50, textAlign: 'center' }}>Loading ID Card...</div>

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <StudentLayout>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>

                    {/* ID CARD CONTAINER */}
                    <div style={{
                        width: '100%', maxWidth: 380,
                        background: '#09090B',
                        borderRadius: 20,
                        overflow: 'hidden',
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                        border: '1px solid #27272A',
                        position: 'relative'
                    }}>
                        {/* Header */}
                        <div style={{
                            background: 'white', // High contrast for header
                            padding: '20px 0',
                            textAlign: 'center',
                            color: 'black',
                            position: 'relative'
                        }}>
                            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>JATHIN'S LEARNING HUB</div>
                            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginTop: 4, letterSpacing: 2 }}>STUDENT IDENTITY CARD</div>

                            {/* Hole Punch Visual */}
                            <div style={{
                                width: 60, height: 6, background: '#e4e4e7', borderRadius: 10,
                                position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)'
                            }}></div>
                        </div>

                        {/* Photo Section */}
                        <div style={{ textAlign: 'center', marginTop: 30, marginBottom: 20 }}>
                            <div style={{
                                width: 140, height: 140, borderRadius: '50%',
                                border: '5px solid #27272A',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                                overflow: 'hidden',
                                margin: '0 auto',
                                background: '#18181B'
                            }}>
                                <img
                                    src={
                                        getProxiedImageUrl(s.profileUrl) ||
                                        `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}&background=18181b&color=fff&size=256`
                                    }
                                    alt="Profile"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <h2 style={{ margin: '15px 0 5px', fontSize: 24, fontWeight: 800, color: 'white' }}>
                                {s.firstName} {s.lastName}
                            </h2>
                            <div style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: 12,
                                background: '#27272A',
                                color: 'white',
                                fontSize: 12, fontWeight: 700,
                                textTransform: 'uppercase',
                                border: '1px solid #3F3F46'
                            }}>
                                Student
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div style={{ padding: '0 30px 30px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 10px' }}>
                                <IDItem label="Student ID" value={s.id.slice(-6).toUpperCase()} />
                                <IDItem label="Class" value={`Class ${s.classLevel}`} />
                                <IDItem label="Team" value={s.team?.name || 'N/A'} />
                                <IDItem label="Phone" value={s.phoneNumber || '-'} />
                                <IDItem label="D.O.B" value={s.dob ? new Date(s.dob).toLocaleDateString() : '-'} />
                                <IDItem label="Status" value={s.active ? 'Active' : 'Inactive'} color={s.active ? 'white' : 'var(--text-muted)'} />
                            </div>

                            <div style={{ marginTop: 20 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Email Address</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{user.email}</div>
                            </div>
                        </div>

                        {/* Footer / Barcode */}
                        <div style={{
                            background: '#18181B',
                            padding: '15px',
                            borderTop: '1px solid #27272A',
                            textAlign: 'center'
                        }}>
                            {/* Fake Barcode Visual */}
                            <div style={{
                                height: 35,
                                background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='40' viewBox='0 0 4 40'%3E%3Crect width='2' height='40' fill='%2371717a'/%3E%3C/svg%3E")`,
                                backgroundSize: '4px 35px',
                                width: '80%',
                                margin: '0 auto',
                                opacity: 0.8
                            }}></div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, letterSpacing: 2 }}>
                                {s.id.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
            </StudentLayout>
        </ProtectedRoute>
    )
}

function IDItem({ label, value, color }) {
    return (
        <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: color || 'white', marginTop: 1 }}>{value}</div>
        </div>
    )
}
