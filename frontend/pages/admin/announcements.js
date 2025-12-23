import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import Link from 'next/link'
import AdminLayout from '../../components/AdminLayout'

export default function ManageAnnouncements() {
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)

    const [formData, setFormData] = useState({
        title: '',
        body: '',
        visibleTo: 'STUDENT'
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const data = await apiCall('/announcements')
            setAnnouncements(data)
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
            await apiCall('/announcements', {
                method: 'POST',
                body: JSON.stringify(formData)
            })
            alert('Announcement posted! All students will be notified.')
            setShowForm(false)
            setFormData({ title: '', body: '', visibleTo: 'STUDENT' })
            await fetchData()
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this announcement?')) return
        try {
            await apiCall(`/announcements/${id}`, { method: 'DELETE' })
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
                        <h1 style={{ margin: 0, fontSize: 24 }}>Announcements</h1>
                        <p style={{ color: '#666', margin: '5px 0 0 0' }}>Broadcast messages to everyone.</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{ marginBottom: 20, padding: '10px 20px', background: '#3699ff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
                >
                    {showForm ? 'Cancel' : '+ Post New Announcement'}
                </button>

                {showForm && (
                    <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, marginBottom: 30 }}>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5 }}>Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: 8 }}
                                />
                            </div>
                            <div style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5 }}>Message</label>
                                <textarea
                                    value={formData.body}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    required
                                    rows={4}
                                    style={{ width: '100%', padding: 8 }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4 }}
                            >
                                {submitting ? 'Posting...' : 'Post Announcement'}
                            </button>
                            <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
                                ℹ️ All students will receive a website notification
                            </div>
                        </form>
                    </div>
                )}

                {loading ? <div>Loading...</div> : (
                    <div style={{ display: 'grid', gap: 20 }}>
                        {announcements.map(ann => (
                            <div key={ann.id} style={{ background: 'white', border: '1px solid #ddd', padding: 20, borderRadius: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <h3 style={{ margin: '0 0 10px 0' }}>{ann.title}</h3>
                                    <button onClick={() => handleDelete(ann.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                                </div>
                                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{ann.body}</p>
                                <div style={{ marginTop: 15, fontSize: 12, color: '#999' }}>
                                    Posted on: {new Date(ann.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </AdminLayout>
        </ProtectedRoute>
    )
}
