import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'
import { LayoutDashboard, Users, BookOpen, Calendar, ClipboardCheck, Star, Users2, Bell, FolderOpen, LogOut, Menu, X } from 'lucide-react'

export default function AdminLayout({ children }) {
    const router = useRouter()
    const { logout } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const navItems = [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Attendance', href: '/admin/attendance', icon: ClipboardCheck },
        { label: 'Students', href: '/admin/students', icon: Users },
        { label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
        { label: 'Classes', href: '/admin/classes', icon: Calendar },
        { label: 'Tests', href: '/admin/tests', icon: ClipboardCheck },
        { label: 'Stars', href: '/admin/stars', icon: Star },
        { label: 'Teams', href: '/admin/teams', icon: Users2 },
        { label: 'Notices', href: '/admin/announcements', icon: Bell },
        { label: 'Materials', href: '/admin/materials', icon: FolderOpen },
    ]

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: 'var(--bg-body)' }}>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 40 }}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`sidebar ${sidebarOpen ? 'open' : ''}`}
                style={{
                    width: 260,
                    background: '#09090b',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                    height: '100vh',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 50,
                    transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRight: '1px solid #1f1f23'
                }}
            >
                {/* Desktop Styles Injection */}
                <style jsx global>{`
                    @media (min-width: 1024px) {
                        aside { transform: translateX(0) !important; position: sticky !important; }
                    }
                `}</style>

                <div style={{ padding: '24px', borderBottom: '1px solid #1f1f23', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src="/logo.png" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: 15, color: '#fff', fontWeight: '700', lineHeight: 1 }}>JATHIN'S</h2>
                            <span style={{ color: '#3b82f6', fontSize: 11, fontWeight: '500', letterSpacing: '0.5px' }}>LEARNING HUB</span>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} className="lg:hidden">
                        <X size={24} />
                    </button>
                    <style>{`@media(min-width:1024px){ .lg\\:hidden { display: none !important; } }`}</style>
                </div>

                <nav style={{ flex: 1, padding: '20px 10px', overflowY: 'auto' }}>
                    {navItems.map(item => {
                        const isActive = router.pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={() => setSidebarOpen(false)}>
                                <div style={{
                                    padding: '12px 16px',
                                    marginBottom: 4,
                                    borderRadius: 12,
                                    color: isActive ? '#fff' : '#a1a1aa',
                                    background: isActive ? 'linear-gradient(90deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.05) 100%)' : 'transparent',
                                    border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    gap: 12
                                }}>
                                    <Icon size={18} color={isActive ? '#60a5fa' : '#a1a1aa'} strokeWidth={2} />
                                    {item.label}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                <div style={{ padding: 20, borderTop: '1px solid #1f1f23' }}>
                    <button
                        onClick={logout}
                        style={{
                            width: '100%',
                            background: 'rgba(239,68,68,0.1)',
                            color: '#f87171',
                            border: '1px solid rgba(239,68,68,0.2)',
                            padding: '12px',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                        }}
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', width: '100%' }}>
                <header className="glass-panel" style={{
                    height: 70, margin: '15px', borderRadius: 16,
                    display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between',
                    position: 'sticky', top: 15, zIndex: 40
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#18181b', padding: 0 }}
                            className="lg:hidden"
                        >
                            <Menu size={24} />
                        </button>

                        <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="breadcrumb-hidden" style={{ display: 'none' }}>Admin / </span>
                            <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 16 }}>{navItems.find(i => i.href === router.pathname)?.label || 'Overview'}</span>
                        </div>
                        <style>{`@media(min-width:768px){ .breadcrumb-hidden { display: inline !important; } }`}</style>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13, boxShadow: '0 4px 10px rgba(59,130,246,0.3)' }}>
                            A
                        </div>
                    </div>
                </header>

                <main style={{ padding: '15px 15px 40px 15px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                    {children}
                </main>
            </div>

        </div>
    )
}
