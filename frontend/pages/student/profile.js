import { useState, useEffect } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import StudentLayout from '../../components/StudentLayout'
import { useAuth } from '../../hooks/useAuth'
import { apiCall } from '../../lib/api'

// Simple Badge Component if not imported
function BadgeCard({ badge, awardedAt, size }) {
    return (
        <div style={{ background: 'white', padding: 10, borderRadius: 8, border: '1px solid #E4E4E7', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 20 }}>{badge.icon}</div>
            <div>
                <div style={{ fontWeight: 'bold', fontSize: 13, color: 'var(--text-main)' }}>{badge.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(awardedAt).toLocaleDateString()}</div>
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
        <ProtectedRoute>
            <StudentLayout>
                <div className="animate-fade-in">
                    <h1 style={{ marginBottom: 20, color: 'var(--text-main)' }}>My Profile</h1>

                    {/* Digital ID Card */}
                    <div className="id-card-container" style={{ marginBottom: 40 }}>
                        <div className="id-card" style={{
                            background: 'white',
                            borderRadius: 20,
                            boxShadow: 'var(--shadow-card)',
                            overflow: 'hidden',
                            maxWidth: 400,
                            margin: '0 auto',
                            position: 'relative',
                            paddingBottom: 20,
                            border: '1px solid #E4E4E7'
                        }}>
                            {/* Header Gradient */}
                            <div style={{ height: 100, background: 'linear-gradient(135deg, #000 0%, #333 100%)' }}></div>

                            {/* Avatar */}
                            <div style={{ marginTop: -50, display: 'flex', justifyContent: 'center', marginBottom: 15 }}>
                                <div style={{ padding: 4, background: 'white', borderRadius: '50%' }}>
                                    <img
                                        src={s.profileUrl || `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}&background=D4AF37&color=fff`}
                                        style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }}
                                        alt="Profile"
                                    />
                                </div>
                            </div>

                            {/* Student Info */}
                            <div style={{ textAlign: 'center', padding: '0 20px 20px' }}>
                                <h2 style={{ fontSize: 24, margin: '0 0 5px 0', color: 'var(--text-main)' }}>{s.firstName} {s.lastName}</h2>
                                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>{user.email}</p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginTop: 25, textAlign: 'left', background: '#F8FAFC', padding: 20, borderRadius: 12, border: '1px solid #E4E4E7' }}>
                                    <IDItem label="Class" value={`Class ${s.classLevel || 'N/A'}`} color="var(--text-main)" />
                                    <IDItem label="DOB" value={s.dob ? new Date(s.dob).toLocaleDateString() : 'N/A'} color="var(--text-main)" />
                                    <IDItem label="Phone" value={s.phoneNumber || 'N/A'} color="var(--text-main)" />
                                    <IDItem label="Status" value={s.active ? 'Active' : 'Inactive'} color={s.active ? '#166534' : '#991B1B'} />
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
                        <div style={{ paddingLeft: 40, flex: 1, marginTop: 20 }}>
                            <h2 style={{ color: 'var(--text-main)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                Achievements
                                <span style={{ fontSize: 12, background: '#F4F4F5', padding: '2px 8px', borderRadius: 10, border: '1px solid #E4E4E7', color: 'var(--text-main)' }}>{badges.length}</span>
                            </h2>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
                                {badges.map(sb => (
                                    <BadgeCard key={sb.badge.id} badge={sb.badge} awardedAt={sb.awardedAt} size="small" />
                                ))}
                                {badges.length === 0 && (
                                    <div style={{
                                        color: 'var(--text-muted)',
                                        border: '1px dashed #E4E4E7',
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
        </ProtectedRoute>
    )
}

function IDItem({ label, value, color }) {
    return (
        <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: color || 'var(--text-main)', marginTop: 1 }}>{value}</div>
        </div>
    )
}
