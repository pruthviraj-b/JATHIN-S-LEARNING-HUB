import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import Link from 'next/link'

export default function EnterResults() {
    const router = useRouter()
    const { testId } = router.query
    const [testData, setTestData] = useState(null)
    const [students, setStudents] = useState([])
    const [resultData, setResultData] = useState({}) // studentId -> { marks, createdAt }
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (testId) fetchData()
    }, [testId])

    const fetchData = async () => {
        try {
            setLoading(true)
            const data = await apiCall(`/tests/${testId}`)
            setTestData(data)

            const enrolledStudents = data.subject?.students || []

            const initialResults = {}
            enrolledStudents.forEach(s => {
                // Initialize structure
                initialResults[s.id] = null
            })

            // Load existing results
            if (data.results && data.results.length > 0) {
                data.results.forEach(r => {
                    initialResults[r.studentId] = { marks: r.marks, createdAt: r.createdAt }
                })
            }

            // Merge enrolled students with those who have results (in case they aren't explicitly enrolled)
            const resultStudents = data.results?.map(r => r.student) || []
            const allStudents = [...enrolledStudents]

            resultStudents.forEach(rs => {
                if (!allStudents.find(s => s.id === rs.id)) {
                    allStudents.push(rs)
                }
            })

            setStudents(allStudents)
            setResultData(initialResults)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkChange = (studentId, val) => {
        setResultData(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], marks: val }
        }))
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const results = Object.keys(resultData)
                .filter(sid => resultData[sid] !== null && resultData[sid].marks !== '' && resultData[sid].marks !== undefined)
                .map(studentId => ({
                    studentId,
                    marks: Number(resultData[studentId].marks)
                }))

            await apiCall(`/tests/${testId}/results`, {
                method: 'POST',
                body: JSON.stringify({ results })
            })
            alert('✅ Results saved successfully!')
            router.push('/admin/tests')
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (!testId) return null

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <main style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--spacing-lg) var(--spacing-md)' }}>
                <Link href="/admin/tests">
                    <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>← Back to Tests</span>
                </Link>
                <h1 style={{ marginTop: 10 }}>Enter Test Results</h1>

                {loading ? <p>Loading...</p> : (
                    <>
                        <div className="card" style={{ marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 20 }}>{testData?.title}</h3>
                            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Subject</div>
                                    <div style={{ fontWeight: 600 }}>{testData?.subject?.name}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Max Marks</div>
                                    <div style={{ fontWeight: 600 }}>{testData?.maxMarks}</div>
                                </div>
                            </div>
                        </div>

                        {error && <div style={{ color: 'var(--danger)', marginBottom: 20, padding: 10, background: '#fee2e2', borderRadius: 6 }}>{error}</div>}

                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Student Name</th>
                                            <th>{testData.questions && testData.questions.length > 0 ? 'Score (Auto)' : 'Marks Obtained'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(s => {
                                            return (
                                                <tr key={s.id}>
                                                    <td style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</td>
                                                    <td>
                                                        {testData.questions && testData.questions.length > 0 ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <span style={{ fontWeight: 'bold', fontSize: 16 }}>{resultData[s.id] ? resultData[s.id].marks : '-'}</span>
                                                                <span style={{ color: 'var(--text-muted)' }}>/ {testData.maxMarks}</span>
                                                                {resultData[s.id] && <span style={{ fontSize: 10, background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: 4 }}>AUTO</span>}
                                                                {resultData[s.id] && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 5 }}> {new Date(resultData[s.id].createdAt).toLocaleDateString()}</div>}
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                <input
                                                                    type="number"
                                                                    className="input-field"
                                                                    value={resultData[s.id] ? resultData[s.id].marks : ''}
                                                                    onChange={(e) => handleMarkChange(s.id, e.target.value)}
                                                                    max={testData.maxMarks}
                                                                    min="0"
                                                                    style={{ width: 80, margin: 0 }}
                                                                />
                                                                <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>/ {testData.maxMarks}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div style={{ marginTop: 24, textAlign: 'right' }}>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn btn-primary"
                                style={{
                                    padding: '12px 30px',
                                    fontSize: 16,
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                {saving ? 'Saving...' : '💾 Save Results'}
                            </button>
                        </div>
                    </>
                )}
            </main>
        </ProtectedRoute >
    )
}
