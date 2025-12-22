import { useState, useMemo } from 'react'
import useSWR from 'swr'
import ProtectedRoute from '../../components/ProtectedRoute'
import AdminLayout from '../../components/AdminLayout'
import { apiCall } from '../../lib/api'
import StudentProfileImage from '../../components/StudentProfileImage'
import { Search, Loader2 } from 'lucide-react'

const fetcher = (url) => apiCall(url)

export default function ManageCaptains() {
    // Fetch Leaders
    const { data: leaders, mutate: mutateLeaders } = useSWR('/roles', fetcher)
    // Fetch All Students for selection
    const { data: students } = useSWR('/students?active=true', fetcher)

    const [loading, setLoading] = useState(false)

    const updateRole = async (role, studentId) => {
        if (!studentId) return
        if (!confirm(`Are you sure you want to promote this student to ${role.replace('_', ' ')}?`)) return

        setLoading(true)
        try {
            await apiCall('/roles/promote', {
                method: 'POST',
                body: JSON.stringify({ studentId, role })
            })
            mutateLeaders()
            // alert('✅ Role Updated!')
        } catch (e) {
            alert(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
                <div style={{ marginBottom: 30 }}>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Institute Leaders</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 5 }}>Manage the Head Captain and Vice-Captain.</p>
                </div>

                <div className="admin-stars-grid" style={{ gap: 30 }}>

                    {/* Head Captain Card */}
                    <RoleCard
                        title="Head Captain"
                        role="CAPTAIN"
                        currentHolder={leaders?.captain}
                        students={students || []}
                        onUpdate={updateRole}
                        color="#D4AF37" // Gold
                        loading={loading}
                    />

                    {/* Vice Captain Card */}
                    <RoleCard
                        title="Vice Captain"
                        role="VICE_CAPTAIN"
                        currentHolder={leaders?.viceCaptain}
                        students={students || []}
                        onUpdate={updateRole}
                        color="#94A3B8" // Silver/Platinum
                        loading={loading}
                    />

                </div>
            </AdminLayout>
        </ProtectedRoute>
    )
}

function RoleCard({ title, role, currentHolder, students, onUpdate, color, loading }) {
    const [search, setSearch] = useState('')

    // Filter students
    const filteredStudents = useMemo(() => {
        if (!search) return []
        return students.filter(s =>
            (s.firstName.toLowerCase().includes(search.toLowerCase()) ||
                s.lastName?.toLowerCase().includes(search.toLowerCase())) &&
            s.id !== currentHolder?.id // Exclude current
        ).slice(0, 5)
    }, [students, search, currentHolder])

    return (
        <div className="card" style={{
            borderTop: `4px solid ${color}`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0) 100%)',
            minHeight: 350,
            display: 'flex', flexDirection: 'column'
        }}>
            <h2 style={{ margin: '0 0 20px', color: color, fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                {role === 'CAPTAIN' ? '👑' : '🛡️'} {title}
            </h2>

            {/* Current Holder Display */}
            <div style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 30,
                background: currentHolder ? `linear-gradient(135deg, ${color}11 0%, transparent 100%)` : '#18181B',
                borderRadius: 16,
                border: `1px solid ${color}33`,
                marginBottom: 20
            }}>
                {currentHolder ? (
                    <>
                        <StudentProfileImage student={currentHolder} size={100} />
                        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 15, color: 'white' }}>
                            {currentHolder.firstName} {currentHolder.lastName}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Class {currentHolder.classLevel}</div>
                    </>
                ) : (
                    <>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px dashed #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, opacity: 0.5 }}>
                            ❓
                        </div>
                        <div style={{ marginTop: 10, color: 'var(--text-muted)' }}>No Active Leader</div>
                    </>
                )}
            </div>

            {/* Selection Area */}
            <div style={{ position: 'relative' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
                    Change {title}
                </label>
                <div style={{ position: 'relative' }}>
                    <Search size={16} color="#64748B" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                        className="input-field"
                        placeholder="Search student..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 38 }}
                        disabled={loading}
                    />
                </div>

                {/* Dropdown Results */}
                {search && (
                    <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: '#18181B', border: '1px solid #27272A',
                        borderRadius: 12, marginTop: 5, zIndex: 10,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        overflow: 'hidden'
                    }}>
                        {filteredStudents.map(s => (
                            <div
                                key={s.id}
                                onClick={() => { onUpdate(role, s.id); setSearch(''); }}
                                style={{
                                    padding: '10px 15px',
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #27272A'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#27272A'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <StudentProfileImage student={s} size={30} />
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{s.firstName} {s.lastName}</div>
                                </div>
                            </div>
                        ))}
                        {filteredStudents.length === 0 && (
                            <div style={{ padding: 15, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No matches</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
