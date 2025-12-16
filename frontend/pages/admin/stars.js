import { useState, useMemo } from 'react'
import useSWR from 'swr'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import { Users, User, Settings, X, Plus, Trash2, Check, Crown } from 'lucide-react'

const fetcher = (url) => apiCall(url)

export default function ManageStars() {
    const { data: students, mutate } = useSWR('/students', fetcher)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState({})
    const [activeTab, setActiveTab] = useState('students') // 'students' | 'teams'

    // Manage Modal State
    const [managingTeam, setManagingTeam] = useState(null)

    // Quick Assign State
    const [points, setPoints] = useState(5)
    const [reason, setReason] = useState('Daily Performance')

    // Extract unique teams from students
    const teams = useMemo(() => {
        if (!students) return []
        const uniqueTeams = new Map()
        students.forEach(s => {
            if (s.team) {
                if (!uniqueTeams.has(s.team.id)) {
                    uniqueTeams.set(s.team.id, { ...s.team, members: [] })
                }
                uniqueTeams.get(s.team.id).members.push(s)
            }
        })
        return Array.from(uniqueTeams.values())
    }, [students])

    const giveStar = async (targetId, targetName, pointsVal, isTeam = false) => {
        setLoading(prev => ({ ...prev, [targetId]: true }))
        try {
            const body = {
                points: Number(pointsVal),
                reason: pointsVal < 0 ? `${reason} (Deduction)` : reason,
                date
            }
            if (isTeam) body.teamId = targetId
            else body.studentId = targetId

            await apiCall('/stars', { method: 'POST', body: JSON.stringify(body) })
            const action = pointsVal > 0 ? 'Awarded' : 'Deducted'
            alert(`✅ ${action} ${Math.abs(pointsVal)} stars ${pointsVal > 0 ? 'to' : 'from'} ${isTeam ? 'Team' : 'Student'} ${targetName}!`)
            mutate()
        } catch (err) {
            alert(err.message)
        } finally {
            setLoading(prev => ({ ...prev, [targetId]: false }))
        }
    }

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Daily Star Awards</h1>
                        <p style={{ color: '#666', margin: '5px 0 0 0' }}>Award stars to students or entire teams</p>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 30, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'end', background: 'white', padding: 24, borderRadius: 16 }}>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, color: '#64748b' }}>POINTS</label>
                        <input
                            type="number"
                            value={points}
                            onChange={e => setPoints(e.target.value)}
                            className="input-field"
                            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15 }}
                        />
                    </div>
                    <div style={{ flex: '2 1 300px' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, color: '#64748b' }}>REASON / ACTIVITY</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="input-field"
                            placeholder="e.g. Homework Completion"
                            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15 }}
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <button
                        onClick={() => setActiveTab('students')}
                        style={{
                            padding: '10px 20px', borderRadius: 8, border: 'none',
                            background: activeTab === 'students' ? '#0f172a' : '#f1f5f9',
                            color: activeTab === 'students' ? 'white' : '#64748b',
                            fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center'
                        }}
                    >
                        <User size={16} /> Students
                    </button>
                    <button
                        onClick={() => setActiveTab('teams')}
                        style={{
                            padding: '10px 20px', borderRadius: 8, border: 'none',
                            background: activeTab === 'teams' ? '#0f172a' : '#f1f5f9',
                            color: activeTab === 'teams' ? 'white' : '#64748b',
                            fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center'
                        }}
                    >
                        <Users size={16} /> Teams
                    </button>
                </div>

                {/* Students View */}
                {activeTab === 'students' && (
                    <div className="card" style={{ background: 'white', borderRadius: 16, overflowX: 'auto', border: '1px solid #e2e8f0' }}>
                        <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: 16, textAlign: 'left', color: '#64748b' }}>Student</th>
                                    <th style={{ padding: 16, textAlign: 'left', color: '#64748b' }}>Team</th>
                                    <th style={{ padding: 16, textAlign: 'right', color: '#64748b' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students?.map(student => (
                                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: 16 }}>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{student.firstName} {student.lastName}</span>
                                        </td>
                                        <td style={{ padding: 16 }}>
                                            {student.team ? (
                                                <span style={{ background: '#eff6ff', color: '#3b82f6', padding: '4px 10px', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
                                                    {student.team.name}
                                                </span>
                                            ) : <span style={{ color: '#94a3b8' }}>-</span>}
                                        </td>
                                        <td style={{ padding: 16, textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => giveStar(student.id, student.firstName, points)}
                                                    disabled={loading[student.id]}
                                                    style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                                                >
                                                    {loading[student.id] ? '...' : `+${points} ⭐`}
                                                </button>
                                                <button
                                                    onClick={() => giveStar(student.id, student.firstName, -points)}
                                                    disabled={loading[student.id]}
                                                    style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                                                >
                                                    -{points}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Teams View */}
                {activeTab === 'teams' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                        {teams.map(team => (
                            <div key={team.id} className="card" style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    <Users size={28} color="#0f172a" />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{team.name}</h3>
                                    <button
                                        onClick={() => setManagingTeam(team)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
                                        title="Manage Team"
                                    >
                                        <Settings size={16} />
                                    </button>
                                </div>

                                <p style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: 14 }}>
                                    {team.members.length === 0 ? 'No Members' :
                                        team.members.map(m => m.firstName).join(', ')
                                    }
                                </p>

                                <div style={{ display: 'flex', gap: 10, marginTop: 'auto', width: '100%' }}>
                                    <button
                                        onClick={() => giveStar(team.id, team.name, points, true)}
                                        disabled={loading[team.id]}
                                        style={{ flex: 1, background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, padding: '10px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
                                    >
                                        +{points} Team Stars
                                    </button>
                                    <button
                                        onClick={() => giveStar(team.id, team.name, -points, true)}
                                        disabled={loading[team.id]}
                                        style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, padding: '10px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
                                    >
                                        -{points}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Manage Team Modal */}
                {managingTeam && (
                    <ManageTeamModal
                        team={managingTeam}
                        allStudents={students || []}
                        onClose={() => setManagingTeam(null)}
                        onUpdate={mutate}
                    />
                )}
            </AdminLayout>
        </ProtectedRoute>
    )
}

function ManageTeamModal({ team, allStudents, onClose, onUpdate }) {
    const [name, setName] = useState(team.name)
    const [selectedStudent, setSelectedStudent] = useState('')
    const [saving, setSaving] = useState(false)

    // Students not in this team (for adding)
    const availableStudents = allStudents.filter(s => s.teamId !== team.id)
    // Students currently in this team
    const members = allStudents.filter(s => s.teamId === team.id)

    const handleRename = async () => {
        setSaving(true)
        try {
            await apiCall(`/teams/${team.id}`, { method: 'PUT', body: JSON.stringify({ name }) })
            onUpdate()
            alert('Team renamed!')
        } catch (e) { alert(e.message) }
        setSaving(false)
    }

    const addMember = async () => {
        if (!selectedStudent) return
        setSaving(true)
        try {
            await apiCall(`/teams/${team.id}/add-member`, { method: 'POST', body: JSON.stringify({ studentId: selectedStudent }) })
            onUpdate()
            setSelectedStudent('')
        } catch (e) { alert(e.message) }
        setSaving(false)
    }

    const removeMember = async (studentId) => {
        if (!confirm('Remove member?')) return
        try {
            await apiCall(`/teams/${team.id}/remove-member`, { method: 'POST', body: JSON.stringify({ studentId }) })
            onUpdate()
        } catch (e) { alert(e.message) }
    }

    const setCaptain = async (studentId) => {
        try {
            await apiCall(`/teams/${team.id}/set-captain`, { method: 'POST', body: JSON.stringify({ studentId }) })
            mutate() // Force global reload to update team object in parent
            onUpdate()
        } catch (e) { alert(e.message) }
    }

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: 30, borderRadius: 16, width: 500, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ margin: 0 }}>Manage Team</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                </div>

                {/* Rename */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Team Name</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
                        />
                        <button onClick={handleRename} disabled={saving} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                            Rename
                        </button>
                    </div>
                </div>

                {/* Members */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 10, fontWeight: 600 }}>Current Members</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {members.length === 0 && <span style={{ color: '#999' }}>No members</span>}
                        {members.map(m => (
                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 500 }}>{m.firstName} {m.lastName}</span>
                                    {team.captainId === m.id && <Crown size={14} color="#ca8a04" fill="#ca8a04" />}
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {team.captainId !== m.id && (
                                        <button onClick={() => setCaptain(m.id)} title="Make Captain" style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <Crown size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => removeMember(m.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add Member */}
                <div>
                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Add Member / Switch Team</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <select
                            value={selectedStudent}
                            onChange={e => setSelectedStudent(e.target.value)}
                            style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
                        >
                            <option value="">Select Student...</option>
                            {availableStudents.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.firstName} {s.lastName} {s.team ? `(from ${s.team.name})` : ''}
                                </option>
                            ))}
                        </select>
                        <button onClick={addMember} disabled={!selectedStudent || saving} style={{ padding: '8px 16px', background: '#22c55e', color: 'white', borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Plus size={16} /> Add
                        </button>
                    </div>
                    <p style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                        Adding a student will remove them from their current team if they have one.
                    </p>
                </div>

            </div>
        </div>
    )
}
