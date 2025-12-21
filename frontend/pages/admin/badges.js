
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { apiCall } from '../../lib/api';
import BadgeCard from '../../components/BadgeCard';
import { Plus, Trash2, UserPlus, Search } from 'lucide-react';

export default function AdminBadges() {
    const [badges, setBadges] = useState([]);
    const [students, setStudents] = useState([]); // For assignment modal
    const [loading, setLoading] = useState(true);

    // Create Form
    const [showCreate, setShowCreate] = useState(false);
    const [newBadge, setNewBadge] = useState({ name: '', description: '', icon: '🏆', tier: 'BRONZE' });

    // Assign Modal
    const [assignTarget, setAssignTarget] = useState(null); // badgeId to assign
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadBadges();
        loadStudents();
    }, []);

    const loadBadges = async () => {
        try {
            const data = await apiCall('/badges');
            setBadges(data);
        } catch (err) { alert(err.message); } finally { setLoading(false); }
    };

    const loadStudents = async () => {
        try {
            const data = await apiCall('/students?limit=1000'); // Get all for simplicity
            setStudents(data.students || []);
        } catch (err) { console.error(err); }
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

    const filteredStudents = students.filter(s =>
        (s.firstName + ' ' + s.lastName).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Badge Management</h1>
                <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ background: 'var(--secondary)', color: 'white', border: 'none' }}>
                    <Plus size={18} /> Create Badge
                </button>
            </div>

            {/* Create Badge Form (Inline for simplicity) */}
            {showCreate && (
                <div className="card" style={{ marginBottom: 24, padding: 20 }}>
                    <h3 style={{ marginBottom: 15 }}>Create New Badge</h3>
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
                {badges.map(badge => (
                    <div key={badge.id} className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 15, padding: 15 }}>
                        <BadgeCard badge={badge} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{badge.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{badge.description}</div>
                            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                                <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setAssignTarget(badge.id)}>
                                    <UserPlus size={14} /> Assign
                                </button>
                                <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12, color: 'var(--danger)' }} onClick={() => handleDelete(badge.id)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Assignment Modal Overhead (Simple Implementation) */}
            {assignTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="card" style={{ width: 400, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                            <h3>Assign Badge</h3>
                            <button onClick={() => setAssignTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✖</button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-body)', borderRadius: 8, padding: '0 10px', marginBottom: 15 }}>
                            <Search size={16} />
                            <input
                                style={{ border: 'none', background: 'transparent', padding: 10, outline: 'none', width: '100%' }}
                                placeholder="Search student..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {filteredStudents.map(s => (
                                <div key={s.id} onClick={() => handleAssign(s.id)} style={{ padding: '10px', borderBottom: '1px solid var(--bg-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#eee', overflow: 'hidden' }}>
                                        {s.profileUrl ? <img src={s.profileUrl} style={{ width: '100%', height: '100%' }} /> : null}
                                    </div>
                                    <div>{s.firstName} {s.lastName}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
