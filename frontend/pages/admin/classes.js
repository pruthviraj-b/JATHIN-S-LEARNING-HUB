import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import Link from 'next/link'
import AdminLayout from '../../components/AdminLayout'

export default function ManageClasses() {
    const [classes, setClasses] = useState([])
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)

    const [formData, setFormData] = useState({
        subjectId: '',
        title: '',
        date: '',
        time: '',
        meetingLink: ''
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [clsData, subData] = await Promise.all([
                apiCall('/classes'),
                apiCall('/subjects/admin/all')
            ])
            setClasses(clsData)
            setSubjects(subData)
            setError('')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            // Combine date and time
            const scheduledAt = new Date(`${formData.date}T${formData.time}`)

            await apiCall('/classes', {
                method: 'POST',
                body: JSON.stringify({
                    subjectId: formData.subjectId,
                    title: formData.title,
                    scheduledAt: scheduledAt.toISOString(),
                    meetingLink: formData.meetingLink
                })
            })
            console.log('✅ Class scheduled')
            setFormData({ subjectId: '', title: '', date: '', time: '', meetingLink: '' })
            setShowForm(false)
            await fetchData()
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Cancel this class? Attendance data will be lost.')) return
        try {
            await apiCall(`/classes/${id}`, { method: 'DELETE' })
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
                        <h1 style={{ margin: 0, fontSize: 24 }}>Class Schedule</h1>
                        <p style={{ color: '#666', margin: '5px 0 0 0' }}>Plan upcoming online sessions.</p>
                    </div>
                </div>

                {error && <div style={{ background: '#fee', color: '#c00', padding: 15, borderRadius: 4, marginBottom: 20 }}>⚠️ {error}</div>}

                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{ marginBottom: 20, padding: '10px 20px', background: '#3699ff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
                >
                    {showForm ? 'Cancel Scheduling' : '+ Schedule New Class'}
                </button>

                {showForm && (
                    <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, marginBottom: 30 }}>
                        <h2>Schedule Class</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, maxWidth: 800 }}>
                                <div>
                                    <label><strong>Subject</strong></label>
                                    <select
                                        value={formData.subjectId}
                                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: 8 }}
                                    >
                                        <option value="">-- Select Subject --</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} (Class {s.classLevel})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label><strong>Topic / Title</strong></label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Algebra Basics"
                                        required
                                        style={{ width: '100%', padding: 8 }}
                                    />
                                </div>
                                <div>
                                    <label><strong>Date</strong></label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: 8 }}
                                    />
                                </div>
                                <div>
                                    <label><strong>Time</strong></label>
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: 8 }}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label><strong>Meeting Link (Optional)</strong></label>
                                    <input
                                        type="url"
                                        value={formData.meetingLink}
                                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                        placeholder="https://zoom.us/..."
                                        style={{ width: '100%', padding: 8 }}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{ marginTop: 15, padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: submitting ? 'not-allowed' : 'pointer' }}
                            >
                                {submitting ? 'Scheduling...' : 'Schedule Class'}
                            </button>
                        </form>
                    </div>
                )}

                {loading ? <div>Loading schedule...</div> : (
                    <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f5f5f5' }}>
                                <tr>
                                    <th style={{ padding: 12, textAlign: 'left' }}>Date & Time</th>
                                    <th style={{ padding: 12, textAlign: 'left' }}>Subject</th>
                                    <th style={{ padding: 12, textAlign: 'left' }}>Topic</th>
                                    <th style={{ padding: 12, textAlign: 'left' }}>Link</th>
                                    <th style={{ padding: 12, textAlign: 'left' }}>Attendance</th>
                                    <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classes.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ padding: 20, textAlign: 'center', color: '#777' }}>No classes scheduled.</td>
                                    </tr>
                                )}
                                {classes.map(cls => (
                                    <tr key={cls.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: 12 }}>
                                            {new Date(cls.scheduledAt).toLocaleDateString()} <br />
                                            <small style={{ color: '#666' }}>{new Date(cls.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                        </td>
                                        <td style={{ padding: 12 }}>{cls.subject?.name}</td>
                                        <td style={{ padding: 12 }}>{cls.title}</td>
                                        <td style={{ padding: 12 }}>
                                            {cls.meetingLink ? <a href={cls.meetingLink} target="_blank" rel="noreferrer">Join</a> : '—'}
                                        </td>
                                        <td style={{ padding: 12 }}>
                                            <Link href={`/admin/attendance?classId=${cls.id}`}>
                                                <button style={{ padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>
                                                    Mark ({cls._count?.attendances || 0})
                                                </button>
                                            </Link>
                                        </td>
                                        <td style={{ padding: 12, textAlign: 'right' }}>
                                            <button onClick={() => handleDelete(cls.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminLayout>
        </ProtectedRoute>
    )
}
