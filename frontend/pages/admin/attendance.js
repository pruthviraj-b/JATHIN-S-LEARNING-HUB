import { useState, useEffect } from 'react'
import useSWR from 'swr'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import { Check, X, Calendar } from 'lucide-react'

const fetcher = (url) => apiCall(url)

export default function Attendance() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const { data: students } = useSWR('/students', fetcher)
    const { data: attendanceData, mutate } = useSWR(`/attendance?date=${date}`, fetcher)

    const [loading, setLoading] = useState({})

    const getStatus = (studentId) => {
        const record = attendanceData?.find(r => r.studentId === studentId)
        if (!record) return null // Not marked
        return record.present ? 'present' : 'absent'
    }

    const markAttendance = async (studentId, present) => {
        setLoading(prev => ({ ...prev, [studentId]: true }))
        try {
            await apiCall('/attendance', {
                method: 'POST',
                body: JSON.stringify({
                    studentId,
                    date,
                    present
                })
            })
            mutate() // Refresh data
        } catch (err) {
            console.error(err)
            alert('Failed to mark attendance')
        } finally {
            setLoading(prev => ({ ...prev, [studentId]: false }))
        }
    }

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24, color: '#1e293b' }}>Daily Attendance</h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Manage student presence for {date}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <Calendar size={18} color="#64748b" />
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontFamily: 'inherit', color: '#1e293b' }}
                        />
                    </div>
                </div>

                <div className="card" style={{ background: '#fff' }}>
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Class</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students?.map(student => {
                                    const status = getStatus(student.id)
                                    const isPresent = status === 'present'
                                    const isAbsent = status === 'absent'
                                    const isLoading = loading[student.id]

                                    return (
                                        <tr key={student.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: '50%',
                                                        background: '#e2e8f0', color: '#64748b',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 'bold', fontSize: 13, overflow: 'hidden'
                                                    }}>
                                                        {student.profileUrl ? (
                                                            <img src={student.profileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            student.firstName[0]
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{student.firstName} {student.lastName}</div>
                                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{student.team?.name || 'No Team'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: 4, background: '#f1f5f9',
                                                    color: '#475569', fontSize: 12, fontWeight: 500
                                                }}>
                                                    Class {student.classLevel}
                                                </span>
                                            </td>
                                            <td>
                                                {status ? (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                                        padding: '6px 10px', borderRadius: 20,
                                                        background: isPresent ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                        color: isPresent ? '#15803d' : '#b91c1c',
                                                        fontSize: 13, fontWeight: 600
                                                    }}>
                                                        {isPresent ? 'Present' : 'Absent'}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>Not marked</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: 8 }}>
                                                    <button
                                                        onClick={() => markAttendance(student.id, true)}
                                                        disabled={isLoading}
                                                        style={{
                                                            width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                                                            background: isPresent ? '#22c55e' : '#f0fdf4',
                                                            color: isPresent ? '#fff' : '#22c55e',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.2s',
                                                            border: isPresent ? 'none' : '1px solid #dcfce7'
                                                        }}
                                                        title="Mark Present"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => markAttendance(student.id, false)}
                                                        disabled={isLoading}
                                                        style={{
                                                            width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                                                            background: isAbsent ? '#ef4444' : '#fef2f2',
                                                            color: isAbsent ? '#fff' : '#ef4444',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.2s',
                                                            border: isAbsent ? 'none' : '1px solid #fee2e2'
                                                        }}
                                                        title="Mark Absent"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {!students && <tr><td colSpan="4" style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Loading students...</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </AdminLayout>
        </ProtectedRoute>
    )
}
