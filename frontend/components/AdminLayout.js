import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, Users, BookOpen, Calendar, ClipboardCheck, Star, Users2, Bell, FolderOpen, LogOut } from 'lucide-react'

export default function AdminLayout({ children }) {
    const router = useRouter()
    const { logout } = useAuth()

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

            {/* Sidebar */}
            <aside style={{ width: 260, background: '#000000', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src="/logo.png" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    <div>
                        <h2 style={{ margin: 0, fontSize: 15, color: '#fff', fontWeight: '700', lineHeight: 1 }}>JATHIN'S</h2>
                        <span style={{ color: '#3b82f6', fontSize: 11, fontWeight: '500', letterSpacing: '0.5px' }}>LEARNING HUB</span>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '20px 10px', overflowY: 'auto' }}>
                    {navItems.map(item => {
                        const isActive = router.pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    padding: '12px 16px',
                                    marginBottom: 4,
                                    borderRadius: 12,
                                    color: isActive ? '#fff' : '#94a3b8',
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
                                    <Icon size={18} color={isActive ? '#60a5fa' : '#94a3b8'} strokeWidth={2} />
                                    {item.label}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
                <header className="glass-panel" style={{
                    height: 70, margin: '20px 20px 0 20px', borderRadius: 16,
                    display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between',
                    position: 'sticky', top: 20, zIndex: 40
                }}>
                    <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                        Admin Panel / <span style={{ color: '#0f172a', fontWeight: 700 }}>{navItems.find(i => i.href === router.pathname)?.label || 'Overview'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13, boxShadow: '0 4px 10px rgba(59,130,246,0.3)' }}>
                            A
                        </div>
                    </div>
                </header>

                <main style={{ padding: '30px 20px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                    {children}
                </main>
            </div>

        </div>
    )
}
