import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { apiCall } from '../../../lib/api'

export default function QuizInterface() {
    const router = useRouter()
    const { id } = router.query
    const [test, setTest] = useState(null)
    const [loading, setLoading] = useState(true)
    const [answers, setAnswers] = useState({}) // { questionId: optionId }
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState(null)

    useEffect(() => {
        if (!id) return
        async function load() {
            try {
                const data = await apiCall(`/tests/${id}/play`)
                setTest(data)
            } catch (err) {
                alert('Error loading quiz')
                router.push('/student/tests')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    const handleSelect = (qId, optId) => {
        setAnswers({ ...answers, [qId]: optId })
    }

    const handleSubmit = async () => {
        if (!confirm('Submit Quiz?')) return
        setSubmitting(true)
        try {
            const res = await apiCall(`/tests/${id}/submit`, {
                method: 'POST',
                body: JSON.stringify({ answers })
            })
            setResult(res) // { score, maxMarks }
        } catch (err) {
            alert(err.message)
            setSubmitting(false)
        }
    }

    if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Loading Quiz...</div>

    if (result) {
        return (
            <ProtectedRoute requiredRole="STUDENT">
                <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: 40, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: 500, width: '100%' }}>
                        <div style={{ fontSize: 60, marginBottom: 20 }}>🎉</div>
                        <h1 style={{ margin: 0 }}>Quiz Completed!</h1>
                        <p style={{ color: '#666', fontSize: 18 }}>You scored</p>
                        <div style={{ fontSize: 48, fontWeight: 'bold', color: '#3699ff', margin: '20px 0' }}>
                            {result.score} <span style={{ fontSize: 24, color: '#ccc' }}>/ {result.maxMarks}</span>
                        </div>
                        <button onClick={() => router.push('/student/tests')} style={{ padding: '12px 30px', background: '#3699ff', color: 'white', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer' }}> Back to Dashboard</button>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <div style={{ minHeight: '100vh', background: '#f4f6f9', padding: '30px 0' }}>
                <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>

                    {/* Header */}
                    <div style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 22 }}>{test.title}</h1>
                            <p style={{ margin: '5px 0 0 0', color: '#666' }}>{test.questions.length} Questions • {test.maxMarks} Marks</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>Time Remaining</div>
                            <div style={{ fontSize: 20, fontWeight: '600' }}>--:--</div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div style={{ display: 'grid', gap: 20 }}>
                        {test.questions.map((q, index) => (
                            <div key={q.id} style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                                <div style={{ marginBottom: 15, fontSize: 16, fontWeight: 600 }}>
                                    <span style={{ color: '#3699ff', marginRight: 10 }}>Q{index + 1}.</span>
                                    {q.text}
                                </div>
                                <div style={{ display: 'grid', gap: 10 }}>
                                    {q.options.map(opt => {
                                        const isSelected = answers[q.id] === opt.id
                                        return (
                                            <div
                                                key={opt.id}
                                                onClick={() => handleSelect(q.id, opt.id)}
                                                style={{
                                                    padding: '12px 15px',
                                                    border: isSelected ? '2px solid #3699ff' : '1px solid #eee',
                                                    borderRadius: 8,
                                                    cursor: 'pointer',
                                                    background: isSelected ? '#f0f9ff' : 'white',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10
                                                }}
                                            >
                                                <div style={{
                                                    width: 20, height: 20, borderRadius: '50%',
                                                    border: isSelected ? '6px solid #3699ff' : '2px solid #ddd',
                                                    background: 'white'
                                                }}></div>
                                                {opt.text}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: 30, textAlign: 'center' }}>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || Object.keys(answers).length < test.questions.length}
                            style={{
                                padding: '15px 40px',
                                background: Object.keys(answers).length < test.questions.length ? '#ccc' : '#3699ff',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 18,
                                fontWeight: 'bold',
                                cursor: Object.keys(answers).length < test.questions.length ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 15px rgba(54, 153, 255, 0.3)'
                            }}
                        >
                            {submitting ? 'Submitting...' : 'Submit Quiz'}
                        </button>
                        {Object.keys(answers).length < test.questions.length && (
                            <p style={{ color: '#999', fontSize: 14, marginTop: 10 }}>Please answer all questions to submit.</p>
                        )}
                    </div>

                    <div style={{ height: 50 }}></div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
