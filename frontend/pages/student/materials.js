import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import StudentLayout from '../../components/StudentLayout'
import { apiCall } from '../../lib/api'
import Link from 'next/link'
import { useAuth } from '../../hooks/useAuth'

export default function StudyMaterials() {
    const [materials, setMaterials] = useState([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()
    // Group by subject helpers
    const grouped = materials.reduce((acc, m) => {
        const subName = m.subject?.name || 'General'
        if (!acc[subName]) acc[subName] = []
        acc[subName].push(m)
        return acc
    }, {})

    useEffect(() => {
        if (!user) return
        async function load() {
            try {
                // Fetch materials only for this student's class
                const classLevel = user.student?.classLevel || 1
                const data = await apiCall(`/materials?classLevel=${classLevel}`)
                setMaterials(data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [user])

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <StudentLayout>
                <div style={{ marginBottom: 30 }}>
                    <h1 style={{ margin: 0, fontSize: 24 }}>📚 Study Materials</h1>
                    <p style={{ color: '#666', margin: '5px 0 0 0' }}>Resources for Class {user?.student?.classLevel}</p>
                </div>

                {loading ? <p>Loading...</p> : Object.keys(grouped).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, borderRadius: 12, border: '1px dashed #E4E4E7', background: '#F9FAFB' }}>
                        <p style={{ fontSize: 18, color: 'var(--text-muted)' }}>No study materials uploaded for your class yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                        {Object.keys(grouped).map(subjectName => (
                            <div key={subjectName}>
                                <h3 style={{ borderBottom: '1px solid #E4E4E7', paddingBottom: 10, color: 'var(--text-main)', fontSize: 18 }}>{subjectName}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                                    {grouped[subjectName].map(m => (
                                        <div key={m.id} className="card" style={{
                                            padding: 20,
                                            transition: 'transform 0.2s',
                                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                                        }}>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: m.type === 'video' ? '#EFF6FF' : '#F4F4F5', color: m.type === 'video' ? '#1D4ED8' : 'var(--text-muted)', border: '1px solid', borderColor: m.type === 'video' ? '#DBEAFE' : '#E4E4E7', textTransform: 'uppercase' }}>
                                                        {m.type === 'video' ? 'VIDEO 🎥' : 'DOC 📄'}
                                                    </span>
                                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(m.uploadedAt).toLocaleDateString()}</span>
                                                </div>
                                                <h4 style={{ margin: '0 0 10px 0', fontSize: 16, color: 'var(--text-main)' }}>{m.title}</h4>
                                            </div>
                                            <a href={m.url} target="_blank" rel="noreferrer" style={{
                                                display: 'block', textAlign: 'center', padding: '10px',
                                                background: 'var(--primary)', color: 'white', borderRadius: 8,
                                                textDecoration: 'none', fontWeight: 600, fontSize: 13,
                                                marginTop: 15,
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                            }}>
                                                Open Resource ↗
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </StudentLayout>
        </ProtectedRoute>
    )
}
