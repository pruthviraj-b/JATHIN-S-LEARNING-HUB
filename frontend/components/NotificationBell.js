import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { apiCall } from '../lib/api';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNotifications();
        // Refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await apiCall('/notifications');
            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.read).length || 0);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await apiCall(`/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const markAllRead = async () => {
        try {
            await apiCall('/notifications/mark-all-read', { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: 8,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <Bell size={20} color="var(--text-main)" />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: '#DC2626',
                        color: 'white',
                        borderRadius: '50%',
                        width: 16,
                        height: 16,
                        fontSize: 10,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div
                        onClick={() => setShowDropdown(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 50
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '120%',
                        right: 0,
                        width: 360,
                        maxWidth: '90vw',
                        background: 'white',
                        borderRadius: 12,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        zIndex: 51,
                        maxHeight: 400,
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid #e5e5e5'
                    }}>
                        <div style={{
                            padding: '14px 16px',
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Notifications</h3>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--primary)',
                                            fontSize: 12,
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowDropdown(false)}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                    <X size={18} color="#999" />
                                </button>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{
                                    padding: 40,
                                    textAlign: 'center',
                                    color: '#999',
                                    fontSize: 13
                                }}>
                                    <Bell size={32} color="#ddd" style={{ marginBottom: 10 }} />
                                    <div>No notifications yet</div>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => !notif.read && markAsRead(notif.id)}
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #f5f5f5',
                                            cursor: notif.read ? 'default' : 'pointer',
                                            background: notif.read ? 'white' : '#F0F9FF',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => !notif.read && (e.currentTarget.style.background = '#E0F2FE')}
                                        onMouseLeave={(e) => !notif.read && (e.currentTarget.style.background = '#F0F9FF')}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <div style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: '#1e293b',
                                                flex: 1
                                            }}>
                                                {notif.title}
                                            </div>
                                            {!notif.read && (
                                                <div style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    background: '#3B82F6',
                                                    marginLeft: 8,
                                                    flexShrink: 0
                                                }} />
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: 12,
                                            color: '#64748b',
                                            marginBottom: 4,
                                            lineHeight: 1.5
                                        }}>
                                            {notif.message}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                            {new Date(notif.createdAt).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
