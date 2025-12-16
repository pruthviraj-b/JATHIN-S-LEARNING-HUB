import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import StudentLayout from '../../components/StudentLayout'
import { apiCall } from '../../lib/api'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'

export default function StudentAttendance() {
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date()) // For Calendar Navigation

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

    // --- Stats ---
    const total = classes.length
    const present = classes.filter(c => c.attendances?.length > 0 && c.attendances[0].present).length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    // --- Calendar Logic ---
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay() // 0 = Sun

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

    // Group classes by Date (YYYY-MM-DD local)
    const classesByDate = {}
    classes.forEach(c => {
        const d = new Date(c.scheduledAt)
        // Check if same month/year
        const dateKey = d.getDate() // 1-31
        if (d.getMonth() === month && d.getFullYear() === year) {
            if (!classesByDate[dateKey]) classesByDate[dateKey] = []
            classesByDate[dateKey].push(c)
        }
    })

    const renderCalendarDays = () => {
        const days = []
        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ height: 80, background: '#f9f9f9', border: '1px solid #eee' }}></div>)
        }
        // Actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const daysClasses = classesByDate[d] || []
            const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year

            days.push(
                <div key={d} style={{ height: 80, background: 'white', border: '1px solid #eee', padding: 5, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontWeight: isToday ? 'bold' : 'normal', color: isToday ? '#3699ff' : '#333', fontSize: 13 }}>{d}</div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 5 }}>
                        {daysClasses.map((c, i) => {
                            const record = c.attendances?.[0]
                            const isPresent = record?.present
                            const isMarked = !!record
                            const color = isMarked ? (isPresent ? '#22c55e' : '#ef4444') : '#cbd5e1'
                            return (
                                <div key={c.id} title={`${c.title}: ${isMarked ? (isPresent ? 'Present' : 'Absent') : 'Not Marked'}`} style={{ width: 8, height: 8, borderRadius: '50%', background: color }}></div>
                            )
                        })}
                    </div>
                </div>
            )
        }
        return days
    }

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <StudentLayout>
                <h1 style={{ marginTop: 0, fontSize: 24, fontWeight: 700 }}>✅ Attendance</h1>
                <p style={{ color: '#666', marginBottom: 20 }}>Visually track your monthly presence.</p>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15, marginBottom: 30 }}>
                    <div style={{ background: '#e8f5e9', padding: 20, borderRadius: 12, border: '1px solid #c8e6c9' }}>
                        <div style={{ fontSize: 28, fontWeight: '800', color: '#2e7d32' }}>{percentage}%</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1b5e20' }}>Attendance Rate</div>
                    </div>
                    <div style={{ background: '#e3f2fd', padding: 20, borderRadius: 12, border: '1px solid #bbdefb' }}>
                        <div style={{ fontSize: 28, fontWeight: '800', color: '#1565c0' }}>{present}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0d47a1' }}>Classes Attended</div>
                    </div>
                    <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 12, border: '1px solid #e0e0e0' }}>
                        <div style={{ fontSize: 28, fontWeight: '800', color: '#666' }}>{total}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#444' }}>Total Classes</div>
                    </div>
                </div>

                {/* Calendar Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, background: 'white', padding: 15, borderRadius: 12, boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
                    <button onClick={prevMonth} style={{ background: '#f1f1f1', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}><ChevronLeft /></button>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{monthNames[month]} {year}</span>
                    <button onClick={nextMonth} style={{ background: '#f1f1f1', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}><ChevronRight /></button>
                </div>

                {/* Calendar Grid */}
                <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    {/* Header Days */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} style={{ padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase' }}>{d}</div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {renderCalendarDays()}
                    </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: 20, marginTop: 15, fontSize: 13, justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}></div> Present</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div> Absent</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#cbd5e1' }}></div> No Record</div>
                </div>

                {/* Detailed List for Month */}
                <div style={{ marginTop: 30 }}>
                    <h3 style={{ fontSize: 16 }}>Detailed History (This Month)</h3>
                    {classes
                        .filter(c => new Date(c.scheduledAt).getMonth() === month && new Date(c.scheduledAt).getFullYear() === year)
                        .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
                        .length === 0 ? <p style={{ color: '#999' }}>No classes this month.</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {classes
                                .filter(c => new Date(c.scheduledAt).getMonth() === month && new Date(c.scheduledAt).getFullYear() === year)
                                .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
                                .map(c => {
                                    const record = c.attendances?.[0]
                                    const isPresent = record?.present
                                    const isMarked = !!record
                                    return (
                                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: 15, borderRadius: 10, borderLeft: `4px solid ${isMarked ? (isPresent ? '#22c55e' : '#ef4444') : '#cbd5e1'}` }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{new Date(c.scheduledAt).toLocaleDateString()}</div>
                                                <div style={{ fontSize: 13, color: '#666' }}>{c.subject?.name} - {c.title}</div>
                                            </div>
                                            <div>
                                                {isMarked ? (
                                                    isPresent ? <span style={{ color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>Present <Check size={16} /></span>
                                                        : <span style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>Absent <X size={16} /></span>
                                                ) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Pending</span>}
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    )}
                </div>

            </StudentLayout>
        </ProtectedRoute>
    )
}
