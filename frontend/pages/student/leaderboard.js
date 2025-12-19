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
                    background: '#f1f5f9', padding: 4, borderRadius: 12, width: 'fit-content'
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
                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading scores...</div>
                ) : loadState.error ? (
                    <div style={{ padding: 20, color: '#ef4444', background: '#fef2f2', borderRadius: 8 }}>{loadState.error}</div>
                ) : (
                    <div className="card" style={{
                        background: 'white',
                        borderRadius: 16,
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '16px', textAlign: 'left', width: 80, color: '#64748b', fontWeight: 600 }}>Rank</th>
                                    <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>
                                        {activeTab === 'students' ? 'Student' : 'Team / Members'}
                                    </th>
                                    <th style={{ padding: '16px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>Points</th>
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
                                        const rankColor = currentRank === 1 ? '#fbbf24' : currentRank === 2 ? '#94a3b8' : currentRank === 3 ? '#b45309' : '#64748b'

                                        const isTop3 = currentRank <= 3;

                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '16px', fontWeight: 700, color: rankColor, fontSize: 16 }}>
                                                    {rankIcon}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    {activeTab === 'students' ? (
                                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                                            {entry.student?.firstName} {entry.student?.lastName}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 4 }}>
                                                                {entry.team?.name || 'Unknown Team'}
                                                            </div>
                                                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
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
                                                        background: isTop3 ? '#fffbeb' : '#f1f5f9',
                                                        color: isTop3 ? '#b45309' : '#475569',
                                                        padding: '6px 12px', borderRadius: 20, fontWeight: 700
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
                                        <td colSpan={3} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
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
                color: active ? '#0f172a' : '#64748b',
                fontWeight: active ? 600 : 500,
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer', transition: 'all 0.2s',
                fontSize: 14
            }}
        >
            {icon} {label}
        </button>
    )
}
