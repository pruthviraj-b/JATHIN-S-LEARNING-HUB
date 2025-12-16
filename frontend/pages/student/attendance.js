import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import StudentLayout from '../../components/StudentLayout'
import { apiCall } from '../../lib/api'
import Link from 'next/link'

export default function StudentAttendance() {
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const data = await apiCall('/classes')
                setClasses(data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    // Calculate stats
    const total = classes.length
    // For student, attendances array has 0 or 1 item (their own)
    const present = classes.filter(c => c.attendances && c.attendances.length > 0 && c.attendances[0].present).length
    const absent = classes.filter(c => c.attendances && c.attendances.length > 0 && !c.attendances[0].present).length
    // If no attendance record, maybe it's future or not marked. Let's assume 'Pending' if past? No, just 'Not Marked'.

    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <StudentLayout>
                <h1 style={{ marginTop: 0, fontSize: 24 }}>✅ Attendance Record</h1>
                <p style={{ color: '#666', marginBottom: 30 }}>Track your presence in classes.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 30, textAlign: 'center' }}>
                    <div style={{ background: '#e8f5e9', padding: 20, borderRadius: 8 }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2e7d32' }}>{percentage}%</div>
                        <div style={{ fontSize: 12 }}>Attendance</div>
                    </div>
                    <div style={{ background: '#e3f2fd', padding: 20, borderRadius: 8 }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1565c0' }}>{present}</div>
                        <div style={{ fontSize: 12 }}>Classes Attended</div>
                    </div>
                    <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#666' }}>{total}</div>
                        <div style={{ fontSize: 12 }}>Total Classes</div>
                    </div>
                </div>

                {loading ? <p>Loading...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #ddd' }}>
                                <th style={{ textAlign: 'left', padding: 10 }}>Date</th>
                                <th style={{ textAlign: 'left', padding: 10 }}>Subject/Topic</th>
                                <th style={{ textAlign: 'center', padding: 10 }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map(c => {
                                const record = c.attendances?.[0]
                                const status = record ? (record.present ? 'Present' : 'Absent') : '—'
                                const color = record ? (record.present ? 'green' : 'red') : 'gray'

                                return (
                                    <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: 10 }}>
                                            {new Date(c.scheduledAt).toLocaleDateString()} <br />
                                            <small style={{ color: '#999' }}>{new Date(c.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                        </td>
                                        <td style={{ padding: 10 }}>
                                            <strong>{c.subject?.name}</strong> <br />
                                            {c.title}
                                        </td>
                                        <td style={{ padding: 10, textAlign: 'center', color: color, fontWeight: 'bold' }}>
                                            {status}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </StudentLayout>
        </ProtectedRoute>
    )
}
