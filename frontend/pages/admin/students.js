import { getProxiedImageUrl } from '../../lib/imageUrl'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import AdminLayout from '../../components/AdminLayout'
import StudentProfileImage from '../../components/StudentProfileImage'
import ImageCropModal from '../../components/ImageCropModal'
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
    profileUrl: '', active: true, classLevel: 1, teamId: '', phoneNumber: '',
    motherName: '', fatherName: '', parentPhone: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Credentials & Modals
  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [starModal, setStarModal] = useState(null)
  const [starData, setStarData] = useState({ reason: 'Excellent Performance', points: 1 })
  const [editingId, setEditingId] = useState(null)

  // Bulk Star Awarding
  const [selectedStudents, setSelectedStudents] = useState([])
  const [bulkStarMode, setBulkStarMode] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkStarData, setBulkStarData] = useState({ reason: 'Excellent Performance', points: 1 })

  const [uploading, setUploading] = useState(false)
  const [cropImage, setCropImage] = useState(null) // Image to crop
  const [showCropper, setShowCropper] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

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

  const awardBulkStars = async () => {
    if (!bulkStarData.reason || selectedStudents.length === 0) {
      alert('Please select students and provide a reason')
      return
    }
    try {
      await Promise.all(selectedStudents.map(studentId =>
        apiCall('/stars', { method: 'POST', body: JSON.stringify({ studentId, reason: bulkStarData.reason, points: Number(bulkStarData.points) }) })
      ))
      setShowBulkModal(false)
      setSelectedStudents([])
      setBulkStarMode(false)
      alert(`Successfully awarded ${bulkStarData.points} points to ${selectedStudents.length} students!`)
      await fetchData()
    } catch (err) { alert(err.message) }
  }

  const toggleSelectStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id))
    }
  }

  const handleDelete = async (studentId) => {
    if (!confirm('Prepare to delete student?')) return
    try {
      await apiCall(`/students/${studentId}`, { method: 'DELETE' })
      await fetchData()
    } catch (err) { setError(err.message) }
  }

  const handleCroppedImage = async (croppedFile) => {
    setShowCropper(false);
    setCropImage(null);

    try {
      setUploading(true);
      const data = new FormData();
      data.append('file', croppedFile, 'profile.jpg');

      const res = await apiCall('/upload', { method: 'POST', body: data });
      if (res?.url) {
        setFormData(prev => ({ ...prev, profileUrl: res.url }));
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      alert('Upload Failed: ' + (err.message || 'Unknown Error'));
    } finally {
      setUploading(false);
    }
  };

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
          <div className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24 }}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.8, color: 'var(--text-muted)', fontWeight: 500 }}>New This Month</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', marginTop: 4 }}>+12</div>
            </div>
            <div style={{ background: 'var(--secondary)', padding: 10, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(212, 175, 55, 0.3)' }}>
              <TrendingUp size={24} color="white" />
            </div>
          </div>
        </div>

        {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 15, borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>⚠️ {error}</div>}

        {/* Action Bar */}
        {!showForm && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '10px 20px', borderRadius: 30, boxShadow: 'var(--shadow-sm)', width: 300, border: '1px solid #E4E4E7' }}>
              <Search size={18} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', marginLeft: 10, width: '100%', fontSize: 14, color: 'black' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {!bulkStarMode && (
                <button
                  onClick={() => { setBulkStarMode(true); setSelectedStudents([]) }}
                  className="btn btn-outline"
                  style={{ borderRadius: 30, padding: '12px 24px', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}
                >
                  <StarIcon size={16} style={{ marginRight: 8 }} />
                  Bulk Award Stars
                </button>
              )}
              {bulkStarMode && (
                <>
                  <button
                    onClick={toggleSelectAll}
                    className="btn btn-outline"
                    style={{ borderRadius: 30, padding: '12px 24px' }}
                  >
                    {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={() => { setShowBulkModal(true) }}
                    className="btn btn-primary"
                    style={{ borderRadius: 30, padding: '12px 24px' }}
                    disabled={selectedStudents.length === 0}
                  >
                    Award to {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                  </button>
                  <button
                    onClick={() => { setBulkStarMode(false); setSelectedStudents([]) }}
                    className="btn btn-outline"
                    style={{ borderRadius: 30, padding: '12px 24px', borderColor: '#DC2626', color: '#DC2626' }}
                  >
                    Cancel
                  </button>
                </>
              )}
              {!bulkStarMode && (
                <button onClick={() => { setEditingId(null); setFormData(initialFormState); setShowForm(true) }} className="btn btn-primary" style={{ borderRadius: 30, padding: '12px 24px' }}>
                  <Plus size={18} /> Add Student
                </button>
              )}
            </div>
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
              <div className="responsive-grid">
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
                      <label className="btn btn-secondary" style={{ whiteSpace: 'nowrap', opacity: uploading ? 0.7 : 1, position: 'relative' }}>
                        {uploading ? 'Processing...' : 'Upload'}
                        {/* VERSION INDICATOR FOR DEBUGGING */}
                        <span style={{ position: 'absolute', bottom: -15, right: 0, fontSize: 9, color: '#A1A1AA' }}>v1.3</span>

                        <input type="file" accept="image/*" hidden onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          e.target.value = '';

                          // Show cropper
                          const reader = new FileReader();
                          reader.onload = () => {
                            setCropImage(reader.result);
                            setShowCropper(true);
                          };
                          reader.readAsDataURL(file);
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

                  <div style={{ gridColumn: 'span 2', marginTop: 10 }}><h4 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: 1 }}>Parent Info</h4></div>
                  <div><label style={labelStyle}>Mother Name</label><input className="input-field" value={formData.motherName || ''} onChange={e => setFormData({ ...formData, motherName: e.target.value })} /></div>
                  <div><label style={labelStyle}>Father Name</label><input className="input-field" value={formData.fatherName || ''} onChange={e => setFormData({ ...formData, fatherName: e.target.value })} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Parent Phone</label><input className="input-field" value={formData.parentPhone || ''} onChange={e => setFormData({ ...formData, parentPhone: e.target.value })} /></div>

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

            {/* Desktop Table */}
            <table className="desktop-only">
              <thead>
                <tr>
                  {bulkStarMode && <th style={{ width: 40 }}></th>}
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
                  <tr key={s.id} style={{
                    borderBottom: '1px solid #27272A',
                    background: selectedStudents.includes(s.id) ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                    transition: 'background 0.2s'
                  }}>
                    {bulkStarMode && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(s.id)}
                          onChange={() => toggleSelectStudent(s.id)}
                          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--secondary)' }}
                        />
                      </td>
                    )}
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
                        background: s.active ? '#ECFDF5' : '#FEF2F2',
                        color: s.active ? '#059669' : '#DC2626',
                        border: s.active ? '1px solid #A7F3D0' : '1px solid #FECACA',
                        display: 'inline-flex', alignItems: 'center', gap: 5
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.active ? '#059669' : '#DC2626' }}></div>
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

            {/* Mobile Card List View */}
            <div className="mobile-only mobile-card-list">
              {filteredStudents.map((s, idx) => (
                <div key={s.id} className="mobile-card">
                  <div className="mobile-card-header">
                    <StudentProfileImage student={s} size={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>{s.firstName} {s.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.user?.email}</div>
                    </div>
                    <button onClick={() => setStarModal(s.id)} style={{ ...iconBtnStyle, background: 'var(--secondary)', color: 'black', padding: 8 }}>
                      <StarIcon size={16} fill="black" />
                    </button>
                  </div>

                  <div className="mobile-card-row">
                    <span className="mobile-label">Class</span>
                    <span className="mobile-value">Year {s.classLevel}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-label">Points</span>
                    <span className="mobile-value">{s.totalPoints || 0} ⭐</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-label">Status</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: s.active ? '#059669' : '#DC2626',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.active ? '#059669' : '#DC2626' }}></div>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid #27272A' }}>
                    <button onClick={() => handleEdit(s)} className="btn btn-secondary" style={{ flex: 1, height: 36 }}>Edit</button>
                    <button onClick={() => toggleActive(s.id, s.active)} className="btn btn-outline" style={{ flex: 1, height: 36, color: s.active ? '#DC2626' : '#059669', borderColor: s.active ? '#DC2626' : '#059669' }}>
                      {s.active ? 'Disable' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredStudents.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No students found matching "{searchQuery}"</div>}
          </div>
        )}

        {/* --- Modals --- */}

        {/* Star Modal */}
        {starModal && (() => {
          const student = students.find(s => s.id === starModal)
          return (
            <div style={modalOverlayStyle}>
              <div className="card" style={{ width: 420, transform: 'translateY(0)' }}>
                <h3 style={{ fontSize: 20, marginBottom: 5 }}>Award Points</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Recognize student achievement!</p>

                {/* Student Info */}
                {student && (
                  <div style={{ background: '#18181B', padding: 15, borderRadius: 12, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <StudentProfileImage student={student} size={50} />
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{student.firstName} {student.lastName}</div>
                        <div style={{ fontSize: 13, color: '#A1A1AA' }}>{student.user?.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                      {student.motherName && (
                        <div>
                          <div style={{ color: '#52525B', fontSize: 11, marginBottom: 2 }}>Mother</div>
                          <div style={{ color: '#E4E4E7', fontWeight: 600 }}>{student.motherName}</div>
                        </div>
                      )}
                      {student.fatherName && (
                        <div>
                          <div style={{ color: '#52525B', fontSize: 11, marginBottom: 2 }}>Father</div>
                          <div style={{ color: '#E4E4E7', fontWeight: 600 }}>{student.fatherName}</div>
                        </div>
                      )}
                      {student.parentPhone && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ color: '#52525B', fontSize: 11, marginBottom: 2 }}>Parent Phone</div>
                          <div style={{ color: '#E4E4E7', fontWeight: 600 }}>{student.parentPhone}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
          )
        })()}

        {/* Bulk Star Modal */}
        {showBulkModal && (
          <div style={modalOverlayStyle}>
            <div className="card" style={{ width: 450, transform: 'translateY(0)' }}>
              <h3 style={{ fontSize: 20, marginBottom: 5 }}>Bulk Award Points</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Award points to {selectedStudents.length} selected student{selectedStudents.length !== 1 ? 's' : ''}</p>

              {/* Selected Students Preview */}
              <div style={{ background: '#18181B', padding: 15, borderRadius: 12, marginBottom: 20, maxHeight: 200, overflowY: 'auto' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#52525B', marginBottom: 10, textTransform: 'uppercase' }}>Selected Students</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedStudents.map(id => {
                    const student = students.find(s => s.id === id)
                    return student ? (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: '#27272A', borderRadius: 8 }}>
                        <StudentProfileImage student={student} size={32} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{student.firstName} {student.lastName}</div>
                          <div style={{ fontSize: 12, color: '#A1A1AA' }}>Current: {student.totalPoints || 0} points</div>
                        </div>
                      </div>
                    ) : null
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Reason</label>
                <input className="input-field" value={bulkStarData.reason} onChange={e => setBulkStarData({ ...bulkStarData, reason: e.target.value })} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Points (to each student)</label>
                <input type="number" className="input-field" value={bulkStarData.points} onChange={e => setBulkStarData({ ...bulkStarData, points: e.target.value })} />
              </div>

              <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 13, color: '#D4AF37' }}>
                ⭐ Total points to be awarded: {selectedStudents.length} × {bulkStarData.points} = {selectedStudents.length * Number(bulkStarData.points)} points
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setShowBulkModal(false)} className="btn btn-outline">Cancel</button>
                <button onClick={awardBulkStars} className="btn btn-primary">Award Stars</button>
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

      {/* Image Crop Modal */}
      {showCropper && cropImage && (
        <ImageCropModal
          imageUrl={cropImage}
          onComplete={handleCroppedImage}
          onCancel={() => {
            setShowCropper(false);
            setCropImage(null);
          }}
        />
      )}
    </ProtectedRoute>
  )
}

// Sub-components & Styles

const StatsCard = ({ icon: Icon, label, value }) => (
  <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 15, border: 'none', boxShadow: 'var(--shadow-md)' }}>
    <div className="stats-card-icon" style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #000 0%, #333 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
      <Icon size={24} color="white" />
    </div>
    <div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</div>
      <div className="stats-card-value" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{value}</div>
    </div>
  </div>
)

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 0.5 }
const iconBtnStyle = { background: 'transparent', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 8, transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }

