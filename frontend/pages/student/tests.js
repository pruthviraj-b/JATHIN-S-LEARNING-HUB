import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import StudentLayout from '../../components/StudentLayout'
import { apiCall } from '../../lib/api'
import Link from 'next/link'

export default function StudentTests() {
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const data = await apiCall('/tests')
                setTests(data)
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
                <h1 style={{ marginTop: 0, fontSize: 24 }}>📝 Exams & Results</h1>
                <p style={{ color: '#666', marginBottom: 30 }}>View exam schedules and your performance.</p>

                {loading ? <p>Loading...</p> : tests.length === 0 ? <p>No tests scheduled.</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                        {tests.map(t => {
                            const result = t.results?.[0]
                            const marks = result ? result.marks : null
                            const hasResult = marks !== null

                            const isOffline = !t._count?.questions || t._count.questions === 0
                            const isOnline = !isOffline
                            const canTake = isOnline && !hasResult && new Date() >= new Date(t.scheduledAt)

                            return (
                                <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'flex-start' }}>
                                        <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>{t.title}</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                            {isOnline && <span style={{ fontSize: 10, background: '#18181B', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 600, border: '1px solid #27272A' }}>ONLINE</span>}
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                {new Date(t.scheduledAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Subject</div>
                                        <div style={{ fontWeight: 600 }}>{t.subject?.name}</div>
                                    </div>

                                    <div style={{ marginTop: 'auto', borderTop: '1px solid #27272A', paddingTop: 16 }}>
                                        <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>Your Score</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            {hasResult ? (
                                                <div>
                                                    <div style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
                                                        {marks} <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {t.maxMarks}</span>
                                                    </div>
                                                    {isOnline && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(result.createdAt).toLocaleDateString()}</div>}
                                                </div>
                                            ) : (
                                                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14 }}>
                                                    {isOnline ? 'Not attempted' : 'Pending...'}
                                                </div>
                                            )}

                                            {canTake && (
                                                <Link href={`/student/quiz/${t.id}`}>
                                                    <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 14 }}>
                                                        Take Quiz →
                                                    </button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </StudentLayout>
        </ProtectedRoute>
    )
}
