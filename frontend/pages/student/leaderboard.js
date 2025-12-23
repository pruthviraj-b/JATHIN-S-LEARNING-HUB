import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import StudentLayout from '../../components/StudentLayout'
import { apiCall } from '../../lib/api'
import { Trophy, Users, User, Medal } from 'lucide-react'

export default function Leaderboard() {
    const [activeTab, setActiveTab] = useState('students') // 'students' or 'teams'
    const [leaders, setLeaders] = useState([])
    const [loadState, setLoadState] = useState({ loading: true, error: null })

    useEffect(() => {
        async function load() {
            setLoadState({ loading: true, error: null })
            try {
                // Fetch strictly based on active tab
                const endpoint = activeTab === 'students'
                    ? '/stars/leaderboard/students'
                    : '/stars/leaderboard/teams'

                const data = await apiCall(endpoint)
                setLeaders(data)
                setLoadState({ loading: false, error: null })
            } catch (err) {
                console.error(err)
                setLoadState({ loading: false, error: err.message || 'Failed to load leaderboard' })
            }
        }
        load()
    }, [activeTab])

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <StudentLayout>
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Leaderboard</h1>
                    <p style={{ margin: '5px 0 0', color: '#64748b' }}>See the top performers and leading teams</p>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex', gap: 10, marginBottom: 24,
                    background: '#F4F4F5', padding: 4, borderRadius: 12, width: 'fit-content', border: '1px solid #E4E4E7'
                }}>
                    <TabButton
                        active={activeTab === 'students'}
                        onClick={() => setActiveTab('students')}
                        icon={<User size={16} />}
                        label="Students"
                    />
                    <TabButton
                        active={activeTab === 'teams'}
                        onClick={() => setActiveTab('teams')}
                        icon={<Users size={16} />}
                        label="Teams"
                    />
                </div>

                {loadState.loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading scores...</div>
                ) : loadState.error ? (
                    <div style={{ padding: 20, color: 'white', background: '#EF4444', borderRadius: 8 }}>{loadState.error}</div>
                ) : (
                    <div className="card" style={{
                        borderRadius: 16,
                        border: '1px solid #E4E4E7',
                        overflow: 'hidden',
                        overflowX: 'auto', // Add scroll for mobile,
                        padding: 0
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead style={{ background: '#F4F4F5', borderBottom: '1px solid #E4E4E7' }}>
                                <tr>
                                    <th style={{ padding: '16px', textAlign: 'left', width: 80, color: 'var(--text-muted)', fontWeight: 600 }}>Rank</th>
                                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        {activeTab === 'students' ? 'Student' : 'Team / Members'}
                                    </th>
                                    <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    let currentRank = 1; // Start at rank 1
                                    let lastPoints = -1;

                                    return leaders.map((entry, i) => {
                                        // Initialize
                                        if (i === 0) {
                                            lastPoints = entry.points;
                                        }

                                        if (entry.points < lastPoints) {
                                            currentRank++; // Dense Ranking: Only increment by 1
                                            lastPoints = entry.points;
                                        }
                                        // If points === lastPoints, currentRank stays same.

                                        // Special visual for Top 3 ranks (even if tied)
                                        const rankIcon = currentRank === 1 ? '👑' : currentRank === 2 ? '🥈' : currentRank === 3 ? '🥉' : `#${currentRank}`
                                        const rankColor = currentRank <= 3 ? '#D4AF37' : 'var(--text-muted)'

                                        const isTop3 = currentRank <= 3;

                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid #F4F4F5' }}>
                                                <td style={{ padding: '16px', fontWeight: 700, color: rankColor, fontSize: 16 }}>
                                                    {rankIcon}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    {activeTab === 'students' ? (
                                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                                            {entry.student?.firstName} {entry.student?.lastName}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 16, marginBottom: 4 }}>
                                                                {entry.team?.name || 'Unknown Team'}
                                                            </div>
                                                            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                                                {entry.team?.members?.length > 0 ? (
                                                                    entry.team.members.map(s => s.firstName).join(', ')
                                                                ) : 'No members'}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                                    <div style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                                        background: isTop3 ? '#FEF9C3' : 'transparent',
                                                        color: isTop3 ? '#B45309' : 'var(--text-muted)',
                                                        padding: '6px 12px', borderRadius: 20, fontWeight: 700,
                                                        border: isTop3 ? '1px solid #FDE047' : 'none'
                                                    }}>
                                                        <Trophy size={14} /> {entry.points}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                })()}
                                {leaders.length === 0 && (
                                    <tr>
                                        <td colSpan={3} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No data available yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </StudentLayout>
        </ProtectedRoute>
    )
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: active ? 'white' : 'transparent',
                color: active ? 'black' : 'var(--text-muted)',
                fontWeight: active ? 600 : 500,
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer', transition: 'all 0.2s',
                fontSize: 14,
                border: active ? '1px solid #E4E4E7' : '1px solid transparent'
            }}
        >
            {icon} {label}
        </button>
    )
}
