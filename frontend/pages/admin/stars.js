import { useState, useMemo } from 'react'
import useSWR from 'swr'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import StudentProfileImage from '../../components/StudentProfileImage'
import { Users, User, Trophy, Crown, Star, History, TrendingUp, Award, Zap } from 'lucide-react'

const fetcher = (url) => apiCall(url)

export default function ManageStars() {
    const { data: students, mutate: mutateStudents } = useSWR('/students', fetcher)
    const { data: recentStars, mutate: mutateStars } = useSWR('/stars', fetcher)
    const { data: studentLeaderboard, mutate: mutateSL } = useSWR('/stars/leaderboard/students', fetcher)
    const { data: teamLeaderboard, mutate: mutateTL } = useSWR('/stars/leaderboard/teams', fetcher)

    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState({})
    const [activeTab, setActiveTab] = useState('students') // 'students' | 'teams'

    // Form
    const [awardData, setAwardData] = useState({ points: 5, reason: 'Homework Excellence', targetId: '', isTeam: false })
    const [filterQuery, setFilterQuery] = useState('')

    // Computations
    const refreshAll = () => { mutateStudents(); mutateStars(); mutateSL(); mutateTL(); }

    const performAward = async (e) => {
        e.preventDefault()
        if (!awardData.targetId) return alert('Please select a student or team')

        const targetId = awardData.targetId
        setLoading(prev => ({ ...prev, [targetId]: true }))

        try {
            const body = {
                points: Number(awardData.points),
                reason: awardData.reason,
                date,
                [awardData.isTeam ? 'teamId' : 'studentId']: targetId
            }

            await apiCall('/stars', { method: 'POST', body: JSON.stringify(body) })
            // alert(`✅ Awarded ${awardData.points} stars!`)
            setAwardData(prev => ({ ...prev, reason: '', targetId: '' })) // partial reset
            refreshAll()
        } catch (err) {
            alert(err.message)
        } finally {
            setLoading(prev => ({ ...prev, [targetId]: false }))
        }
    }

    const deleteStar = async (id) => {
        if (!confirm('Undo this award?')) return
        try {
            // Note: Assuming a delete endpoint exists or we just don't implement delete yet if not. 
            // Looking at routes/stars.js, DELETE isn't there. 
            // I'll show it for UI completeness but it might need backend implementation.
            // For now, let's assume specific deletion isn't supported by backend yet or add it later.
            // Actually, I'll allow "Negative" awards (Deductions) instead which IS supported.
            alert("To undo, please award negative points.")
        } catch (e) { }
    }

    // Leaderboard Processing
    const topStudent = studentLeaderboard?.[0]
    const topTeam = teamLeaderboard?.[0]

    // Selector Options
    const studentOptions = useMemo(() => students?.filter(s => s.active && (s.firstName.toLowerCase().includes(filterQuery) || s.lastName?.toLowerCase().includes(filterQuery))) || [], [students, filterQuery])
    // Basic unique team extraction (can also fetch /teams if needed but extracting from students is fine for now)
    const teamOptions = useMemo(() => {
        const map = new Map();
        students?.forEach(s => { if (s.team) map.set(s.team.id, s.team) })
        return Array.from(map.values())
    }, [students])


    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>

                {/* Header Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 30 }}>
                    <div className="card" style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #09090b 100%)',
                        color: 'white',
                        border: '1px solid #1e293b',
                        borderLeft: '4px solid #D4AF37', // Gold Accent
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: 12, borderRadius: 12, border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                <Trophy size={24} color="#D4AF37" />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, opacity: 0.9, color: '#94A3B8' }}>Top Student</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>{topStudent ? `${topStudent.student?.firstName} ${topStudent.student?.lastName}` : '---'}</div>
                                <div style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>{topStudent?.points || 0} Points</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #09090b 100%)',
                        border: '1px solid #1e293b',
                        borderLeft: '4px solid #3B82F6', // Blue Accent
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: 12, borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <Crown size={24} color="#3B82F6" />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, color: '#94A3B8' }}>Top Team</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>{topTeam ? topTeam.team?.name : '---'}</div>
                                <div style={{ fontSize: 13, color: '#3B82F6', fontWeight: 600 }}>{topTeam?.points || 0} Points</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="admin-stars-grid">

                    {/* Left Column: Awarding & Activity */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Awarding Console */}
                        <div className="card" style={{ border: '1px solid #27272A', background: '#09090B' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{ background: '#D4AF37', padding: 8, borderRadius: 8, color: 'black' }}><Zap size={18} fill="currentColor" /></div>
                                <h3 style={{ margin: 0, fontSize: 18, color: 'white' }}>Quick Award</h3>
                            </div>

                            <div style={{ display: 'flex', gap: 10, background: '#18181B', padding: 5, borderRadius: 12, width: 'fit-content', marginBottom: 20, border: '1px solid #27272A' }}>
                                <TabBtn active={!awardData.isTeam} onClick={() => setAwardData({ ...awardData, isTeam: false, targetId: '' })} label="Student" icon={User} />
                                <TabBtn active={awardData.isTeam} onClick={() => setAwardData({ ...awardData, isTeam: true, targetId: '' })} label="Team" icon={Users} />
                            </div>

                            <form onSubmit={performAward} style={{ display: 'grid', gap: 15 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 15 }}>
                                    <div>
                                        <label style={labelStyle}>Recipient</label>
                                        <select
                                            required
                                            className="input-field"
                                            value={awardData.targetId}
                                            onChange={e => setAwardData({ ...awardData, targetId: e.target.value })}
                                            style={{ height: 48, background: '#18181B', borderColor: '#27272A' }}
                                        >
                                            <option value="">Select {awardData.isTeam ? 'Team' : 'Student'}...</option>
                                            {!awardData.isTeam ?
                                                studentOptions.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>) :
                                                teamOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                                            }
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Points</label>
                                        <input
                                            type="number"
                                            required
                                            className="input-field"
                                            value={awardData.points}
                                            onChange={e => setAwardData({ ...awardData, points: e.target.value })}
                                            style={{ height: 48, background: '#18181B', borderColor: '#27272A' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Reason</label>
                                    <div className="award-form-row">
                                        <input
                                            className="input-field"
                                            placeholder="e.g. Excellent presentation"
                                            value={awardData.reason}
                                            onChange={e => setAwardData({ ...awardData, reason: e.target.value })}
                                            style={{ background: '#18181B', borderColor: '#27272A', flex: 1 }}
                                        />
                                        <button
                                            type="submit"
                                            className="btn"
                                            disabled={loading[awardData.targetId]}
                                            style={{
                                                minWidth: 100,
                                                background: '#D4AF37',
                                                color: 'black',
                                                fontWeight: 700,
                                                border: 'none'
                                            }}
                                        >
                                            {loading[awardData.targetId] ? '...' : 'Award'}
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                                        {['Homework', 'Participation', 'Discipline', 'Full Marks', 'Helping Others'].map(r => (
                                            <span
                                                key={r}
                                                onClick={() => setAwardData({ ...awardData, reason: r })}
                                                style={{
                                                    fontSize: 11,
                                                    background: awardData.reason === r ? '#D4AF37' : '#18181B',
                                                    padding: '6px 12px',
                                                    borderRadius: 20,
                                                    cursor: 'pointer',
                                                    color: awardData.reason === r ? 'black' : '#94A3B8',
                                                    fontWeight: awardData.reason === r ? 700 : 500,
                                                    border: '1px solid',
                                                    borderColor: awardData.reason === r ? '#D4AF37' : '#27272A',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Recent Activity */}
                        <div className="card" style={{ background: '#09090B', border: '1px solid #27272A' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{ background: '#18181B', padding: 8, borderRadius: 8, border: '1px solid #27272A' }}><History size={18} color="white" /></div>
                                <h3 style={{ margin: 0, fontSize: 18 }}>Recent Activity</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {recentStars?.map((star, i) => (
                                    <div key={star.id || i} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px 0', borderBottom: '1px solid #27272A'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: star.points > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid',
                                                borderColor: star.points > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                color: star.points > 0 ? '#10B981' : '#EF4444',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12
                                            }}>
                                                {star.points > 0 ? '+' : ''}{star.points}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                                                    {star.student?.firstName || star.team?.name || 'Unknown'}
                                                    <span style={{ fontWeight: 400, color: '#64748B', fontSize: 12, marginLeft: 6 }}>
                                                        {star.teamId && !star.studentId ? '(Team)' : ''}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{star.reason}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748B', textAlign: 'right' }}>
                                            {new Date(star.createdAt).toLocaleDateString()}
                                            <div style={{ fontSize: 10 }}>{new Date(star.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>
                                ))}
                                {!recentStars?.length && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No recent activity</div>}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Leaderboards */}
                    <div className="card" style={{ height: 'fit-content', background: '#09090B', border: '1px solid #27272A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ background: '#18181B', padding: 8, borderRadius: 8, border: '1px solid #27272A' }}><TrendingUp size={18} color="white" /></div>
                                <h3 style={{ margin: 0, fontSize: 18 }}>Leaderboard</h3>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 15, borderBottom: '1px solid #27272A', marginBottom: 15 }}>
                            <span
                                onClick={() => setActiveTab('students')}
                                style={{
                                    paddingBottom: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                                    borderBottom: activeTab === 'students' ? '2px solid #D4AF37' : '2px solid transparent',
                                    color: activeTab === 'students' ? '#D4AF37' : 'var(--text-muted)'
                                }}
                            >
                                Top Students
                            </span>
                            <span
                                onClick={() => setActiveTab('teams')}
                                style={{
                                    paddingBottom: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                                    borderBottom: activeTab === 'teams' ? '2px solid #D4AF37' : '2px solid transparent',
                                    color: activeTab === 'teams' ? '#D4AF37' : 'var(--text-muted)'
                                }}
                            >
                                Top Teams
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(activeTab === 'students' ? studentLeaderboard : teamLeaderboard)?.slice(0, 10).map((entry, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 15px',
                                    background: idx < 3 ? 'linear-gradient(to right, #18181B, #09090B)' : 'transparent',
                                    borderRadius: 12,
                                    border: idx === 0 ? '1px solid #D4AF37' : idx < 3 ? '1px solid #27272A' : '1px solid transparent'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            fontWeight: 700, fontSize: 14, width: 24, height: 24, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: idx === 0 ? '#D4AF37' : idx === 1 ? '#94A3B8' : idx === 2 ? '#B45309' : '#18181B',
                                            color: idx < 3 ? 'white' : 'var(--text-muted)',
                                            boxShadow: idx < 3 ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
                                        }}>
                                            {idx + 1}
                                        </div>
                                        {activeTab === 'students' && entry.student ?
                                            <StudentProfileImage student={entry.student} size={32} /> :
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>👥</div>
                                        }
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                                            {activeTab === 'students' ? `${entry.student?.firstName} ${entry.student?.lastName}` : entry.team?.name}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 700, color: idx === 0 ? '#D4AF37' : 'var(--text-muted)', fontSize: 14 }}>
                                        {entry.points} ⭐
                                    </div>
                                </div>
                            ))}
                            {!(activeTab === 'students' ? studentLeaderboard : teamLeaderboard)?.length &&
                                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No points awarded yet</div>
                            }
                        </div>

                    </div>

                </div>
            </AdminLayout>
        </ProtectedRoute>
    )
}

const TabBtn = ({ label, icon: Icon, active, onClick }) => (
    <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
        background: active ? '#27272A' : 'transparent',
        color: active ? 'white' : 'var(--text-muted)',
        fontWeight: active ? 700 : 500,
        boxShadow: active ? '0 2px 5px rgba(0,0,0,0.5)' : 'none',
        transition: 'all 0.2s',
        fontSize: 13
    }}>
        <Icon size={16} color={active ? 'white' : 'currentColor'} />
        {label}
    </button>
)

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }
