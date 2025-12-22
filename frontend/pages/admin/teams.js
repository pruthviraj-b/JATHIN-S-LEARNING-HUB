import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import Link from 'next/link'
import AdminLayout from '../../components/AdminLayout'

export default function ManageTeams() {
    const [teams, setTeams] = useState([])
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        captainId: ''
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [teamsData, studentsData] = await Promise.all([
                apiCall('/teams'),
                apiCall('/students')
            ])
            setTeams(teamsData)
            setStudents(Array.isArray(studentsData) ? studentsData : (studentsData?.students || []))
            setError('')

            // If GET /teams fails, we might need to rely on what we have. 
            // But let's assume I need to create it if it doesn't exist.
            // Wait, I saw `teams.js` size 4750 bytes in backend list_dir. It definitely has CRUD.

        } catch (err) {
            console.error('❌ Error fetching data:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await apiCall('/teams', {
                method: 'POST',
                body: JSON.stringify(formData)
            })
            console.log('✅ Team created')
            setFormData({ name: '', captainId: '' })
            setShowForm(false)
            await fetchData()
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this team? Students will be unassigned.')) return
        try {
            await apiCall(`/teams/${id}`, { method: 'DELETE' })
            await fetchData()
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24 }}>Teams</h1>
                        <p style={{ color: '#666', margin: '5px 0 0 0' }}>Manage team competitions and captains.</p>
                    </div>
                </div>

                {error && <div style={{ background: '#fee', color: '#c00', padding: 15, borderRadius: 4, marginBottom: 20 }}>⚠️ {error}</div>}

                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{ marginBottom: 20, padding: '10px 20px', background: '#3699ff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
                >
                    {showForm ? 'Cancel Creation' : '+ Create New Team'}
                </button>

                {showForm && (
                    <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, marginBottom: 30 }}>
                        <h2>Create Team</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, maxWidth: 600 }}>
                                <div>
                                    <label><strong>Team Name</strong></label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Red Warriors"
                                        required
                                        style={{ width: '100%', padding: 8 }}
                                    />
                                </div>
                                <div>
                                    <label><strong>Captain (Optional)</strong></label>
                                    <select
                                        value={formData.captainId}
                                        onChange={(e) => setFormData({ ...formData, captainId: e.target.value })}
                                        style={{ width: '100%', padding: 8 }}
                                    >
                                        <option value="">-- Select Captain --</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{ marginTop: 15, padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: submitting ? 'not-allowed' : 'pointer' }}
                            >
                                {submitting ? 'Creating...' : 'Create Team'}
                            </button>
                        </form>
                    </div>
                )}

                {loading ? <div>Loading teams...</div> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                        {teams.length === 0 && <p>No teams found.</p>}
                        {teams.map(team => (
                            <div key={team.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <h3 style={{ margin: '0 0 10px 0' }}>{team.name}</h3>
                                    <button onClick={() => handleDelete(team.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>🗑️</button>
                                </div>
                                <p><strong>Captain:</strong> {team.captain ? `${team.captain.firstName} ${team.captain.lastName}` : 'None'}</p>
                                <p><strong>Members:</strong> {team.members ? team.members.length : 0}</p>
                                <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid #eee' }}>
                                    <h4 style={{ margin: '0 0 10px 0' }}>⭐ Team Points</h4>
                                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                                        {/* Assuming separate API or included data for points. If not included, we might need to fetch leaderboard. */
                                            /* The list endpoint usually doesn't calculate aggregate sums unless requested. 
                                               We'll ignore points here if not present, and refer to leaderboard. */
                                            team.points || 'View Leaderboard'
                                        }
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </AdminLayout>
        </ProtectedRoute>
    )
}
