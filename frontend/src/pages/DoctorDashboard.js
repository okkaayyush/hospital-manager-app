import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PhotoUpload from '../components/PhotoUpload';
import API from '../api';

function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('appointments');
  const [form, setForm] = useState({ specialization:'', department:'', experience:'', fees:'', roomNumber:'', photo:'', availableDays:[], availableTimeSlots:[] });
  const [editAvailability, setEditAvailability] = useState({ availableDays:[], availableTimeSlots:[] });
  const [message, setMessage] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const slots = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];
  const statusColor = { pending:'#f59e0b', confirmed:'#10b981', cancelled:'#ef4444', completed:'#6366f1' };

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/doctors');
      const mine = res.data.find(d => d.user?._id === user.id || d.user?.id === user.id);
      if (mine) {
        setProfile(mine);
        setEditAvailability({ availableDays: mine.availableDays, availableTimeSlots: mine.availableTimeSlots });
        fetchAppointments(mine._id);
      }
    } catch (err) { console.log(err); }
  };

  const fetchAppointments = async (doctorId) => {
    try {
      const res = await API.get(`/appointments/doctor/${doctorId}`);
      setAppointments(res.data);
      setPendingCount(res.data.filter(a => a.status === 'pending').length);
    } catch (err) { console.log(err); }
  };

  const toggleItem = (arr, item) =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const createProfile = async (e) => {
    e.preventDefault();
    try {
      await API.post('/doctors', form);
      setMessage('Profile created! Waiting for admin approval.');
      fetchProfile();
    } catch (err) { setMessage(err.response?.data?.message || 'Failed'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/appointments/${id}/status`, { status });
      if (profile) fetchAppointments(profile._id);
    } catch (err) { console.log(err); }
  };

  const updateAvailability = async () => {
    try {
      await API.put(`/doctors/${profile._id}`, editAvailability);
      setMessage('Availability updated! Patients will see changes immediately.');
      fetchProfile();
    } catch (err) { setMessage('Failed to update availability'); }
  };

  const avatarUrl = (name, bg='2563eb') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=80`;

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div>
          <h2 style={s.logo}>🏥 MediBook</h2>
          <div style={s.sideProfile}>
            <img src={profile?.photo || avatarUrl(user.name)} alt={user.name}
              style={s.sideAvatar} onError={e=>e.target.src=avatarUrl(user.name)} />
            <p style={s.userInfo}>Dr. {user.name}</p>
            <p style={s.userRole}>Doctor</p>
          </div>
          <hr style={{borderColor:'#1e293b', margin:'20px 0'}}/>
          <button style={view==='appointments'?s.navActive:s.nav} onClick={()=>setView('appointments')}>
            📋 Appointments
            {pendingCount > 0 && <span style={s.badge}>{pendingCount}</span>}
          </button>
          <button style={view==='profile'?s.navActive:s.nav} onClick={()=>setView('profile')}>👤 My Profile</button>
        </div>
        <button style={s.logoutBtn} onClick={logout}>🚪 Logout</button>
      </div>

      {/* Main */}
      <div style={s.main}>
        {message && (
          <div style={s.toast}>
            {message}
            <button onClick={()=>setMessage('')} style={s.toastClose}>✕</button>
          </div>
        )}

        {/* Appointments */}
        {view === 'appointments' && (
          <div>
            <div style={s.pageHeader}>
              <h2 style={s.heading}>Appointments</h2>
              {pendingCount > 0 && <span style={s.alertBadge}>{pendingCount} pending</span>}
            </div>
            {!profile && (
              <div style={s.warning}>⚠️ Create your profile first, then ask admin to approve it.</div>
            )}
            {appointments.length === 0 && profile && (
              <div style={s.emptyState}>
                <p style={{fontSize:'40px',margin:0}}>📭</p>
                <p style={{color:'#475569',margin:'10px 0 0 0'}}>No appointments yet</p>
              </div>
            )}
            {appointments.map(apt => (
              <div key={apt._id} style={s.aptCard}>
                <div style={s.aptLeft}>
                  <img src={avatarUrl(apt.patient?.name, '0f766e')} alt="patient"
                    style={{width:'48px',height:'48px',borderRadius:'50%',marginRight:'15px'}} />
                  <div>
                    <h4 style={{margin:0,color:'#f1f5f9',fontSize:'15px'}}>{apt.patient?.name}</h4>
                    <p style={{margin:'4px 0',color:'#64748b',fontSize:'13px'}}>📅 {apt.date} &nbsp;⏰ {apt.timeSlot}</p>
                    {apt.symptoms && <p style={{margin:'4px 0',color:'#64748b',fontSize:'12px'}}>🤒 {apt.symptoms}</p>}
                  </div>
                </div>
                <div style={s.aptRight}>
                  <span style={{...s.statusBadge, background:statusColor[apt.status]+'22', color:statusColor[apt.status], border:`1px solid ${statusColor[apt.status]}44`}}>
                    {apt.status}
                  </span>
                  {apt.status === 'pending' && (
                    <div style={{display:'flex',gap:'8px'}}>
                      <button style={s.confirmBtn} onClick={()=>updateStatus(apt._id,'confirmed')}>✓ Confirm</button>
                      <button style={s.cancelBtn} onClick={()=>updateStatus(apt._id,'cancelled')}>✕ Cancel</button>
                    </div>
                  )}
                  {apt.status === 'confirmed' && (
                    <button style={s.confirmBtn} onClick={()=>updateStatus(apt._id,'completed')}>✓ Mark Done</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile */}
        {view === 'profile' && (
          <div style={{maxWidth:'520px'}}>
            <h2 style={s.heading}>My Profile</h2>
            {profile ? (
              <div style={s.card}>
                {/* Doctor Info */}
                <div style={s.profileHeader}>
                  <PhotoUpload
  currentPhoto={profile.photo}
  userName={user.name}
  onUploadSuccess={async (url) => {
    await API.put(`/doctors/${profile._id}`, { ...editAvailability, photo: url });
    fetchProfile();
  }}
/>
                  <div>
                    <h3 style={{margin:'0 0 4px 0',color:'#f1f5f9'}}>Dr. {user.name}</h3>
                    <p style={{margin:'2px 0',color:'#94a3b8',fontSize:'14px'}}>🩺 {profile.specialization}</p>
                    <p style={{margin:'2px 0',color:'#94a3b8',fontSize:'14px'}}>🏢 {profile.department} {profile.roomNumber && `· 🚪 ${profile.roomNumber}`}</p>
                    <p style={{margin:'2px 0',color:'#94a3b8',fontSize:'14px'}}>💰 ₹{profile.fees} · ⭐ {profile.experience} yrs exp</p>
                    <span style={{...s.statusBadge, marginTop:'6px', display:'inline-block',
                      background: profile.isApproved?'#10b98122':'#f59e0b22',
                      color: profile.isApproved?'#10b981':'#f59e0b',
                      border: `1px solid ${profile.isApproved?'#10b98144':'#f59e0b44'}`}}>
                      {profile.isApproved ? '✅ Approved' : '⏳ Pending Approval'}
                    </span>
                  </div>
                </div>

                <hr style={{borderColor:'#1e293b',margin:'24px 0'}}/>

                <h4 style={{color:'#94a3b8',margin:'0 0 16px 0',fontSize:'13px',textTransform:'uppercase',letterSpacing:'1px'}}>Update Availability</h4>

                <label style={s.label}>Available Days</label>
                <div style={s.tagContainer}>
                  {days.map(day=>(
                    <span key={day} style={{...s.tag,
                      background: editAvailability.availableDays.includes(day)?'#2563eb':'#1e293b',
                      color: editAvailability.availableDays.includes(day)?'white':'#64748b',
                      border: `1px solid ${editAvailability.availableDays.includes(day)?'#2563eb':'#334155'}`}}
                      onClick={()=>setEditAvailability({...editAvailability, availableDays:toggleItem(editAvailability.availableDays,day)})}>
                      {day.slice(0,3)}
                    </span>
                  ))}
                </div>

                <label style={s.label}>Available Time Slots</label>
                <div style={s.tagContainer}>
                  {slots.map(slot=>(
                    <span key={slot} style={{...s.tag,
                      background: editAvailability.availableTimeSlots.includes(slot)?'#2563eb':'#1e293b',
                      color: editAvailability.availableTimeSlots.includes(slot)?'white':'#64748b',
                      border:`1px solid ${editAvailability.availableTimeSlots.includes(slot)?'#2563eb':'#334155'}`}}
                      onClick={()=>setEditAvailability({...editAvailability, availableTimeSlots:toggleItem(editAvailability.availableTimeSlots,slot)})}>
                      {slot}
                    </span>
                  ))}
                </div>
                <button style={s.primaryBtn} onClick={updateAvailability}>💾 Save Availability</button>
              </div>
            ) : (
              <div style={s.card}>
                <p style={{color:'#64748b',marginBottom:'20px'}}>Create your profile to start receiving appointments.</p>
                <form onSubmit={createProfile}>
                  <label style={s.label}>Specialization</label>
                  <input style={s.input} placeholder="e.g. Cardiology" onChange={e=>setForm({...form,specialization:e.target.value})} required />
                  <label style={s.label}>Department</label>
                  <input style={s.input} placeholder="e.g. Heart Care" onChange={e=>setForm({...form,department:e.target.value})} required />
                  <label style={s.label}>Room Number</label>
                  <input style={s.input} placeholder="e.g. Room 204, Block B" onChange={e=>setForm({...form,roomNumber:e.target.value})} />
                  <label style={s.label}>Experience (years)</label>
                  <input style={s.input} type="number" placeholder="5" onChange={e=>setForm({...form,experience:e.target.value})} required />
                  <label style={s.label}>Consultation Fees (₹)</label>
                  <input style={s.input} type="number" placeholder="500" onChange={e=>setForm({...form,fees:e.target.value})} required />
                  <label style={s.label}>Photo URL <span style={{color:'#475569'}}>(optional — paste a direct image link)</span></label>
                  <input style={s.input} placeholder="https://example.com/photo.jpg" onChange={e=>setForm({...form,photo:e.target.value})} />
                  <label style={s.label}>Available Days</label>
                  <div style={s.tagContainer}>
                    {days.map(day=>(
                      <span key={day} style={{...s.tag,
                        background:form.availableDays.includes(day)?'#2563eb':'#1e293b',
                        color:form.availableDays.includes(day)?'white':'#64748b',
                        border:`1px solid ${form.availableDays.includes(day)?'#2563eb':'#334155'}`}}
                        onClick={()=>setForm({...form,availableDays:toggleItem(form.availableDays,day)})}>
                        {day.slice(0,3)}
                      </span>
                    ))}
                  </div>
                  <label style={s.label}>Available Time Slots</label>
                  <div style={s.tagContainer}>
                    {slots.map(slot=>(
                      <span key={slot} style={{...s.tag,
                        background:form.availableTimeSlots.includes(slot)?'#2563eb':'#1e293b',
                        color:form.availableTimeSlots.includes(slot)?'white':'#64748b',
                        border:`1px solid ${form.availableTimeSlots.includes(slot)?'#2563eb':'#334155'}`}}
                        onClick={()=>setForm({...form,availableTimeSlots:toggleItem(form.availableTimeSlots,slot)})}>
                        {slot}
                      </span>
                    ))}
                  </div>
                  <button style={s.primaryBtn} type="submit">Create Profile</button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:{display:'flex',minHeight:'100vh',background:'#0a0f1e',fontFamily:'"Inter",sans-serif'},
  sidebar:{width:'260px',background:'#0d1117',borderRight:'1px solid #1e293b',padding:'28px 20px',display:'flex',flexDirection:'column',justifyContent:'space-between'},
  logo:{color:'white',margin:'0 0 20px 0',fontSize:'20px',fontWeight:'700'},
  sideProfile:{display:'flex',flexDirection:'column',alignItems:'center',padding:'16px',background:'#0f172a',borderRadius:'12px',border:'1px solid #1e293b'},
  sideAvatar:{width:'60px',height:'60px',borderRadius:'50%',marginBottom:'10px',objectFit:'cover',border:'2px solid #1e293b'},
  userInfo:{color:'#e2e8f0',margin:0,fontSize:'14px',fontWeight:'600',textAlign:'center'},
  userRole:{color:'#10b981',margin:'2px 0 0 0',fontSize:'11px',textTransform:'uppercase',letterSpacing:'1px'},
  nav:{background:'transparent',border:'none',color:'#64748b',padding:'11px 14px',textAlign:'left',cursor:'pointer',borderRadius:'8px',fontSize:'14px',marginBottom:'4px',width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center'},
  navActive:{background:'#1e293b',border:'none',color:'#f1f5f9',padding:'11px 14px',textAlign:'left',cursor:'pointer',borderRadius:'8px',fontSize:'14px',marginBottom:'4px',width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center'},
  badge:{background:'#ef4444',color:'white',borderRadius:'10px',padding:'1px 7px',fontSize:'11px',fontWeight:'700'},
  alertBadge:{background:'#ef444422',color:'#ef4444',border:'1px solid #ef444444',borderRadius:'20px',padding:'3px 12px',fontSize:'13px',fontWeight:'600'},
  logoutBtn:{background:'transparent',border:'1px solid #1e293b',color:'#64748b',padding:'10px',borderRadius:'8px',cursor:'pointer',fontSize:'14px',width:'100%'},
  main:{flex:1,padding:'40px',overflowY:'auto'},
  pageHeader:{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'},
  heading:{color:'#f1f5f9',margin:0,fontSize:'22px',fontWeight:'700'},
  warning:{background:'#431407',color:'#fb923c',padding:'14px 18px',borderRadius:'10px',marginBottom:'20px',border:'1px solid #78350f',fontSize:'14px'},
  emptyState:{textAlign:'center',padding:'60px 20px',color:'#334155'},
  aptCard:{background:'#0d1117',border:'1px solid #1e293b',borderRadius:'12px',padding:'18px 20px',marginBottom:'12px',display:'flex',justifyContent:'space-between',alignItems:'center',transition:'border-color 0.2s'},
  aptLeft:{display:'flex',alignItems:'center'},
  aptRight:{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'8px'},
  statusBadge:{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px'},
  confirmBtn:{background:'#052e16',color:'#4ade80',border:'1px solid #14532d',padding:'6px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'600'},
  cancelBtn:{background:'#450a0a',color:'#f87171',border:'1px solid #7f1d1d',padding:'6px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'600'},
  card:{background:'#0d1117',border:'1px solid #1e293b',borderRadius:'14px',padding:'28px'},
  profileHeader:{display:'flex',gap:'20px',alignItems:'flex-start'},
  profileAvatar:{width:'80px',height:'80px',borderRadius:'12px',objectFit:'cover',border:'2px solid #1e293b',flexShrink:0},
  label:{display:'block',color:'#64748b',fontSize:'12px',marginBottom:'6px',marginTop:'16px',textTransform:'uppercase',letterSpacing:'0.5px'},
  input:{width:'100%',padding:'11px 14px',background:'#0a0f1e',border:'1px solid #1e293b',borderRadius:'8px',color:'#f1f5f9',fontSize:'14px',boxSizing:'border-box',outline:'none'},
  primaryBtn:{background:'#2563eb',color:'white',border:'none',padding:'12px',borderRadius:'8px',cursor:'pointer',marginTop:'20px',width:'100%',fontWeight:'600',fontSize:'14px'},
  tagContainer:{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'8px'},
  tag:{padding:'6px 14px',borderRadius:'20px',cursor:'pointer',fontSize:'13px',userSelect:'none',transition:'all 0.15s'},
  toast:{background:'#052e16',color:'#4ade80',border:'1px solid #14532d',padding:'12px 20px',borderRadius:'10px',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center'},
  toastClose:{background:'transparent',border:'none',color:'#4ade80',cursor:'pointer',fontSize:'16px'},
};

export default DoctorDashboard;