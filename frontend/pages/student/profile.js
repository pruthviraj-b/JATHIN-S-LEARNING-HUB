import { useState, useEffect } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import StudentLayout from '../../components/StudentLayout'
import { useAuth } from '../../hooks/useAuth'
import { apiCall } from '../../lib/api'

// Simple Badge Component if not imported
function BadgeCard({ badge, awardedAt, size }) {
    return (
        <div style={{ background: '#18181B', padding: 10, borderRadius: 8, border: '1px solid #27272A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 20 }}>{badge.icon}</div>
            <div>
                <div style={{ fontWeight: 'bold', fontSize: 13, color: 'white' }}>{badge.name}</div>
                <div style={{ fontSize: 10, color: '#A1A1AA' }}>{new Date(awardedAt).toLocaleDateString()}</div>
            </div>
        </div>
    )
}

export default function Profile() {
    const { user } = useAuth()
    // --- Badges ---
    const [badges, setBadges] = useState([]);

    useEffect(() => {
        if (user?.student?.id) {
            fetchBadges();
        }
    }, [user]);

    const fetchBadges = async () => {
        try {
            const data = await apiCall(`/badges/student/${user.student.id}`);
            // data is array of StudentBadge { badge: Badge }
            setBadges(data.map(sb => sb.badge));
        } catch (err) {
            console.error('Failed to fetch badges', err);
        }
    };

    if (!user) return <div>Loading...</div>

    const s = user.student || {}

    return (
        <StudentLayout>
            <div className="animate-fade-in">
                <h1 style={{ marginBottom: 20 }}>My Profile</h1>

                {/* Digital ID Card */}
                <div className="id-card-container" style={{ marginBottom: 40 }}>
                    <div className="id-card" style={{
                        background: 'white',
                        borderRadius: 20,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                        maxWidth: 400,
                        margin: '0 auto',
                        position: 'relative',
                        paddingBottom: 20
                    }}>
                        {/* Header Gradient */}
                        <div style={{ height: 100, background: 'linear-gradient(135deg, #1C2541, #0F172A)' }}></div>

                        {/* Avatar */}
                        <div style={{ marginTop: -50, display: 'flex', justifyContent: 'center', marginBottom: 15 }}>
                            <div style={{ padding: 4, background: 'white', borderRadius: '50%' }}>
                                <img
                                    src={s.profileUrl || `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}&background=0D8ABC&color=fff`}
                                    style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }}
                                    alt="Profile"
                                />
                            </div>
                        </div>

                        {/* Student Info */}
                        <div style={{ textAlign: 'center', padding: '0 20px 20px' }}>
                            <h2 style={{ fontSize: 24, margin: '0 0 5px 0', color: '#111' }}>{s.firstName} {s.lastName}</h2>
                            <p style={{ color: '#666', margin: 0, fontSize: 14 }}>{user.email}</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginTop: 25, textAlign: 'left', background: '#F8FAFC', padding: 20, borderRadius: 12 }}>
                                <IDItem label="Class" value={`Class ${s.classLevel || 'N/A'}`} color="#333" />
                                <IDItem label="DOB" value={s.dob ? new Date(s.dob).toLocaleDateString() : 'N/A'} color="#333" />
                                <IDItem label="Phone" value={s.phoneNumber || 'N/A'} color="#333" />
                                <IDItem label="Status" value={s.active ? 'Active' : 'Inactive'} color={s.active ? 'green' : 'red'} />
                            </div>
                        </div>

                        {/* Barcode Footer */}
                        <div style={{ borderTop: '1px dashed #E2E8F0', padding: '20px 0', textAlign: 'center' }}>
                            <div style={{
                                height: 35,
                                background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='40' viewBox='0 0 4 40'%3E%3Crect width='2' height='40' fill='%2371717a'/%3E%3C/svg%3E")`,
                                backgroundSize: '4px 35px',
                                width: '60%',
                                margin: '0 auto',
                                opacity: 0.5
                            }}></div>
                            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 5, letterSpacing: 2, fontWeight: 700 }}>
                                {s.id ? s.id.toUpperCase() : 'ID-PENDING'}
                            </div>
                        </div>
                    </div>

                    {/* Achievements Section */}
                    <div style={{ paddingLeft: 40, flex: 1 }}>
                        <h2 style={{ color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            Achievements
                            <span style={{ fontSize: 12, background: '#27272A', padding: '2px 8px', borderRadius: 10, border: '1px solid #3F3F46' }}>{badges.length}</span>
                        </h2>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
                            {badges.map(sb => (
                                <BadgeCard key={sb.badge.id} badge={sb.badge} awardedAt={sb.awardedAt} size="small" />
                            ))}
                            {badges.length === 0 && (
                                <div style={{
                                    color: 'var(--text-muted)',
                                    border: '1px dashed #27272A',
                                    padding: 30,
                                    borderRadius: 12,
                                    width: '100%',
                                    textAlign: 'center'
                                }}>
                                    No badges earned yet. Keep studying! 🏆
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
        </ProtectedRoute >
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
