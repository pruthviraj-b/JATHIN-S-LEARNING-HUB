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
                    <div className="card" style={{ background: '#09090B', color: 'white', border: '1px solid #27272A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <div style={{ background: '#18181B', padding: 12, borderRadius: 12, border: '1px solid #27272A' }}>
                                <Trophy size={24} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, opacity: 0.9, color: '#A1A1AA' }}>Top Student</div>
                                <div style={{ fontSize: 20, fontWeight: 700 }}>{topStudent ? `${topStudent.student?.firstName} ${topStudent.student?.lastName}` : '---'}</div>
                                <div style={{ fontSize: 13, opacity: 0.8, color: '#A1A1AA' }}>{topStudent?.points || 0} Points</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ background: '#09090B', border: '1px solid #27272A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <div style={{ background: '#18181B', padding: 12, borderRadius: 12, border: '1px solid #27272A' }}>
                                <Crown size={24} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Top Team</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>{topTeam ? topTeam.team?.name : '---'}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{topTeam?.points || 0} Points</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, alignItems: 'start' }}>

                    {/* Left Column: Awarding & Activity */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Awarding Console */}
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{ background: '#18181B', padding: 8, borderRadius: 8, border: '1px solid #27272A' }}><Zap size={18} color="white" /></div>
                                <h3 style={{ margin: 0, fontSize: 18 }}>Quick Award</h3>
                            </div>

                            <div style={{ display: 'flex', gap: 10, background: '#09090B', padding: 5, borderRadius: 12, width: 'fit-content', marginBottom: 20, border: '1px solid #27272A' }}>
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
                                            style={{ height: 48 }}
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
                                            style={{ height: 48 }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Reason</label>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <input
                                            className="input-field"
                                            placeholder="e.g. Excellent presentation"
                                            value={awardData.reason}
                                            onChange={e => setAwardData({ ...awardData, reason: e.target.value })}
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading[awardData.targetId]}
                                            style={{ minWidth: 100 }}
                                        >
                                            {loading[awardData.targetId] ? '...' : 'Award'}
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                        {['Homework', 'Participation', 'Discipline', 'Full Marks', 'Helping Others'].map(r => (
                                            <span
                                                key={r}
                                                onClick={() => setAwardData({ ...awardData, reason: r })}
                                                style={{ fontSize: 11, background: '#18181B', padding: '4px 10px', borderRadius: 20, cursor: 'pointer', color: 'var(--text-muted)', border: '1px solid #27272A' }}
                                                onMouseOver={e => { e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.color = 'white' }}
                                                onMouseOut={e => { e.currentTarget.style.borderColor = '#27272A'; e.currentTarget.style.color = 'var(--text-muted)' }}
                                            >
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Recent Activity */}
                        <div className="card">
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
                                                width: 36, height: 36, borderRadius: '50%',
                                                background: '#18181B', border: '1px solid #27272A',
                                                color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13
                                            }}>
                                                {star.points > 0 ? '+' : ''}{star.points}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                                                    {star.student?.firstName || star.team?.name || 'Unknown'}
                                                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12, marginLeft: 6 }}>
                                                        {star.teamId && !star.studentId ? '(Team)' : ''}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{star.reason}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
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
                    <div className="card" style={{ height: 'fit-content' }}>
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
                                    borderBottom: activeTab === 'students' ? '2px solid var(--primary)' : '2px solid transparent',
                                    color: activeTab === 'students' ? 'var(--primary)' : 'var(--text-muted)'
                                }}
                            >
                                Top Students
                            </span>
                            <span
                                onClick={() => setActiveTab('teams')}
                                style={{
                                    paddingBottom: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                                    borderBottom: activeTab === 'teams' ? '2px solid var(--primary)' : '2px solid transparent',
                                    color: activeTab === 'teams' ? 'var(--primary)' : 'var(--text-muted)'
                                }}
                            >
                                Top Teams
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(activeTab === 'students' ? studentLeaderboard : teamLeaderboard)?.slice(0, 10).map((entry, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 15px', background: idx < 3 ? '#18181B' : '#09090B', borderRadius: 12,
                                    border: idx < 3 ? '1px solid #27272A' : 'none'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            fontWeight: 700, fontSize: 14, width: 24, height: 24, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: idx === 0 ? 'white' : idx === 1 ? '#D4D4D8' : idx === 2 ? '#A1A1AA' : 'transparent',
                                            color: idx < 3 ? 'black' : 'var(--text-muted)'
                                        }}>
                                            {idx + 1}
                                        </div>
                                        {activeTab === 'students' && entry.student ?
                                            <StudentProfileImage student={entry.student} size={32} /> :
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E0E5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>👥</div>
                                        }
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                                            {activeTab === 'students' ? `${entry.student?.firstName} ${entry.student?.lastName}` : entry.team?.name}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>
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
