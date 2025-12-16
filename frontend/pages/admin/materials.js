import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import Link from 'next/link'
import AdminLayout from '../../components/AdminLayout'

export default function ManageMaterials() {
    const [materials, setMaterials] = useState([])
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)

    const [formData, setFormData] = useState({
        subjectId: '',
        title: '',
        type: 'link', // or 'video', 'pdf'
        url: ''
    })
    const [submitting, setSubmitting] = useState(false)

    const [filterClass, setFilterClass] = useState('ALL') // Added

    useEffect(() => {
        fetchData()
    }, [filterClass]) // Refetch when filter changes

    const fetchData = async () => {
        try {
            setLoading(true)
            const query = filterClass !== 'ALL' ? `?classLevel=${filterClass}` : ''
            const [mData, sData] = await Promise.all([
                apiCall(`/materials${query}`),
                apiCall('/subjects/admin/all')
            ])
            setMaterials(mData)
            setSubjects(sData)
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
            await apiCall('/materials', {
                method: 'POST',
                body: JSON.stringify(formData)
            })
            alert('✅ Material Added')
            setShowForm(false)
            setFormData({ subjectId: '', title: '', type: 'link', url: '' })
            await fetchData()
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this material?')) return
        try {
            await apiCall(`/materials/${id}`, { method: 'DELETE' })
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
                        <h1 style={{ margin: 0, fontSize: 24 }}>Study Resources</h1>
                        <p style={{ color: '#666', margin: '5px 0 0 0' }}>Share learning materials with students.</p>
                    </div>
                </div>

                {error && <div style={{ color: 'red', marginBottom: 20 }}>{error}</div>}

                <div style={{ display: 'flex', gap: 15, alignItems: 'center', marginBottom: 20 }}>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        style={{ padding: '10px 20px', background: '#3699ff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
                    >
                        {showForm ? 'Cancel' : '+ Add Material'}
                    </button>

                    <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', minWidth: 150 }}
                    >
                        <option value="ALL">All Classes</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(c => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                </div>

                {showForm && (
                    <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, marginBottom: 30 }}>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, maxWidth: 800 }}>
                                <div>
                                    <label>Subject</label>
                                    <select value={formData.subjectId} onChange={e => setFormData({ ...formData, subjectId: e.target.value })} required style={{ width: '100%', padding: 8 }}>
                                        <option value="">-- Select Subject --</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name} (Class {s.classLevel})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>Title</label>
                                    <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Chapter 1 Notes" required style={{ width: '100%', padding: 8 }} />
                                </div>
                                <div>
                                    <label>Type</label>
                                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: 8 }}>
                                        <option value="link">Link / Article</option>
                                        <option value="video">Video (YouTube etc)</option>
                                        <option value="pdf">PDF</option>
                                    </select>
                                </div>
                                <div>
                                    <label>URL</label>
                                    <input type="url" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." required style={{ width: '100%', padding: 8 }} />
                                </div>
                            </div>
                            <button type="submit" disabled={submitting} style={{ marginTop: 15, padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4 }}>
                                {submitting ? 'Adding...' : 'Add Material'}
                            </button>
                        </form>
                    </div>
                )}

                {loading ? <p>Loading...</p> : (
                    <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 8 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f5f5f5' }}>
                                <tr>
                                    <th style={{ padding: 12, textAlign: 'left' }}>Title</th>
                                    <th style={{ padding: 12, textAlign: 'left' }}>Subject</th>
                                    <th style={{ padding: 12, textAlign: 'left' }}>Type</th>
                                    <th style={{ padding: 12, textAlign: 'left' }}>Link</th>
                                    <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materials.map(m => (
                                    <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: 12 }}>{m.title}</td>
                                        <td style={{ padding: 12 }}>{m.subject?.name} <span style={{ color: '#999', fontSize: 12 }}>Class {m.subject?.classLevel}</span></td>
                                        <td style={{ padding: 12 }}>{m.type}</td>
                                        <td style={{ padding: 12 }}><a href={m.url} target="_blank" rel="noreferrer">Open</a></td>
                                        <td style={{ padding: 12, textAlign: 'right' }}>
                                            <button onClick={() => handleDelete(m.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
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
