import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { apiCall } from '../../lib/api';
import BadgeCard from '../../components/BadgeCard';
import { Plus, Trash2, UserPlus, Search } from 'lucide-react';

export default function DebugBadges() {
    const [badges, setBadges] = useState([]);
    const [students, setStudents] = useState([]); // For assignment modal
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Create Form
    const [showCreate, setShowCreate] = useState(false);
    const [newBadge, setNewBadge] = useState({ name: '', description: '', icon: '🏆', tier: 'BRONZE' });

    // Assign Modal
    const [assignTarget, setAssignTarget] = useState(null); // badgeId to assign
    const [searchQuery, setSearchQuery] = useState('');

    // MOVED FUNCTIONS UP to avoid ReferenceError before early return
    const loadBadges = async () => {
        try {
            const data = await apiCall('/badges');
            setBadges(Array.isArray(data) ? data : []);
        } catch (err) { console.error('Error loading badges:', err); } finally { setLoading(false); }
    };

    const loadStudents = async () => {
        try {
            const data = await apiCall('/students?limit=1000'); // Get all for simplicity
            setStudents(data?.students || []);
        } catch (err) { console.error(err); setStudents([]); }
    };

    const handleCreate = async () => {
        try {
            await apiCall('/badges', { method: 'POST', body: JSON.stringify(newBadge) });
            setShowCreate(false);
            setNewBadge({ name: '', description: '', icon: '🏆', tier: 'BRONZE' });
            loadBadges();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this badge?')) return;
        try {
            await apiCall(`/badges/${id}`, { method: 'DELETE' });
            loadBadges();
        } catch (err) { alert(err.message); }
    };

    const handleAssign = async (studentId) => {
        if (!assignTarget) return;
        try {
            await apiCall('/badges/assign', {
                method: 'POST',
                body: JSON.stringify({ studentId, badgeId: assignTarget })
            });
            alert('Badge Assigned!');
            setAssignTarget(null);
        } catch (err) { alert(err.message); }
    };

    useEffect(() => {
        setMounted(true);
        loadBadges();
        loadStudents();
    }, []);

    if (!mounted) return null; // Early return now safely after function declarations

    const filteredStudents = (students || []).filter(s =>
        s && ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
                <div style={{ padding: 20 }}>
                    <div style={{ background: 'var(--success)', padding: 10, borderRadius: 8, marginBottom: 20, color: 'white' }}>
                        DEBUG PAGE: If you see this, the Badges logic IS working.
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Badge Management (DEBUG)</h1>
                    <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ background: 'var(--secondary)', color: 'white', border: 'none' }}>
                        <Plus size={18} /> Create Badge
                    </button>
                </div>

                {/* Create Badge Form (Inline for simplicity) */}
                {showCreate && (
                    <div className="card" style={{ marginBottom: 24, padding: 20 }}>
                        <h3 style={{ marginBottom: 15, color: 'var(--text-main)' }}>Create New Badge</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <input className="input-field" placeholder="Badge Name" value={newBadge.name} onChange={e => setNewBadge({ ...newBadge, name: e.target.value })} />
                            <select className="input-field" value={newBadge.tier} onChange={e => setNewBadge({ ...newBadge, tier: e.target.value })}>
                                <option value="BRONZE">Bronze</option>
                                <option value="SILVER">Silver</option>
                                <option value="GOLD">Gold</option>
                                <option value="PLATINUM">Platinum</option>
                            </select>
                            <input className="input-field" placeholder="Icon (Emoji)" value={newBadge.icon} onChange={e => setNewBadge({ ...newBadge, icon: e.target.value })} />
                            <input className="input-field" placeholder="Description" value={newBadge.description} onChange={e => setNewBadge({ ...newBadge, description: e.target.value })} />
                        </div>
                        <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
                            <button className="btn btn-primary" onClick={handleCreate}>Save Badge</button>
                            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* Badges Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
                    {Array.isArray(badges) && badges.filter(Boolean).map(badge => (
                        <div key={badge.id} className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 15, padding: 15 }}>
                            <BadgeCard badge={badge} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-main)' }}>{badge.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{badge.description}</div>
                                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setAssignTarget(badge.id)}>
                                        <UserPlus size={14} /> Assign
                                    </button>
                                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12, color: 'white', background: 'var(--danger)', boxShadow: 'none' }} onClick={() => handleDelete(badge.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {badges.length === 0 && !loading && (
                        <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                            No badges created yet.
                        </div>
                    )}
                </div>

                {/* Assignment Modal Overhead (Simple Implementation) */}
                {assignTarget && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <div className="card" style={{ width: 400, maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Assign Badge</h3>
                                <button onClick={() => setAssignTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✖</button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '0 10px', marginBottom: 15, border: '1px solid var(--glass-border)' }}>
                                <Search size={16} color="var(--text-muted)" />
                                <input
                                    style={{ border: 'none', background: 'transparent', padding: 10, outline: 'none', width: '100%', color: 'var(--text-main)' }}
                                    placeholder="Search student..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div style={{ overflowY: 'auto', flex: 1 }}>
                                {filteredStudents.map(s => (
                                    <div key={s.id} onClick={() => handleAssign(s.id)} style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#eee', overflow: 'hidden' }}>
                                            {s.profileUrl ? <img src={s.profileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                                        </div>
                                        <div style={{ color: 'var(--text-main)' }}>{s.firstName} {s.lastName}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </AdminLayout>
        </ProtectedRoute>
    );
}
