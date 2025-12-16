import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import StudentLayout from '../../components/StudentLayout'
import { apiCall } from '../../lib/api'
import Link from 'next/link'

export default function StudyMaterials() {
    const [materials, setMaterials] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const data = await apiCall('/materials') // Public/Student route
                setMaterials(data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <StudentLayout>
                <h1 style={{ marginTop: 0, fontSize: 24 }}>📚 Study Materials</h1>
                <p style={{ color: '#666', marginBottom: 30 }}>Access resources for your classes.</p>

                {loading ? <p>Loading...</p> : materials.length === 0 ? <p>No materials uploaded yet.</p> : (
                    <div style={{ display: 'grid', gap: 15 }}>
                        {materials.map(m => (
                            <div key={m.id} style={{ padding: 15, background: 'white', border: '1px solid #ddd', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0' }}>{m.title}</h3>
                                    <div style={{ fontSize: 12, color: '#666' }}>{m.subject?.name} • {new Date(m.uploadedAt).toLocaleDateString()}</div>
                                </div>
                                <a href={m.url} target="_blank" rel="noreferrer" style={{ padding: '8px 15px', background: '#007bff', color: 'white', borderRadius: 4, textDecoration: 'none' }}>
                                    {m.type === 'video' ? '📺 Watch' : '📄 View'}
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </StudentLayout>
        </ProtectedRoute>
    )
}
