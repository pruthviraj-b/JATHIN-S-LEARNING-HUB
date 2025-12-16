import { useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import StudentLayout from '../../components/StudentLayout'
import { useAuth } from '../../hooks/useAuth'
import { apiCall } from '../../lib/api'
import { Mail, Users, Calendar, CheckCircle, Edit3, X, Camera, Save, Lock } from 'lucide-react'

export default function Profile() {
    const { user, login } = useAuth() // Assuming login/reload can refresh, or we just rely on page reload/local state
    // To properly refresh user data, we ideally need a 'refresh' method in useAuth, or we simple setLocalState.
    // For now, we'll try to rely on re-fetching or just manual hack.
    const s = user?.student

    const [isEditing, setIsEditing] = useState(false)

    const handleUpdate = async (data) => {
        try {
            await apiCall('/students/profile/me', {
                method: 'PUT',
                body: JSON.stringify(data)
            })
            alert('Profile updated successfully!')
            setIsEditing(false)
            window.location.reload() // Simple way to refresh user context
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <StudentLayout>
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>My Profile</h1>
                        <p style={{ margin: '5px 0 0', color: '#64748b' }}>Manage your personal information</p>
                    </div>
                    {s && (
                        <button
                            onClick={() => setIsEditing(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: '#0f172a', color: 'white',
                                border: 'none', padding: '10px 20px', borderRadius: 8,
                                fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }}
                        >
                            <Edit3 size={16} /> Edit Profile
                        </button>
                    )}
                </div>

                {s ? (
                    <div className="card" style={{
                        background: 'white',
                        borderRadius: 16,
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}>
                        {/* Header Banner */}
                        <div style={{
                            background: '#0f172a',
                            height: 120,
                            position: 'relative',
                            backgroundImage: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)'
                        }}></div>

                        <div style={{ padding: '0 30px 40px', marginTop: -60, position: 'relative', zIndex: 2 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                <img
                                    src={s.profileUrl || `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}&background=0f172a&color=fff&size=128`}
                                    alt="Profile"
                                    style={{
                                        width: 120, height: 120, borderRadius: '50%',
                                        border: '4px solid white', background: 'white',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)', objectFit: 'cover'
                                    }}
                                />
                                <h2 style={{ margin: '15px 0 5px', fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{s.firstName} {s.lastName}</h2>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '6px 14px', borderRadius: 20,
                                    background: '#f1f5f9', color: '#475569',
                                    fontSize: 14, fontWeight: 600
                                }}>
                                    Student • Class {s.classLevel}
                                </div>
                            </div>

                            <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
                                <ProfileItem
                                    icon={<Mail size={20} />}
                                    label="Email Address"
                                    value={user.email}
                                />
                                <ProfileItem
                                    icon={<Users size={20} />}
                                    label="Team"
                                    value={s.team?.name || 'No Team Assigned'}
                                    highlight={!!s.team}
                                />
                                <ProfileItem
                                    icon={<Calendar size={20} />}
                                    label="Date of Birth"
                                    value={s.dob ? new Date(s.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not Set'}
                                />
                                <ProfileItem
                                    icon={<CheckCircle size={20} />}
                                    label="Account Status"
                                    value={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}></span> Active</span>}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading profile...</div>
                )}

                {isEditing && (
                    <EditProfileModal
                        student={s}
                        onClose={() => setIsEditing(false)}
                        onSave={handleUpdate}
                    />
                )}
            </StudentLayout>
        </ProtectedRoute>
    )
}

function ProfileItem({ icon, label, value, highlight }) {
    return (
        <div style={{
            background: '#f8fafc', padding: 20, borderRadius: 12,
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 15
        }}>
            <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: highlight ? '#0f172a' : 'white',
                color: highlight ? 'white' : '#64748b',
                border: highlight ? 'none' : '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontWeight: 600, marginTop: 4, color: '#0f172a', fontSize: 15 }}>{value}</div>
            </div>
        </div>
    )
}

function EditProfileModal({ student, onClose, onSave }) {
    const [dob, setDob] = useState(student.dob ? new Date(student.dob).toISOString().split('T')[0] : '')
    const [profileUrl, setProfileUrl] = useState(student.profileUrl || '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        await onSave({ dob, profileUrl })
        setLoading(false)
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', width: 450, maxWidth: '90%',
                borderRadius: 16, padding: 30,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Edit Profile</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Profile Image URL</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 8, background: '#f1f5f9',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                            }}>
                                {profileUrl ? <img src={profileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={20} color="#94a3b8" />}
                            </div>
                            <input
                                type="text"
                                value={profileUrl}
                                onChange={e => setProfileUrl(e.target.value)}
                                placeholder="https://..."
                                style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Date of Birth</label>
                        <input
                            type="date"
                            value={dob}
                            onChange={e => setDob(e.target.value)}
                            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'inherit' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1, padding: 12, borderRadius: 8, border: 'none',
                                background: '#0f172a', color: 'white', fontWeight: 600,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                            }}
                        >
                            {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
