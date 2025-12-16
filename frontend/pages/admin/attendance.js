import { useState, useEffect } from 'react'
import useSWR from 'swr'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import { ChevronsRight, Send } from 'lucide-react'
import { Check, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const fetcher = (url) => apiCall(url)

export default function Attendance() {
    // Current selected date (YYYY-MM-DD)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    // For Calendar Navigation state (Month View)
    const [viewDate, setViewDate] = useState(new Date())

    const { data: students } = useSWR('/students', fetcher)
    const { data: attendanceData, mutate } = useSWR(`/attendance?date=${date}`, fetcher)

    // Fetch ALL classes to show dots on calendar
    const { data: allClasses } = useSWR('/classes', fetcher)

    const [loading, setLoading] = useState({})
    const [sending, setSending] = useState(false)

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

    const sendBulkNotification = async () => {
        if (!attendanceData || attendanceData.length === 0) return alert('No attendance marked for today yet.')
        if (!confirm('Send WhatsApp/SMS to all marked students?')) return

        setSending(true)
        try {
            // Prepare data: { id, name, phoneNumber, status }
            // We need to map students to their attendance status
            const presentStudents = students.filter(s => getStatus(s.id)) // Only marked ones
            const payload = presentStudents.map(s => ({
                id: s.id,
                name: s.firstName,
                phoneNumber: s.phoneNumber,
                status: getStatus(s.id) // 'present' or 'absent'
            }))

            const res = await apiCall('/attendance/notify', {
                method: 'POST',
                body: JSON.stringify({
                    students: payload,
                    message: "Hi Parent, {name} is {status} today for tuition. - JLH Tuition"
                })
            })
            console.log(res)
            alert('Notifications Sent! (Check Server Console for Logs)')
        } catch (err) {
            console.error(err)
            alert('Error sending notifications')
        } finally {
            setSending(false)
        }
    }

    // --- Calendar Logic ---
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

    // Group classes by Date for dots
    const classesByDate = {}
    if (allClasses) {
        allClasses.forEach(c => {
            const d = new Date(c.scheduledAt)
            if (d.getMonth() === month && d.getFullYear() === year) {
                const day = d.getDate()
                if (!classesByDate[day]) classesByDate[day] = []
                classesByDate[day].push(c)
            }
        })
    }

    // Handle Date Click
    const handleDateClick = (day) => {
        // Create YYYY-MM-DD string in local time (using simple padding)
        const d = new Date(year, month, day)
        // Adjust for timezone offset to get local YYYY-MM-DD
        const offset = d.getTimezoneOffset()
        const localDate = new Date(d.getTime() - (offset * 60 * 1000))
        const dateStr = localDate.toISOString().split('T')[0]
        setDate(dateStr)
    }

    const renderCalendarDays = () => {
        const days = []
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ height: 60, background: '#f9f9f9', border: '1px solid #eee' }}></div>)
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const daysClasses = classesByDate[d] || []
            // Check if this day is the selected 'date'
            const thisDateStr = new Date(year, month, d).toLocaleDateString('en-CA') // YYYY-MM-DD local approx
            // Simpler check: construct date string manually to match 'date' state
            const checkDate = new Date(year, month, d)
            const checkDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`

            const isSelected = date === checkDateStr
            const isToday = new Date().toDateString() === checkDate.toDateString()

            days.push(
                <div
                    key={d}
                    onClick={() => handleDateClick(d)}
                    style={{
                        height: 60,
                        background: isSelected ? '#f0f9ff' : 'white',
                        border: isSelected ? '2px solid #3b82f6' : '1px solid #eee',
                        padding: 5,
                        cursor: 'pointer',
                        position: 'relative'
                    }}
                >
                    <div style={{ fontSize: 12, fontWeight: (isToday || isSelected) ? 'bold' : 'normal', color: (isToday || isSelected) ? '#3699ff' : '#333' }}>{d}</div>
                    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: 3 }}>
                        {daysClasses.map((c, i) => (
                            <div key={i} title={c.title} style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }}></div>
                        ))}
                    </div>
                </div>
            )
        }
        return days
    }

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
                <div style={{ marginBottom: 30 }}>
                    <h1 style={{ margin: 0, fontSize: 24, color: '#1e293b' }}>Attendance</h1>
                    <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Select a date to manage student presence.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30 }}>
                    {/* Calendar Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, background: 'white', padding: 10, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <button onClick={prevMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 5 }}><ChevronLeft size={20} /></button>
                            <span style={{ fontWeight: 700, fontSize: 15 }}>{monthNames[month]} {year}</span>
                            <button onClick={nextMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 5 }}><ChevronRight size={20} /></button>
                        </div>
                        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                    <div key={d} style={{ padding: 8, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{d}</div>
                                ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                {renderCalendarDays()}
                            </div>
                        </div>
                    </div>

                    {/* List Section */}
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20 }}>
                        <h3 style={{ margin: 0 }}>{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                        <button
                            onClick={sendBulkNotification}
                            disabled={sending}
                            style={{
                                background: '#7c3aed', color: 'white', border: 'none',
                                padding: '8px 16px', borderRadius: 8,
                                fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6
                            }}
                        >
                            {sending ? 'Sending...' : <><Send size={16} /> Notify Parents</>}
                        </button>
                    </div>
                </div>
                <div style={{ marginBottom: 15, fontSize: 13, color: '#64748b' }}>
                    Showing student status for selected date.
                </div>
                {/* Existing Table Logic ... */}

                <div className="card" style={{ background: '#fff', overflowX: 'auto' }}>
                    <div className="table-responsive">
                        <table style={{ minWidth: 600 }}>
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
        </ProtectedRoute >
    )
}
