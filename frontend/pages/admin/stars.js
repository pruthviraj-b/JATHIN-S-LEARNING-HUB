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

    // Bulk Award
    const [bulkMode, setBulkMode] = useState(false)
    const [selectedStudents, setSelectedStudents] = useState([])
    const [bulkData, setBulkData] = useState({ points: 5, reason: 'Homework Excellence' })

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
            alert("To undo, please award negative points.")
        } catch (e) { }
    }

    const performBulkAward = async () => {
        if (selectedStudents.length === 0) return alert('Please select at least one student')
        if (!bulkData.reason) return alert('Please enter a reason')

        try {
            await Promise.all(selectedStudents.map(studentId =>
                apiCall('/stars', {
                    method: 'POST', body: JSON.stringify({
                        studentId,
                        points: Number(bulkData.points),
                        reason: bulkData.reason,
                        date
                    })
                })
            ))
            alert(`✅ Awarded ${bulkData.points} points to ${selectedStudents.length} students!`)
            setSelectedStudents([])
            setBulkMode(false)
            refreshAll()
        } catch (err) {
            alert(err.message)
        }
    }

    const toggleSelectStudent = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        )
    }

    const toggleSelectAll = () => {
        if (selectedStudents.length === studentOptions.length) {
            setSelectedStudents([])
        } else {
            setSelectedStudents(studentOptions.map(s => s.id))
        }
    }

    const updateWeeklyCaptains = async () => {
        if (!confirm("👑 Update Weekly Captains?\n\nThis will automatically assign the Captain role to the student with the HIGHEST points in each team.")) return

        setLoading(prev => ({ ...prev, captains: true }))
        try {
            const res = await apiCall('/teams/update-captains', { method: 'POST' })
            alert(`✅ Captains Updated!\n\n${res.updated} teams have new captains.\n${res.logs.join('\n')}`)
            refreshAll()
        } catch (e) {
            alert(e.message)
        } finally {
            setLoading(prev => ({ ...prev, captains: false }))
        }
    }

    // Leaderboard Processing
    const topStudent = studentLeaderboard?.[0]
    const topTeam = teamLeaderboard?.[0]

    // Selector Options
    const studentOptions = useMemo(() => students?.filter(s => s.active && (s.firstName.toLowerCase().includes(filterQuery) || s.lastName?.toLowerCase().includes(filterQuery))) || [], [students, filterQuery])
    // Basic unique team extraction
    const teamOptions = useMemo(() => {
        const map = new Map();
        students?.forEach(s => { if (s.team) map.set(s.team.id, s.team) })
        return Array.from(map.values())
    }, [students])


    // Rank Logic (1, 1, 3) - Tie-Aware Ranking
    const rankedStudentLeaderboard = useMemo(() => {
        if (!studentLeaderboard) return []
        let currentRank = 1
        return studentLeaderboard.map((student, index) => {
            if (index > 0 && student.points < studentLeaderboard[index - 1].points) {
                currentRank = index + 1
            }
            return { ...student, rank: currentRank }
        })
    }, [studentLeaderboard])

    const rankedTeamLeaderboard = useMemo(() => {
        if (!teamLeaderboard) return []
        let currentRank = 1
        return teamLeaderboard.map((team, index) => {
            if (index > 0 && team.points < teamLeaderboard[index - 1].points) {
                currentRank = index + 1
            }
            return { ...team, rank: currentRank }
        })
    }, [teamLeaderboard])

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>

                {/* Header Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 30 }}>
                    <div className="card" style={{
                        background: 'linear-gradient(135deg, #000 0%, #333 100%)',
                        color: 'white',
                        border: '1px solid #000',
                        borderLeft: '4px solid #D4AF37', // Gold Accent
                        boxShadow: 'var(--shadow-card)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <div style={{ background: 'rgba(212, 175, 55, 0.2)', padding: 12, borderRadius: 12, border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                                <Trophy size={24} color="#D4AF37" />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, opacity: 0.9, color: '#D4D4D8' }}>Top Student</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>{topStudent ? `${topStudent.student?.firstName} ${topStudent.student?.lastName}` : '---'}</div>
                                <div style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>{topStudent?.points || 0} Points</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{
                        background: 'linear-gradient(135deg, #fff 0%, #f3f4f6 100%)',
                        border: '1px solid var(--glass-border)',
                        borderLeft: '4px solid #3B82F6', // Blue Accent
                        boxShadow: 'var(--shadow-card)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: 12, borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <Crown size={24} color="#3B82F6" />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Top Team</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>{topTeam ? topTeam.team?.name : '---'}</div>
                                <div style={{ fontSize: 13, color: '#3B82F6', fontWeight: 600 }}>{topTeam?.points || 0} Points</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="admin-stars-grid">

                    {/* Left Column: Awarding & Leaderboard */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Awarding Console */}
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{ background: '#D4AF37', padding: 8, borderRadius: 8, color: 'white' }}><Zap size={18} fill="currentColor" /></div>
                                <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>Quick Award</h3>
                            </div>

                            <div style={{ display: 'flex', gap: 10, background: '#F4F4F5', padding: 5, borderRadius: 12, width: 'fit-content', marginBottom: 20, border: '1px solid #E4E4E7' }}>
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
                                    <div className="award-form-row">
                                        <input
                                            className="input-field"
                                            placeholder="e.g. Excellent presentation"
                                            value={awardData.reason}
                                            onChange={e => setAwardData({ ...awardData, reason: e.target.value })}
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="submit"
                                            className="btn"
                                            disabled={loading[awardData.targetId]}
                                            style={{
                                                minWidth: 100,
                                                background: '#D4AF37',
                                                color: 'white',
                                                fontWeight: 700,
                                                border: 'none',
                                                boxShadow: '0 4px 10px rgba(212, 175, 55, 0.4)'
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
                                                    background: awardData.reason === r ? '#D4AF37' : 'white',
                                                    padding: '6px 12px',
                                                    borderRadius: 20,
                                                    cursor: 'pointer',
                                                    color: awardData.reason === r ? 'white' : 'var(--text-muted)',
                                                    fontWeight: awardData.reason === r ? 700 : 500,
                                                    border: '1px solid',
                                                    borderColor: awardData.reason === r ? '#D4AF37' : '#E4E4E7',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </form>

                            {/* Bulk Award Toggle */}
                            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #E4E4E7' }}>
                                <button
                                    onClick={() => { setBulkMode(!bulkMode); setSelectedStudents([]) }}
                                    className="btn"
                                    style={{
                                        width: '100%',
                                        background: bulkMode ? '#DC2626' : '#D4AF37',
                                        color: 'white',
                                        fontWeight: 700,
                                        border: 'none'
                                    }}
                                >
                                    {bulkMode ? '❌ Cancel Bulk Mode' : '⭐ Bulk Award to Multiple Students'}
                                </button>
                            </div>
                        </div>

                        {/* Bulk Award Panel */}
                        {bulkMode && (
                            <div className="card" style={{ borderLeft: '4px solid #D4AF37' }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: 18, color: 'var(--text-main)' }}>
                                    Bulk Award - Select Students
                                </h3>

                                {/* Select All / Points / Reason */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 15, marginBottom: 20 }}>
                                    <div>
                                        <label style={labelStyle}>Reason</label>
                                        <input
                                            className="input-field"
                                            placeholder="e.g. Excellent presentation"
                                            value={bulkData.reason}
                                            onChange={e => setBulkData({ ...bulkData, reason: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Points</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={bulkData.points}
                                            onChange={e => setBulkData({ ...bulkData, points: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Select All Button */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                    <button
                                        onClick={toggleSelectAll}
                                        className="btn btn-outline"
                                        style={{ fontSize: 13, padding: '8px 16px' }}
                                    >
                                        {selectedStudents.length === studentOptions.length ? 'Deselect All' : 'Select All'} ({studentOptions.length})
                                    </button>
                                    <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
                                        {selectedStudents.length} selected
                                    </span>
                                </div>

                                {/* Student Checkbox List */}
                                <div style={{
                                    maxHeight: 300,
                                    overflowY: 'auto',
                                    border: '1px solid #E4E4E7',
                                    borderRadius: 8,
                                    marginBottom: 20
                                }}>
                                    {studentOptions.map(student => (
                                        <label
                                            key={student.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: 12,
                                                borderBottom: '1px solid #F4F4F5',
                                                cursor: 'pointer',
                                                background: selectedStudents.includes(student.id) ? 'rgba(212, 175, 55, 0.1)' : 'white',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student.id)}
                                                onChange={() => toggleSelectStudent(student.id)}
                                                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#D4AF37' }}
                                            />
                                            <StudentProfileImage student={student} size={32} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
                                                    {student.firstName} {student.lastName}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                    Current: {student.totalPoints || 0} points
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                    {studentOptions.length === 0 && (
                                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No students found
                                        </div>
                                    )}
                                </div>

                                {/* Award Button */}
                                <button
                                    onClick={performBulkAward}
                                    disabled={selectedStudents.length === 0}
                                    className="btn"
                                    style={{
                                        width: '100%',
                                        background: '#D4AF37',
                                        color: 'white',
                                        fontWeight: 700,
                                        border: 'none',
                                        opacity: selectedStudents.length === 0 ? 0.5 : 1
                                    }}
                                >
                                    Award {bulkData.points} Points to {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                                </button>
                            </div>
                        )}

                        {/* Leaderboard - Now in Left Column */}
                        <div className="card" style={{ height: 'fit-content' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ background: 'var(--primary)', padding: 8, borderRadius: 8 }}><TrendingUp size={18} color="white" /></div>
                                    <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>Leaderboard</h3>
                                </div>

                                <button
                                    onClick={updateWeeklyCaptains}
                                    disabled={loading.captains}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid #D4AF37',
                                        color: '#D4AF37',
                                        padding: '8px 12px',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        fontSize: 12,
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        opacity: loading.captains ? 0.7 : 1
                                    }}
                                >
                                    {loading.captains ? 'Updating...' : '👑 Update Captains'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: 15, borderBottom: '1px solid #E4E4E7', marginBottom: 15 }}>
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
                                {(activeTab === 'students' ? rankedStudentLeaderboard : rankedTeamLeaderboard)?.slice(0, 10).map((entry, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px 15px',
                                        background: entry.rank <= 3 ? 'linear-gradient(to right, #000, #333)' : 'transparent',
                                        borderRadius: 12,
                                        border: entry.rank === 1 ? '1px solid #D4AF37' : entry.rank <= 3 ? '1px solid #333' : '1px solid transparent',
                                        boxShadow: entry.rank <= 3 ? '0 4px 10px rgba(0,0,0,0.3)' : 'none'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                fontWeight: 700, fontSize: 14, width: 24, height: 24, borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: entry.rank === 1 ? '#D4AF37' : entry.rank === 2 ? '#94A3B8' : entry.rank === 3 ? '#B45309' : '#F4F4F5',
                                                color: entry.rank <= 3 ? 'white' : 'var(--text-muted)',
                                                boxShadow: entry.rank <= 3 ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
                                            }}>
                                                {entry.rank}
                                            </div>
                                            {activeTab === 'students' && entry.student ?
                                                <StudentProfileImage student={entry.student} size={32} /> :
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E4E4E7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>👥</div>
                                            }
                                            <div style={{ fontSize: 14, fontWeight: 600, color: entry.rank <= 3 ? 'white' : 'var(--text-main)' }}>
                                                {activeTab === 'students' ? `${entry.student?.firstName} ${entry.student?.lastName}` : entry.team?.name}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: idx === 0 ? '#D4AF37' : entry.rank <= 3 ? '#E4E4E7' : 'var(--text-muted)', fontSize: 14 }}>
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

                    {/* Right Column: Recent Activity (Moved Down/Right) */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <div style={{ background: 'var(--primary)', padding: 8, borderRadius: 8 }}><History size={18} color="white" /></div>
                            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>Recent Activity</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {recentStars?.map((star, i) => (
                                <div key={star.id || i} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 0', borderBottom: '1px solid #F4F4F5'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            background: star.points > 0 ? '#ECFDF5' : '#FEF2F2',
                                            border: '1px solid',
                                            borderColor: star.points > 0 ? '#A7F3D0' : '#FECACA',
                                            color: star.points > 0 ? '#059669' : '#DC2626',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12
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
            </AdminLayout>
        </ProtectedRoute>
    )
}

const TabBtn = ({ label, icon: Icon, active, onClick }) => (
    <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
        background: active ? 'white' : 'transparent',
        color: active ? 'black' : 'var(--text-muted)',
        fontWeight: active ? 700 : 500,
        boxShadow: active ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
        transition: 'all 0.2s',
        fontSize: 13
    }}>
        <Icon size={16} color={active ? 'black' : 'currentColor'} />
        {label}
    </button>
)

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }
