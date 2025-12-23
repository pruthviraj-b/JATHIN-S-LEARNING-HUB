import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import StudentLayout from '../../components/StudentLayout'
import { apiCall } from '../../lib/api'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'

export default function StudentAttendance() {
    // Data State
    const [attendances, setAttendances] = useState([])
    const [loading, setLoading] = useState(true)

    // Calendar & Stats State
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState(null)

    useEffect(() => {
        async function load() {
            try {
                // Fetch direct attendance records instead of classes
                const data = await apiCall('/attendance/me')
                setAttendances(data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    // --- Stats ---
    // Total classes = count of attendance records (assuming records only exist for scheduled classes that passed)
    // Or we can count based on 'present' vs 'absent' status
    const total = attendances.length
    const present = attendances.filter(a => a.present).length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    // --- Calendar Logic ---
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay() // 0 = Sun

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

    const prevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null); }
    const nextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null); }

    // Group records by Date (YYYY-MM-DD local)
    const recordsByDate = {}
    attendances.forEach(a => {
        const d = new Date(a.date) // 'date' from attendance model
        const dLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        const day = dLocal.getDate()

        if (dLocal.getMonth() === month && dLocal.getFullYear() === year) {
            if (!recordsByDate[day]) recordsByDate[day] = []
            recordsByDate[day].push(a)
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
            const daysRecords = recordsByDate[d] || []
            const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year
            const isSelected = selectedDay === d

            days.push(
                <div
                    key={d}
                    onClick={() => setSelectedDay(d === selectedDay ? null : d)}
                    style={{
                        height: 80,
                        background: isSelected ? '#f0f9ff' : 'white',
                        border: isSelected ? '2px solid #3b82f6' : '1px solid #eee',
                        padding: 5,
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.1s'
                    }}
                >
                    <div style={{ fontWeight: (isToday || isSelected) ? 'bold' : 'normal', color: (isToday || isSelected) ? '#3699ff' : '#333', fontSize: 13 }}>{d}</div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 5 }}>
                        {daysRecords.map((a, i) => {
                            const color = a.present ? '#22c55e' : '#ef4444'
                            return (
                                <div key={a.id} style={{ width: 8, height: 8, borderRadius: '50%', background: color }}></div>
                            )
                        })}
                    </div>
                </div>
            )
        }
        return days
    }

    // Filter records based on both Month AND Selected Day
    const filteredRecords = attendances.filter(a => {
        const d = new Date(a.date)
        const dLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate())

        // Must be in current view month
        if (dLocal.getMonth() !== month || dLocal.getFullYear() !== year) return false

        // If specific day selected, match it
        if (selectedDay) {
            return dLocal.getDate() === selectedDay
        }
        return true
    }).sort((a, b) => new Date(b.date) - new Date(a.date))

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <StudentLayout>
                <h1 style={{ marginTop: 0, fontSize: 24, fontWeight: 700 }}>✅ Attendance</h1>
                <p style={{ color: '#666', marginBottom: 20 }}>Visually track your monthly presence.</p>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15, marginBottom: 30 }}>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontSize: 28, fontWeight: '800', color: 'var(--text-main)' }}>{percentage}%</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Attendance Rate</div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontSize: 28, fontWeight: '800', color: 'var(--text-main)' }}>{present}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Classes Attended</div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontSize: 28, fontWeight: '800', color: 'var(--text-main)' }}>{total}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Total Classes</div>
                    </div>
                </div>

                {/* Calendar Controls */}
                <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, padding: 15, flexDirection: 'row' }}>
                    <button onClick={prevMonth} style={{ background: 'white', border: '1px solid #E4E4E7', color: 'var(--text-main)', borderRadius: 8, padding: 8, cursor: 'pointer' }}><ChevronLeft /></button>
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>{monthNames[month]} {year}</span>
                    <button onClick={nextMonth} style={{ background: 'white', border: '1px solid #E4E4E7', color: 'var(--text-main)', borderRadius: 8, padding: 8, cursor: 'pointer' }}><ChevronRight /></button>
                </div>

                {/* Calendar Grid */}
                <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #E4E4E7', boxShadow: 'var(--shadow-card)' }}>
                    {/* Header Days */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#F4F4F5', borderBottom: '1px solid #E4E4E7' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} style={{ padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d}</div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {renderCalendarDays()}
                    </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: 20, marginTop: 15, fontSize: 13, justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}></div> Present</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div> Absent</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F4F4F5', border: '1px solid #E4E4E7' }}></div> No Record</div>
                </div>

                {/* Detailed List for Month */}
                <div style={{ marginTop: 30 }}>
                    <h3 style={{ fontSize: 16, color: 'var(--text-main)' }}>
                        {selectedDay ? `History for ${monthNames[month]} ${selectedDay}` : `Full History (${monthNames[month]})`}
                    </h3>
                    {filteredRecords.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No records found{selectedDay ? ' for this date' : ''}.</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {filteredRecords.map(a => {
                                const isPresent = a.present
                                return (
                                    <div key={a.id} className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderLeft: `4px solid ${isPresent ? '#22c55e' : '#ef4444'}` }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(a.date).toLocaleDateString()}</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                                {a.class?.subject?.name || 'Class'} - {a.class?.title || 'Session'}
                                            </div>
                                        </div>
                                        <div>
                                            {isPresent ?
                                                <span style={{ color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>Present <Check size={16} /></span>
                                                : <span style={{ color: '#991B1B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>Absent <X size={16} /></span>
                                            }
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
