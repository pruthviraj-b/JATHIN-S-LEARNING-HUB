import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/AdminLayout';
import { apiCall } from '../../lib/api';
import { MessageSquare, RefreshCcw, Filter, Send, LogOut, CheckSquare, Square } from 'lucide-react';

const fetcher = (url) => apiCall(url);

export default function WhatsAppManager() {
    const { data: statusData, mutate: checkStatus } = useSWR('/whatsapp/status', fetcher, { refreshInterval: 3000 });
    const { data: students } = useSWR('/students', fetcher);

    const [status, setStatus] = useState('initializing');
    const [qrCode, setQrCode] = useState(null);

    // Filter/Selection State
    const [filterClass, setFilterClass] = useState('All');
    const [filterFee, setFilterFee] = useState('All'); // All, Pending, Paid
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // Message State
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [logs, setLogs] = useState(null); // Result of last send

    useEffect(() => {
        if (statusData) {
            setStatus(statusData.status);
            setQrCode(statusData.qrCode);
        }
    }, [statusData]);

    const handleLogout = async () => {
        if (!confirm('Disconnect WhatsApp?')) return;
        try {
            await apiCall('/whatsapp/logout', { method: 'POST' });
            checkStatus();
        } catch (e) { alert(e.message); }
    };

    // --- Filtering Logic ---
    const filteredStudents = useMemo(() => {
        if (!students) return [];
        return students.filter(s => {
            // Class Filter
            if (filterClass !== 'All' && s.classId !== filterClass && s.class?.name !== filterClass) return false;
            // Search Filter
            if (search && !s.firstName.toLowerCase().includes(search.toLowerCase())) return false;

            // Fee Filter (Mocking logic based on existence of fee data or just manual selection for now)
            // Ideally we check s.fees.pending amount. Assuming 'fees' relation or calculated field.
            // For now, let's assume we filter by just Class/Search as Fees logic might be complex in frontend.
            // If user explicitly asked for "Fee Pending", maybe we add a checkbox "Has Pending Fees" 
            // but we need data. Let's stick to Name/Class for v1.
            return true;
        });
    }, [students, filterClass, filterFee, search]);

    const handleSelectAll = () => {
        if (selectedIds.length === filteredStudents.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredStudents.map(s => s.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSend = async () => {
        if (!message.trim()) return alert('Please enter a message');
        if (selectedIds.length === 0) return alert('No students selected');
        if (!confirm(`Send message to ${selectedIds.length} recipients?`)) return;

        setSending(true);
        setLogs(null);
        try {
            const res = await apiCall('/whatsapp/send', {
                method: 'POST',
                body: JSON.stringify({ studentIds: selectedIds, message })
            });
            setLogs(res);
            alert(`Process Complete: ${res.stats.sent} sent, ${res.stats.failed} failed.`);
        } catch (e) {
            alert(e.message);
        } finally {
            setSending(false);
        }
    };

    // Get Unique Classes
    const classes = useMemo(() => {
        const set = new Set(students?.map(s => s.class?.name).filter(Boolean));
        return ['All', ...Array.from(set)];
    }, [students]);

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ background: '#25D366', padding: 8, borderRadius: 8, color: 'white' }}>
                            <MessageSquare size={24} />
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>WhatsApp Manager</h1>
                    </div>
                    {status === 'ready' && (
                        <button onClick={handleLogout} className="btn-outline" style={{ color: '#DC2626', borderColor: '#DC2626' }}>
                            <LogOut size={16} style={{ marginRight: 6 }} /> Disconnect
                        </button>
                    )}
                </div>

                {/* --- CONNECTION STATE --- */}
                {status !== 'ready' ? (
                    <div className="card" style={{ textAlign: 'center', padding: 50 }}>
                        {status === 'initializing' && <h3>Connecting to WhatsApp Server...</h3>}
                        {status === 'disconnected' && <h3>Disconnected. Waiting for server to restart...</h3>}
                        {status === 'qr_ready' && qrCode && (
                            <div>
                                <h2 style={{ marginBottom: 20 }}>Scan QR Code</h2>
                                <img src={qrCode} alt="WhatsApp QR" style={{ width: 250, height: 250, border: '1px solid #ddd' }} />
                                <p style={{ color: 'var(--text-muted)', marginTop: 20 }}>
                                    Open WhatsApp on your phone {'>'} Menu {'>'} Linked Devices {'>'} Link a Device
                                </p>
                            </div>
                        )}
                        {!qrCode && status !== 'initializing' && <p>Please wait...</p>}
                    </div>
                ) : (
                    <div className="admin-grid" style={{ gridTemplateColumns: '1fr 350px' }}>

                        {/* LEFT: SELECTION LIST */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
                            {/* Toolbar */}
                            <div style={{ display: 'flex', gap: 10, paddingBottom: 15, borderBottom: '1px solid #eee', flexWrap: 'wrap' }}>
                                <select
                                    className="input-field"
                                    style={{ width: 150 }}
                                    value={filterClass}
                                    onChange={e => setFilterClass(e.target.value)}
                                >
                                    {classes.map(c => <option key={c} value={c}>Class: {c}</option>)}
                                </select>
                                <input
                                    className="input-field"
                                    placeholder="Search Name..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{ width: 150 }}
                                />
                                <div style={{ flex: 1 }}></div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>
                                    {selectedIds.length} selected / {filteredStudents.length} shown
                                </div>
                            </div>

                            {/* Table */}
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                    <thead style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '2px solid #eee', zIndex: 1 }}>
                                        <tr>
                                            <th style={{ padding: 10, width: 40, cursor: 'pointer' }} onClick={handleSelectAll}>
                                                {selectedIds.length > 0 && selectedIds.length === filteredStudents.length ?
                                                    <CheckSquare size={18} color="var(--primary)" /> :
                                                    <Square size={18} color="#ccc" />
                                                }
                                            </th>
                                            <th style={{ textAlign: 'left', padding: 10 }}>Student Name</th>
                                            <th style={{ textAlign: 'left', padding: 10 }}>Class</th>
                                            <th style={{ textAlign: 'left', padding: 10 }}>Phone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map(s => {
                                            const isSelected = selectedIds.includes(s.id);
                                            return (
                                                <tr key={s.id}
                                                    onClick={() => toggleSelect(s.id)}
                                                    style={{
                                                        background: isSelected ? '#F0F9FF' : 'transparent',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid #f5f5f5'
                                                    }}
                                                >
                                                    <td style={{ padding: 10, textAlign: 'center' }}>
                                                        {isSelected ?
                                                            <CheckSquare size={18} color="var(--primary)" /> :
                                                            <Square size={18} color="#ddd" />
                                                        }
                                                    </td>
                                                    <td style={{ padding: 10, fontWeight: 500 }}>{s.firstName} {s.lastName}</td>
                                                    <td style={{ padding: 10, color: 'var(--text-muted)' }}>{s.class?.name || '-'}</td>
                                                    <td style={{ padding: 10, color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                                                        {s.phoneNumber || <span style={{ color: 'red' }}>Missing</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredStudents.length === 0 && (
                                            <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center' }}>No students found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* RIGHT: COMPOSER */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="card">
                                <h3>Compose Message</h3>
                                <textarea
                                    className="input-field"
                                    rows={8}
                                    placeholder="Type your message here... (e.g. Dear Parent, fees are pending...)"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    style={{ width: '100%', resize: 'vertical', marginBottom: 15 }}
                                />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        Targeting: <b>{selectedIds.length}</b> recipients
                                    </div>
                                    <button
                                        className="btn-primary"
                                        onClick={handleSend}
                                        disabled={sending || selectedIds.length === 0}
                                        style={{ background: '#25D366' }}
                                    >
                                        {sending ? 'Sending...' : <><Send size={16} /> Send Now</>}
                                    </button>
                                </div>
                            </div>

                            {/* Logs */}
                            {logs && (
                                <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
                                    <h4>Results</h4>
                                    <div style={{ marginBottom: 10 }}>
                                        <span style={{ color: 'green', marginRight: 10 }}>✅ {logs.stats.sent} Sent</span>
                                        <span style={{ color: 'red' }}>❌ {logs.stats.failed} Failed</span>
                                    </div>
                                    <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {logs.details.failed.map((f, i) => (
                                            <div key={i} style={{ color: '#DC2626' }}>
                                                • {f.name}: {f.error}
                                            </div>
                                        ))}
                                        {logs.details.success.map((s, i) => (
                                            <div key={i} style={{ color: '#059669' }}>
                                                • {s} (Sent)
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </AdminLayout>
        </ProtectedRoute>
    );
}
