import { getProxiedImageUrl } from '../../lib/imageUrl'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import StudentProfileImage from '../../components/StudentProfileImage'
import { Search, Filter, Plus, MoreHorizontal, TrendingUp, Users, UserCheck, Star as StarIcon } from 'lucide-react'

export default function ManageStudents() {
  const [students, setStudents] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', dob: '',
    profileUrl: '', active: true, classLevel: 1, teamId: '', phoneNumber: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Credentials & Modals
  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [starModal, setStarModal] = useState(null)
  const [starData, setStarData] = useState({ reason: 'Excellent Performance', points: 1 })
  const [editingId, setEditingId] = useState(null)

  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter() // Import useRouter if not imported, wait, students.js might not have it imported top level

  useEffect(() => {
    if (router.query.search) {
      setSearchQuery(router.query.search)
    }
  }, [router.query])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [sData, tData] = await Promise.all([
        apiCall('/students'),
        apiCall('/teams').catch(() => [])
      ])
      setStudents(sData)
      setTeams(tData)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (editingId) {
        await apiCall(`/students/${editingId}`, { method: 'PUT', body: JSON.stringify(formData) })
        setEditingId(null)
      } else {
        await apiCall('/students', { method: 'POST', body: JSON.stringify(formData) })
        setCreatedCredentials({ email: formData.email, password: formData.password })
      }
      setFormData(initialFormState)
      setShowForm(false)
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (student) => {
    setEditingId(student.id)
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName || '',
      email: student.user?.email || '',
      password: '',
      dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
      profileUrl: student.profileUrl || '',
      active: student.active,
      classLevel: student.classLevel || 1,
      teamId: student.teamId || '',
      phoneNumber: student.phoneNumber || ''
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleActive = async (studentId, currentStatus) => {
    try {
      await apiCall(`/students/${studentId}/activate`, { method: 'POST', body: JSON.stringify({ active: !currentStatus }) })
      await fetchData()
    } catch (err) { setError(err.message) }
  }

  const awardStar = async (studentId) => {
    if (!starData.reason) return
    try {
      await apiCall('/stars', { method: 'POST', body: JSON.stringify({ studentId, reason: starData.reason, points: Number(starData.points) }) })
      setStarModal(null)
      await fetchData()
    } catch (err) { alert(err.message) }
  }

  const handleDelete = async (studentId) => {
    if (!confirm('Prepare to delete student?')) return
    try {
      await apiCall(`/students/${studentId}`, { method: 'DELETE' })
      await fetchData()
    } catch (err) { setError(err.message) }
  }

  const initialFormState = { firstName: '', lastName: '', email: '', password: '', dob: '', profileUrl: '', active: true, classLevel: 1, teamId: '', phoneNumber: '' }

  // Stats Calculation
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.active).length
  const totalStars = students.reduce((acc, s) => acc + (s.totalPoints || 0), 0)

  // Filtering
  const filteredStudents = students.filter(s =>
    s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>

        {/* Stats Grid */}
        {/* Stats Grid */}
        <div className="stats-grid">
          <StatsCard icon={Users} label="Total Students" value={totalStudents} />
          <StatsCard icon={UserCheck} label="Active Students" value={activeStudents} />
          <StatsCard icon={StarIcon} label="Total Stars Awarded" value={totalStars} />
          <div className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, background: '#18181B' }}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#A1A1AA', fontWeight: 500 }}>New This Month</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'white', marginTop: 4 }}>+12</div>
            </div>
            <div style={{ background: '#27272A', padding: 10, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} color="white" />
            </div>
          </div>
        </div>

        {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 15, borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>⚠️ {error}</div>}

        {/* Action Bar */}
        {!showForm && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '10px 20px', borderRadius: 30, boxShadow: 'var(--shadow-sm)', width: 300 }}>
              <Search size={18} color="var(--secondary-grey)" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', marginLeft: 10, width: '100%', fontSize: 14 }}
              />
            </div>
            <button onClick={() => { setEditingId(null); setFormData(initialFormState); setShowForm(true) }} className="btn btn-primary" style={{ borderRadius: 30, padding: '12px 24px' }}>
              <Plus size={18} /> Add Student
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {showForm ? (
          <div className="card animate-fade-in" style={{ marginBottom: 30, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #F4F7FE', paddingBottom: 15 }}>
              <h3 style={{ fontSize: 18, margin: 0 }}>{editingId ? 'Edit Profile' : 'New Student Registration'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--secondary-grey)', cursor: 'pointer' }}>Close ✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                {/* Avatar Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15, padding: 20, background: '#F9F9FC', borderRadius: 20 }}>
                  <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: 'var(--shadow-md)' }}>
                    {formData.profileUrl ? (
                      <img src={getProxiedImageUrl(formData.profileUrl)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#E0E5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>👤</div>
                    )}
                  </div>

                  <div style={{ width: '100%' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: 'var(--text-muted)' }}>PROFILE IMAGE</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input type="text" placeholder="Paste URL..." value={formData.profileUrl} onChange={e => setFormData({ ...formData, profileUrl: e.target.value })} className="input-field" />
                      <label className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                        Upload
                        <input type="file" hidden onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          try {
                            const data = new FormData(); data.append('file', file);
                            const res = await apiCall('/upload', { method: 'POST', body: data });
                            setFormData(prev => ({ ...prev, profileUrl: res.url }));
                          } catch (err) { alert(err.message) }
                        }} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ gridColumn: 'span 2' }}><h4 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: 1 }}>Basic Info</h4></div>
                  <div><label style={labelStyle}>First Name</label><input required className="input-field" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} /></div>
                  <div><label style={labelStyle}>Last Name</label><input className="input-field" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} /></div>
                  <div><label style={labelStyle}>Date of Birth</label><input type="date" className="input-field" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} /></div>
                  <div><label style={labelStyle}>Phone</label><input className="input-field" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} /></div>

                  <div style={{ gridColumn: 'span 2', marginTop: 10 }}><h4 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: 1 }}>Academic</h4></div>
                  <div>
                    <label style={labelStyle}>Class</label>
                    <select className="input-field" value={formData.classLevel} onChange={e => setFormData({ ...formData, classLevel: Number(e.target.value) })}>
                      {[...Array(12)].map((_, i) => <option key={i} value={i + 1}>Class {i + 1}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Team</label>
                    <select className="input-field" value={formData.teamId} onChange={e => setFormData({ ...formData, teamId: e.target.value })}>
                      <option value="">No Team</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2', marginTop: 10 }}><h4 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: 1 }}>Account</h4></div>
                  <div><label style={labelStyle}>Email</label><input type="email" required className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                  <div><label style={labelStyle}>{editingId ? 'New Password' : 'Password'}</label><input type="password" required={!editingId} className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 15, marginTop: 30, paddingTop: 20, borderTop: '1px solid #F4F7FE' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Student')}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Student List - Card Table Style */
          <div className="card table-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '0 5px' }}>
              <h3 style={{ fontSize: 20, margin: 0 }}>All Students</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: 30, fontSize: 12 }}>Filter <Filter size={12} /></button>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Class</th>
                  <th>Points</th>
                  <th>Progress</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <StudentProfileImage student={s} size={40} className="shadow-sm" />
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>{s.firstName} {s.lastName}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: s.active ? '#18181B' : '#000000',
                        color: s.active ? '#FFFFFF' : '#71717A',
                        border: s.active ? '1px solid #FFFFFF' : '1px solid #27272A',
                        display: 'inline-flex', alignItems: 'center', gap: 5
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.active ? '#FFFFFF' : '#52525B' }}></div>
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>Class {s.classLevel}</td>
                    <td style={{ fontWeight: 700 }}>{s.totalPoints || 0} ⭐</td>
                    <td style={{ width: 150 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 8, background: '#27272A', borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min((s.totalPoints || 0) * 2, 100)}%`, height: '100%', background: 'white', borderRadius: 10 }}></div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{Math.min((s.totalPoints || 0) * 2, 100)}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 5 }}>
                        <button title="Award Star" onClick={() => setStarModal(s.id)} style={iconBtnStyle}><StarIcon size={16} color="white" /></button>
                        <button title="Edit" onClick={() => handleEdit(s)} style={iconBtnStyle}><MoreHorizontal size={16} color="#A1A1AA" /></button>
                        <button title="Toggle Status" onClick={() => toggleActive(s.id, s.active)} style={iconBtnStyle}>
                          {s.active ? <UserCheck size={16} color="white" /> : <Users size={16} color="#52525B" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No students found matching "{searchQuery}"</div>}
          </div>
        )}

        {/* --- Modals --- */}

        {/* Star Modal */}
        {starModal && (
          <div style={modalOverlayStyle}>
            <div className="card" style={{ width: 350, transform: 'translateY(0)' }}>
              <h3 style={{ fontSize: 20, marginBottom: 5 }}>Award Points</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Recognize student achievement!</p>

              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Reason</label>
                <input className="input-field" value={starData.reason} onChange={e => setStarData({ ...starData, reason: e.target.value })} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Points</label>
                <input type="number" className="input-field" value={starData.points} onChange={e => setStarData({ ...starData, points: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setStarModal(null)} className="btn btn-outline">Cancel</button>
                <button onClick={() => awardStar(starModal)} className="btn btn-primary">Award Star</button>
              </div>
            </div>
          </div>
        )}

        {/* Credentials Modal */}
        {createdCredentials && (
          <div style={{ ...modalOverlayStyle, zIndex: 100 }}>
            <div className="card" style={{ width: 400, textAlign: 'center', padding: 40 }}>
              <div style={{ width: 60, height: 60, background: 'rgba(5, 205, 153, 0.2)', borderRadius: '50%', color: '#05CD99', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <UserCheck size={32} />
              </div>
              <h2 style={{ fontSize: 24, marginBottom: 10 }}>Account Created!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>Share these details securely.</p>

              <div style={{ background: '#F4F7FE', padding: 20, borderRadius: 16, textAlign: 'left', marginBottom: 25 }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>EMAIL</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{createdCredentials.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>PASSWORD</div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>{createdCredentials.password}</div>
                </div>
              </div>

              <button onClick={() => setCreatedCredentials(null)} className="btn btn-primary" style={{ width: '100%' }}>Done</button>
            </div>
          </div>
        )}

      </AdminLayout>
    </ProtectedRoute>
  )
}

// Sub-components & Styles

const StatsCard = ({ icon: Icon, label, value }) => (
  <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#18181B', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #27272A' }}>
      <Icon size={24} color="white" />
    </div>
    <div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{value}</div>
    </div>
  </div>
)

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 0.5 }
const iconBtnStyle = { background: 'transparent', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 8, transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }
