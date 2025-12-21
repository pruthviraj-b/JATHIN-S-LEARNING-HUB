import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { apiCall } from '../../lib/api';
import BadgeCard from '../../components/BadgeCard';

export default function AdminBadges() {
    const [badges, setBadges] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', description: '', icon: '🏆', tier: 'BRONZE' });
    const [assign, setAssign] = useState({ studentId: '', badgeId: '' });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [bData, sData] = await Promise.all([
                apiCall('/badges'),
                apiCall('/students')
            ]);
            setBadges(bData);
            setStudents(sData);
        } catch (err) {
            alert('Failed to load data');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        try {
            await apiCall('/badges', { method: 'POST', body: JSON.stringify(form) });
            alert('Badge Created!');
            setForm({ name: '', description: '', icon: '🏆', tier: 'BRONZE' });
            loadData();
        } catch (err) {
            alert(err.message);
        }
    }

    async function handleAssign(e) {
        e.preventDefault();
        try {
            await apiCall('/badges/assign', { method: 'POST', body: JSON.stringify(assign) });
            alert('Badge Assigned!');
            setAssign({ studentId: '', badgeId: '' });
        } catch (err) {
            alert(err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete badge?')) return;
        try {
            await apiCall(`/badges/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err) {
            alert(err.message);
        }
    }

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
                <div style={{ padding: 24 }}>
                    <h1 style={{ color: 'white', marginBottom: 30 }}>Gamification & Badges</h1>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginBottom: 40 }}>
                        {/* Create Badge */}
                        <div className="card" style={{ background: '#09090B', padding: 24, borderRadius: 16, border: '1px solid #27272A' }}>
                            <h3 style={{ color: 'white', borderBottom: '1px solid #27272A', paddingBottom: 10, marginBottom: 20 }}>Create New Badge</h3>
                            <form onSubmit={handleCreate} style={{ display: 'grid', gap: 15 }}>
                                <input placeholder="Badge Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} required />
                                <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} />
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input placeholder="Icon (Emoji)" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} style={{ ...inputStyle, width: 80 }} />
                                    <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                                        <option value="BRONZE">Bronze</option>
                                        <option value="SILVER">Silver</option>
                                        <option value="GOLD">Gold</option>
                                        <option value="PLATINUM">Platinum</option>
                                    </select>
                                </div>
                                <button type="submit" style={btnStyle}>Create Badge</button>
                            </form>
                        </div>

                        {/* Assign Badge */}
                        <div className="card" style={{ background: '#09090B', padding: 24, borderRadius: 16, border: '1px solid #27272A' }}>
                            <h3 style={{ color: 'white', borderBottom: '1px solid #27272A', paddingBottom: 10, marginBottom: 20 }}>Award Badge to Student</h3>
                            <form onSubmit={handleAssign} style={{ display: 'grid', gap: 15 }}>
                                <select value={assign.studentId} onChange={e => setAssign({ ...assign, studentId: e.target.value })} style={inputStyle} required>
                                    <option value="">Select Student</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                                </select>
                                <select value={assign.badgeId} onChange={e => setAssign({ ...assign, badgeId: e.target.value })} style={inputStyle} required>
                                    <option value="">Select Badge</option>
                                    {badges.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
                                </select>
                                <button type="submit" style={{ ...btnStyle, background: 'white', color: 'black' }}>Award Badge</button>
                            </form>
                        </div>
                    </div>

                    {/* Badge Library */}
                    <h3 style={{ color: 'white', marginBottom: 20 }}>Badge Library</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                        {badges.map(b => (
                            <div key={b.id} style={{ position: 'relative' }}>
                                <BadgeCard badge={b} />
                                <button
                                    onClick={() => handleDelete(b.id)}
                                    style={{
                                        position: 'absolute', top: -5, right: -5,
                                        background: 'red', color: 'white', border: 'none',
                                        borderRadius: '50%', width: 20, height: 20, cursor: 'pointer'
                                    }}
                                >×</button>
                            </div>
                        ))}
                        {badges.length === 0 && <p style={{ color: '#666' }}>No badges created yet.</p>}
                    </div>
                </div>
            </AdminLayout>
        </ProtectedRoute>
    );
}

const inputStyle = {
    padding: 12, borderRadius: 8, border: '1px solid #27272A',
    background: '#18181B', color: 'white', outline: 'none'
};

const btnStyle = {
    padding: 12, borderRadius: 8, border: 'none',
    background: '#27272A', color: 'white', fontWeight: 700, cursor: 'pointer'
};
