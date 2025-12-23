import { useState } from 'react'
import useSWR from 'swr'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import Link from 'next/link'
import AdminLayout from '../../components/AdminLayout'

const fetcher = (url) => apiCall(url)

export default function ManageTests() {
    const { data: tests, error: testsError, mutate: mutateTests } = useSWR('/tests', fetcher)
    const { data: subjects, error: subjectsError } = useSWR('/subjects/admin/all', fetcher)

    const loading = !tests || !subjects
    const error = testsError?.message || subjectsError?.message

    const [formError, setFormError] = useState('')
    const [showForm, setShowForm] = useState(false)

    const [formData, setFormData] = useState({
        subjectId: '',
        title: '',
        date: '',
        maxMarks: 100,
        type: 'OFFLINE',
        questions: []
    })

    // Question Form State
    const [qForm, setQForm] = useState({ text: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] })

    const addOption = () => setQForm({ ...qForm, options: [...qForm.options, { text: '', isCorrect: false }] })

    const updateOption = (idx, field, val) => {
        const newOpts = [...qForm.options]
        newOpts[idx][field] = val
        if (field === 'isCorrect' && val === true) {
            // Uncheck others if single choice
            newOpts.forEach((o, i) => i !== idx ? o.isCorrect = false : null)
        }
        setQForm({ ...qForm, options: newOpts })
    }

    const saveQuestion = () => {
        if (!qForm.text) return
        setFormData({ ...formData, questions: [...formData.questions, qForm] })
        setQForm({ text: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] })
    }

    // AI Generation Logic
    const [generating, setGenerating] = useState(false)
    const generateAIQuiz = async () => {
        if (!formData.subjectId) return alert("Select a subject first!")

        const subj = subjects?.find(s => s.id === formData.subjectId)
        const subjectName = subj ? subj.name : 'General Knowledge'

        setGenerating(true)
        try {
            await new Promise(r => setTimeout(r, 1500))

            const mockQuestions = [
                {
                    text: `What is the primary focus of ${subjectName}?`,
                    options: [
                        { text: 'Theoretical Analysis', isCorrect: false },
                        { text: 'Practical Application', isCorrect: true },
                        { text: 'Historical Review', isCorrect: false },
                        { text: 'None of the above', isCorrect: false }
                    ]
                },
                {
                    text: `Which of the following is a key concept in ${subjectName}?`,
                    options: [
                        { text: 'Concept A', isCorrect: true },
                        { text: 'Concept B', isCorrect: false },
                        { text: 'Concept C', isCorrect: false },
                        { text: 'Concept D', isCorrect: false }
                    ]
                },
                {
                    text: `Advanced topic in ${subjectName} involves:`,
                    options: [
                        { text: 'Simple addition', isCorrect: false },
                        { text: 'Complex Algorithms', isCorrect: true },
                        { text: 'Basic Reading', isCorrect: false },
                        { text: 'Painting', isCorrect: false }
                    ]
                }
            ]

            setFormData(prev => ({
                ...prev,
                questions: [...prev.questions, ...mockQuestions]
            }))

        } catch (e) {
            alert("AI Generation failed. Try again.")
        } finally {
            setGenerating(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setFormError('')

        // Validation
        const selectedDate = new Date(formData.date)
        if (selectedDate.getFullYear() < 2000) {
            setFormError("Please select a valid date (year must be 2000+)")
            return
        }

        try {
            await apiCall('/tests', {
                method: 'POST',
                body: JSON.stringify({
                    subjectId: formData.subjectId,
                    title: formData.title,
                    scheduledAt: selectedDate,
                    maxMarks: formData.type === 'ONLINE' ? formData.questions.length : formData.maxMarks,
                    type: formData.type,
                    questions: formData.questions
                })
            })
            setShowForm(false)
            setFormData({ subjectId: '', title: '', date: '', maxMarks: 100, type: 'OFFLINE', questions: [] })
            mutateTests() // Refresh data
        } catch (err) {
            setFormError(err.message)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this test? Results will be lost.')) return
        try {
            await apiCall(`/tests/${id}`, { method: 'DELETE' })
            mutateTests() // Refresh data
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24 }}>Exam Management</h1>
                        <p style={{ color: '#666', margin: '5px 0 0 0' }}>Schedule tests and record marks.</p>
                    </div>
                </div>

                {/* Global Fetch Error */}
                {error && <div style={{ background: '#fee', color: '#c00', padding: 15, borderRadius: 4, marginBottom: 20 }}>⚠️ Error: {error}</div>}

                {/* Form Submission Error */}
                {formError && <div style={{ background: '#fee', color: '#c00', padding: 15, borderRadius: 4, marginBottom: 20 }}>⚠️ {formError}</div>}

                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{ marginBottom: 20, padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, boxShadow: 'var(--shadow-sm)' }}
                >
                    {showForm ? 'Cancel' : '+ Schedule New Test'}
                </button>

                {showForm && (
                    <div className="card" style={{ padding: 20, marginBottom: 30 }}>
                        <h2 style={{ marginTop: 0 }}>New Test</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div>
                                    <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 5, display: 'block' }}>Subject</label>
                                    <select value={formData.subjectId} onChange={e => setFormData({ ...formData, subjectId: e.target.value })} required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                                        <option value="">-- Select --</option>
                                        {subjects?.map(s => <option key={s.id} value={s.id}>{s.name} (Class {s.classLevel})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 5, display: 'block' }}>Test Title</label>
                                    <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Mid-term Exam" required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                                </div>
                                <div>
                                    <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 5, display: 'block' }}>Date</label>
                                    <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                                </div>
                                <div>
                                    <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 5, display: 'block' }}>Test Type</label>
                                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                                        <option value="OFFLINE">Offline (Manual Marks)</option>
                                        <option value="ONLINE">Online Quiz (Auto-grade)</option>
                                    </select>
                                </div>
                                {formData.type === 'OFFLINE' && (
                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 5, display: 'block' }}>Max Marks</label>
                                        <input type="number" value={formData.maxMarks} onChange={e => setFormData({ ...formData, maxMarks: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                                    </div>
                                )}
                            </div>

                            {formData.type === 'ONLINE' && (
                                <div style={{ background: '#F8FAFC', padding: 15, marginTop: 20, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                        <h4 style={{ margin: 0 }}>Quiz Questions ({formData.questions.length})</h4>
                                        <button
                                            type="button"
                                            onClick={generateAIQuiz}
                                            disabled={generating || !formData.subjectId}
                                            style={{
                                                background: 'var(--secondary)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: 6,
                                                cursor: !formData.subjectId ? 'not-allowed' : 'pointer', opacity: !formData.subjectId ? 0.6 : 1,
                                                display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
                                                color: 'black'
                                            }}
                                        >
                                            {generating ? '✨ Generating...' : '✨ Auto-Generate with AI'}
                                        </button>
                                    </div>

                                    {/* List added questions */}
                                    <div style={{ marginBottom: 15 }}>
                                        {formData.questions.map((q, i) => (
                                            <div key={q.text + i} style={{ padding: 10, background: 'white', border: '1px solid #E2E8F0', borderRadius: 6, marginBottom: 8 }}>
                                                <strong>{i + 1}. {q.text}</strong>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>
                                                    {q.options.map((opt, oi) => (
                                                        <span key={oi} style={{ marginRight: 10, color: opt.isCorrect ? '#166534' : 'inherit', fontWeight: opt.isCorrect ? 'bold' : 'normal' }}>
                                                            {opt.isCorrect ? 'Example: (Correct)' : ''} {opt.text}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ border: '1px dashed #CBD5E1', padding: 15, borderRadius: 8, background: 'white' }}>
                                        <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 'bold' }}>Question Text</label>
                                        <input type="text" value={qForm.text} onChange={e => setQForm({ ...qForm, text: e.target.value })} placeholder="e.g. What is 2+2?" style={{ width: '100%', padding: 8, marginBottom: 10, border: '1px solid #E2E8F0', borderRadius: 4 }} />

                                        <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 'bold' }}>Options</label>
                                        {qForm.options.map((opt, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 5 }}>
                                                <input type="radio" name="correctOpt" checked={opt.isCorrect} onChange={(e) => updateOption(i, 'isCorrect', true)} />
                                                <input type="text" value={opt.text} onChange={(e) => updateOption(i, 'text', e.target.value)} placeholder={`Option ${i + 1}`} style={{ flex: 1, padding: 5, border: '1px solid #E2E8F0', borderRadius: 4 }} />
                                            </div>
                                        ))}
                                        <button type="button" onClick={addOption} style={{ fontSize: 12, background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>+ Add Option</button>

                                        <div style={{ marginTop: 10 }}>
                                            <button type="button" onClick={saveQuestion} disabled={!qForm.text} style={{ background: '#F1F5F9', color: 'var(--text-main)', border: '1px solid #E2E8F0', padding: '8px 15px', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>Add Question to Test</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button type="submit" style={{ marginTop: 25, padding: '12px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, boxShadow: 'var(--shadow-md)' }}>
                                {formData.type === 'ONLINE' ? 'Create Online Quiz' : 'Schedule Offline Test'}
                            </button>
                        </form>
                    </div>
                )}

                {loading ? <div>Loading...</div> : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <tr>
                                    <th style={{ padding: 16, textAlign: 'left', fontSize: 13, color: 'var(--text-account)' }}>Date</th>
                                    <th style={{ padding: 16, textAlign: 'left', fontSize: 13, color: 'var(--text-account)' }}>Subject</th>
                                    <th style={{ padding: 16, textAlign: 'left', fontSize: 13, color: 'var(--text-account)' }}>Title</th>
                                    <th style={{ padding: 16, textAlign: 'left', fontSize: 13, color: 'var(--text-account)' }}>Max Marks</th>
                                    <th style={{ padding: 16, textAlign: 'left', fontSize: 13, color: 'var(--text-account)' }}>Results</th>
                                    <th style={{ padding: 16, textAlign: 'right', fontSize: 13, color: 'var(--text-account)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tests?.map(t => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: 16 }}>{new Date(t.scheduledAt).toLocaleDateString()}</td>
                                        <td style={{ padding: 16 }}>{t.subject?.name}</td>
                                        <td style={{ padding: 16, fontWeight: 500 }}>{t.title}</td>
                                        <td style={{ padding: 16 }}>{t.maxMarks}</td>
                                        <td style={{ padding: 16 }}>
                                            <Link href={`/admin/results?testId=${t.id}`}>
                                                <button style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', background: 'white', border: '1px solid #E2E8F0', borderRadius: 4 }}>
                                                    Enter Marks ({t._count?.results || 0})
                                                </button>
                                            </Link>
                                        </td>
                                        <td style={{ padding: 16, textAlign: 'right' }}>
                                            <button onClick={() => handleDelete(t.id)} style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                                                <div style={{ fontSize: 18 }}>🗑️</div>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {tests?.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No tests scheduled via this system yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminLayout>
        </ProtectedRoute>
    )
}
