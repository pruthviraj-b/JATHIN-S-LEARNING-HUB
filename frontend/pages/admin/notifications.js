import { useState, useEffect } from 'react'
import useSWR from 'swr'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import { Send, Users, User, Clock, MessageSquare, Search, BookOpen, AlertCircle, Info, Check } from 'lucide-react'

const fetcher = (url) => apiCall(url)

export default function Notifications() {
    // 1. Data Fetching
    const { data: students } = useSWR('/students', fetcher)
    const { data: classes } = useSWR('/classes', fetcher) // To filter by class (optional, or just hardcode class levels)
    const { data: teams } = useSWR('/teams', fetcher)
    const { data: history, mutate: mutateHistory } = useSWR('/notifications/history', fetcher)

    // 2. State
    const [filterType, setFilterType] = useState('all') // 'all', 'class', 'team', 'individual'
    const [filterValue, setFilterValue] = useState('') // Selected Class/Team ID
    const [selectedStudents, setSelectedStudents] = useState([]) // Array of IDs
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // 3. Templates (Feature 1)
    const templates = [
        { label: 'Exam Results', text: "Hello Parent, {name}'s exam results are out. Please check the portal.", icon: <BookOpen size={16} /> },
        { label: 'Fee Reminder', text: "Dear Parent, this is a reminder that tuition fees for this month are due for {name}.", icon: <AlertCircle size={16} /> },
        { label: 'Holiday', text: "Notice: Tuition will be closed tomorrow due to public holiday.", icon: <Clock size={16} /> },
        { label: 'General', text: "Hello, {name} has a new update regarding classes.", icon: <Info size={16} /> }
    ]

    // 4. Filtering Logic (Feature 2 & 4)
    useEffect(() => {
        if (!students) return

        let filtered = []
        if (filterType === 'all') {
            filtered = students
        } else if (filterType === 'class') {
            filtered = students.filter(s => s.classLevel.toString() === filterValue)
        } else if (filterType === 'team') {
            filtered = students.filter(s => s.teamId === filterValue)
        } else if (filterType === 'individual') {
            // Managed manually via search
            // If switching TO individual, keep existing selection or clear? Let's clear for safety if logic demands, but here we just wait for search.
            return // Don't auto-fill
        }

        // Auto-select filtered students (unless individual mode)
        if (filterType !== 'individual') {
            setSelectedStudents(filtered.map(s => s.id))
        }
    }, [filterType, filterValue, students])

    const handleSearchAdd = (studentId) => {
        if (!selectedStudents.includes(studentId)) {
            setSelectedStudents([...selectedStudents, studentId])
        }
        setSearchTerm('')
    }

    const removeStudent = (id) => {
        setSelectedStudents(selectedStudents.filter(sid => sid !== id))
    }

    // 5. Sending Logic
    const sendNotification = async () => {
        if (selectedStudents.length === 0) return alert('No students selected')
        if (!message.trim()) return alert('Message cannot be empty')
        if (!confirm(`Send to ${selectedStudents.length} students?`)) return

        setSending(true)
        try {
            const res = await apiCall('/notifications/send', {
                method: 'POST',
                body: JSON.stringify({
                    studentIds: selectedStudents,
                    message: message
                })
            })
            console.log(res)
            alert(`Sent! Success: ${res.results.filter(r => r.status === 'Sent').length}, Failed: ${res.results.filter(r => r.status !== 'Sent').length}`)
            mutateHistory()
            setMessage('')
        } catch (err) {
            console.error(err)
            alert('Failed to send')
        } finally {
            setSending(false)
        }
    }

    // Search Results for Autocomplete
    const searchResults = searchTerm && students ? students.filter(s =>
        (s.firstName + ' ' + s.lastName).toLowerCase().includes(searchTerm.toLowerCase())
    ) : []

    const previewMessage = message.replace(/{name}/g, "StudentName")

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{ marginBottom: 30 }}>
                        <h1 style={{ margin: 0, fontSize: 24, color: '#1e293b' }}>Communication Center</h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Send announcements, reminders, and updates.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 30, alignItems: 'start' }}>

                        {/* Main Interaction Area */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* 1. Recipient Selection */}
                            <div className="card" style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 10 }}><Users size={18} /> Select Recipients</h3>

                                <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                                    {['all', 'class', 'team', 'individual'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => { setFilterType(type); setFilterValue(''); setSelectedStudents([]) }}
                                            style={{
                                                padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
                                                background: filterType === type ? '#f1f5f9' : 'white',
                                                fontWeight: filterType === type ? 600 : 400,
                                                cursor: 'pointer', textTransform: 'capitalize'
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                {/* Dynamic Filters */}
                                {filterType === 'class' && (
                                    <div style={{ marginBottom: 15 }}>
                                        <select onChange={(e) => setFilterValue(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd', width: '100%' }}>
                                            <option value="">Select Class</option>
                                            {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Class {i + 1}</option>)}
                                        </select>
                                    </div>
                                )}
                                {filterType === 'team' && (
                                    <div style={{ marginBottom: 15 }}>
                                        <select onChange={(e) => setFilterValue(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd', width: '100%' }}>
                                            <option value="">Select Team</option>
                                            {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {filterType === 'individual' && (
                                    <div style={{ marginBottom: 15, position: 'relative' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #ddd', borderRadius: 8, padding: '5px 10px' }}>
                                            <Search size={16} color="#999" />
                                            <input
                                                type="text"
                                                placeholder="Search student name..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                style={{ border: 'none', outline: 'none', width: '100%', padding: '5px 0' }}
                                            />
                                        </div>
                                        {searchResults.length > 0 && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #eee', borderRadius: 8, marginTop: 5, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                                                {searchResults.map(s => (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => handleSearchAdd(s.id)}
                                                        style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f9f9f9', fontSize: 13 }}
                                                        onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                                                        onMouseLeave={(e) => e.target.style.background = 'white'}
                                                    >
                                                        {s.firstName} {s.lastName} <span style={{ color: '#999', fontSize: 11 }}>({s.phoneNumber || 'No Phone'})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Selected Count / List */}
                                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, fontSize: 13, color: '#475569' }}>
                                    <strong>{selectedStudents.length}</strong> students selected.
                                    {filterType === 'individual' && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
                                            {students?.filter(s => selectedStudents.includes(s.id)).map(s => (
                                                <span key={s.id} onClick={() => removeStudent(s.id)} style={{ background: 'white', padding: '2px 8px', borderRadius: 12, border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    {s.firstName} <X size={10} />
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 2. Message Composer */}
                            <div className="card" style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><MessageSquare size={18} /> Compose Message</h3>
                                </div>

                                {/* Templates */}
                                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, marginBottom: 10 }}>
                                    {templates.map((t, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setMessage(t.text)}
                                            style={{
                                                flexShrink: 0, padding: '6px 12px', fontSize: 12, borderRadius: 20,
                                                border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 6
                                            }}
                                        >
                                            {t.icon} {t.label}
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message here... Use {name} to insert student's name."
                                    style={{ width: '100%', minHeight: 120, padding: 15, borderRadius: 12, border: '1px solid #e2e8f0', fontFamily: 'inherit', resize: 'vertical' }}
                                />
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 5, textAlign: 'right' }}>
                                    {message.length} characters
                                </div>

                                {/* Preview */}
                                {message && (
                                    <div style={{ marginTop: 15, padding: 15, background: '#f0fdf4', borderRadius: 12, border: '1px solid #dcfce7' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 5, textTransform: 'uppercase' }}>Preview</div>
                                        <div style={{ fontSize: 14, color: '#14532d' }}>{previewMessage}</div>
                                    </div>
                                )}

                                <button
                                    onClick={sendNotification}
                                    disabled={sending || selectedStudents.length === 0}
                                    style={{
                                        width: '100%', marginTop: 20, padding: 12,
                                        background: sending ? '#ccc' : '#7c3aed', color: 'white',
                                        border: 'none', borderRadius: 8, fontWeight: 600,
                                        cursor: sending ? 'not-allowed' : 'pointer',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8
                                    }}
                                >
                                    {sending ? 'Sending...' : <><Send size={18} /> Send Message</>}
                                </button>
                            </div>

                        </div>

                        {/* Sidebar: History */}
                        <div className="card" style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: 16 }}><Clock size={16} /> History</h3>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 15 }}>Recent activity log.</div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {history?.map((log, i) => (
                                    <div key={i} style={{ padding: 10, border: '1px solid #f1f5f9', borderRadius: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                                            <span style={{ fontWeight: 600 }}>{new Date(log.date).toLocaleDateString()}</span>
                                            <span style={{
                                                background: log.status === 'Sent' ? '#dcfce7' : '#fee2e2',
                                                color: log.status === 'Sent' ? '#166534' : '#991b1b',
                                                padding: '2px 6px', borderRadius: 4, fontSize: 10
                                            }}>{log.status}</span>
                                        </div>
                                        <div style={{ fontSize: 13, color: '#333', marginBottom: 5 }}>{log.message.substring(0, 50)}...</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>To: {log.recipientCount} Recipients</div>
                                    </div>
                                ))}
                                {(!history || history.length === 0) && <div style={{ textAlign: 'center', padding: 20, color: '#ccc', fontStyle: 'italic' }}>No history yet</div>}
                            </div>
                        </div>

                    </div>
                </div>
            </AdminLayout>
        </ProtectedRoute>
    )
}

function X({ size }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
    )
}
