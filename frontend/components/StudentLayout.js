import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'
import { useState, useEffect } from 'react'
import { LayoutDashboard, CheckSquare, Book, FileText, Award, User, Menu, X, LogOut, MessageCircle, StickyNote } from 'lucide-react'
import NotificationBell from './NotificationBell'
import ChatSlider from './ChatSlider'

export default function StudentLayout({ children }) {
    const router = useRouter()
    const { logout, user } = useAuth()

    const studentName = user?.student?.firstName || 'Student'

    const navItems = [
        { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
        { label: 'Attendance', href: '/student/attendance', icon: CheckSquare },
        { label: 'My Tests', href: '/student/tests', icon: FileText },
        { label: 'Materials', href: '/student/materials', icon: Book },
        { label: 'Leaderboard', href: '/student/leaderboard', icon: Award },
        { label: 'Keep Notes', href: '/student/notes', icon: StickyNote },
        { label: 'Profile', href: '/student/profile', icon: User },
    ]

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [chatOpen, setChatOpen] = useState(false)

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-body)' }}>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 40 }}
                />
            )}

            {/* Premium Sidebar: Navy & Gold */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <style jsx global>{`
                    @media (min-width: 769px) {
                        aside { transform: translateX(0) !important; position: sticky !important; }
                    }
                `}</style>

                <div style={{ padding: '24px', borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src="/logo.png" alt="Logo" style={{ width: 30, height: 30, objectFit: 'contain' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: 16, color: 'var(--primary)', fontWeight: '700' }}>JATHIN'S</h2>
                            <p style={{ margin: 0, fontSize: 10, color: 'var(--secondary)', letterSpacing: 1 }}>LEARNING HUB</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} className="md:hidden">
                        <X size={24} />
                    </button>
                </div>

                <nav style={{ flex: 1, padding: '20px 10px' }}>
                    {navItems.map(item => {
                        const isActive = router.pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={() => setSidebarOpen(false)}>
                                <div style={{
                                    padding: '12px 16px',
                                    marginBottom: 4,
                                    borderRadius: 12,
                                    color: isActive ? 'var(--secondary)' : 'var(--text-muted)',
                                    background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent', // Gold tint
                                    border: '1px solid transparent', // Remove blue border
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    gap: 12
                                }}>
                                    <Icon size={18} color={isActive ? 'var(--secondary)' : 'var(--text-muted)'} strokeWidth={isActive ? 2.5 : 2} />
                                    {item.label}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                <div style={{ padding: 20, borderTop: '1px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <a
                        href="https://wa.me/919740634537"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', background: 'var(--secondary)', color: 'black', // Gold Button
                            borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700
                        }}
                    >
                        <MessageCircle size={18} /> Help / Support
                    </a>

                    <button
                        onClick={logout}
                        style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.05)',
                            color: 'var(--text-muted)',
                            border: 'none',
                            padding: '12px',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontSize: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'color 0.2s'
                        }}
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>

                {/* Install Prompt Banner */}
                <InstallPrompt />

                <header className="glass-panel" style={{
                    height: 64, margin: '15px 15px 0 15px', borderRadius: 12,
                    display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between',
                    position: 'sticky', top: 10, zIndex: 40,
                    background: 'var(--bg-card)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', padding: 0 }}
                            className="md:hidden" // Add class to hide on desktop if using Tailwind, otherwise use media query
                        >
                            <Menu size={24} />
                        </button>
                        {/* CSS hack for md:hidden since we don't have full tailwind here */}
                        <style>{`@media(min-width:769px){ .md\\:hidden { display: none !important; } }`}</style>

                        <div>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Welcome back,</span>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>{studentName}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <NotificationBell />
                        {/* Chat Button */}
                        <button
                            onClick={() => setChatOpen(true)}
                            style={{
                                background: '#D4AF37',
                                border: 'none',
                                borderRadius: '50%',
                                width: 38,
                                height: 38,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <MessageCircle size={20} color="white" />
                        </button>
                        {user?.student?.profileUrl ? (
                            <img
                                src={user.student.profileUrl}
                                alt="User"
                                style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                            />
                        ) : (
                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' }}>
                                {studentName.charAt(0)}
                            </div>
                        )}
                    </div>
                </header>

                <main style={{ padding: '20px 15px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
                    {children}
                </main>
            </div>

            {/* Chat Slider */}
            <ChatSlider
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
                studentId={user?.studentId}
                isAdmin={false}
            />
        </div>
    )
}

function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        // PWA Install Prompt Listener
        const handler = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);

            // Check if already installed or dismissed
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            const dismissed = localStorage.getItem('installPromptDismissed');

            if (!isStandalone && !dismissed) {
                setShow(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, discard it
        setDeferredPrompt(null);
        setShow(false);
    };

    if (!show) return null;

    return (
        <div style={{
            background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
            color: 'white',
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 14, fontWeight: 500,
            boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
            zIndex: 100,
            position: 'sticky', top: 0,
            cursor: 'pointer'
        }} onClick={handleInstallClick}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>📲 <strong>Install App:</strong> Add to Home Screen for easier access!</span>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Don't trigger install
                    setShow(false);
                    localStorage.setItem('installPromptDismissed', 'true');
                }}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <X size={16} />
            </button>
        </div>
    )
}
