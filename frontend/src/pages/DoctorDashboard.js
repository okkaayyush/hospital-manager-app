import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PhotoUpload from '../components/PhotoUpload';
import API from '../api';
import {
  Calendar, User, LogOut, Hospital, Stethoscope, Building2,
  DoorOpen, IndianRupee, Star, CheckCircle, XCircle, AlertCircle,
  Clock, Save, Inbox, TriangleAlert, X
} from 'lucide-react';

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

  const statusConfig = {
    pending:   { color:'#f59e0b', bg:'#f59e0b15', border:'#f59e0b30', icon:<AlertCircle size={12}/> },
    confirmed: { color:'#10b981', bg:'#10b98115', border:'#10b98130', icon:<CheckCircle size={12}/> },
    cancelled: { color:'#ef4444', bg:'#ef444415', border:'#ef444430', icon:<XCircle size={12}/> },
    completed: { color:'#6366f1', bg:'#6366f115', border:'#6366f130', icon:<CheckCircle size={12}/> },
  };

  useEffect(() => { fetchProfile(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      setMessage('Availability updated successfully.');
      fetchProfile();
    } catch (err) { setMessage('Failed to update availability'); }
  };

  const avatarUrl = (name, bg='2563eb') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'D')}&background=${bg}&color=fff&size=80`;

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #334155; }
        input:focus, textarea:focus { border-color: #334155 !important; outline: none; }
        .nav-btn:hover { background: #161d2a !important; color: #f1f5f9 !important; }
        .tag:hover { opacity: 0.85; }
        .confirm-btn:hover { background: #064e3b !important; }
        .cancel-btn:hover { background: #7f1d1d !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
      `}</style>

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={{display:'flex',flexDirection:'column',gap:'0',flex:1}}>
          <div style={s.logoArea}>
            <div style={s.logoIcon}><Hospital size={20} color="white"/></div>
            <span style={s.logoText}>MediBook</span>
          </div>

          <div style={s.profileCard}>
            <img
              src={profile?.photo || avatarUrl(user.name)}
              alt={user.name}
              style={s.profileAvatar}
              onError={e=>e.target.src=avatarUrl(user.name)}
            />
            <div>
              <p style={s.profileName}>Dr. {user.name}</p>
              <p style={s.profileRole}>Doctor</p>
            </div>
          </div>

          <div style={s.divider}/>

          <nav style={{display:'flex',flexDirection:'column',gap:'2px'}}>
            <button className="nav-btn" style={view==='appointments'?s.navActive:s.nav}
              onClick={()=>setView('appointments')}>
              <Calendar size={16}/>
              <span>Appointments</span>
              {pendingCount > 0 && <span style={s.navBadge}>{pendingCount}</span>}
            </button>
            <button className="nav-btn" style={view==='profile'?s.navActive:s.nav}
              onClick={()=>setView('profile')}>
              <User size={16}/>
              <span>My Profile</span>
            </button>
          </nav>
        </div>
        <button style={s.logoutBtn} onClick={logout}>
          <LogOut size={15}/> Sign Out
        </button>
      </div>

      {/* Main */}
      <div style={s.main}>
        {message && (
          <div style={s.toast}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <CheckCircle size={16} color="#4ade80"/>
              {message}
            </div>
            <button onClick={()=>setMessage('')} style={s.toastClose}><X size={14}/></button>
          </div>
        )}

        {/* Appointments */}
        {view === 'appointments' && (
          <div>
            <div style={s.pageHeader}>
              <div>
                <h2 style={s.heading}>Appointments</h2>
                <p style={s.subheading}>{appointments.length} total · {pendingCount} pending</p>
              </div>
              {pendingCount > 0 && (
                <span style={s.alertBadge}>
                  <AlertCircle size={13}/> {pendingCount} pending review
                </span>
              )}
            </div>

            {!profile && (
              <div style={s.warning}>
                <TriangleAlert size={16} style={{flexShrink:0}}/>
                Create your profile first, then ask admin to approve it before appointments show up.
              </div>
            )}

            {appointments.length === 0 && profile && (
              <div style={s.emptyState}>
                <Inbox size={40} color="#1e293b"/>
                <p style={{color:'#475569',margin:'12px 0 0 0',fontSize:'15px'}}>No appointments yet</p>
              </div>
            )}

            {appointments.map(apt => {
              const sc = statusConfig[apt.status] || statusConfig.pending;
              return (
                <div key={apt._id} style={s.aptCard}>
                  <div style={s.aptLeft}>
                    <img src={avatarUrl(apt.patient?.name,'0f766e')} alt="patient" style={s.aptAvatar}/>
                    <div>
                      <h4 style={{margin:'0 0 4px 0',color:'#f1f5f9',fontSize:'15px',fontWeight:'600'}}>
                        {apt.patient?.name}
                      </h4>
                      <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                        <div style={s.aptMeta}>
                          <Calendar size={12} color="#475569"/>
                          <span>{apt.date}</span>
                          <Clock size={12} color="#475569"/>
                          <span>{apt.timeSlot}</span>
                        </div>
                        {apt.symptoms && (
                          <div style={s.aptMeta}>
                            <AlertCircle size={12} color="#475569"/>
                            <span>{apt.symptoms}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={s.aptRight}>
                    <span style={{...s.statusBadge,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,display:'flex',alignItems:'center',gap:'4px'}}>
                      {sc.icon}{apt.status}
                    </span>
                    {apt.status === 'pending' && (
                      <div style={{display:'flex',gap:'6px'}}>
                        <button className="confirm-btn" style={s.confirmBtn}
                          onClick={()=>updateStatus(apt._id,'confirmed')}>
                          <CheckCircle size={13}/> Confirm
                        </button>
                        <button className="cancel-btn" style={s.cancelBtn}
                          onClick={()=>updateStatus(apt._id,'cancelled')}>
                          <X size={13}/> Cancel
                        </button>
                      </div>
                    )}
                    {apt.status === 'confirmed' && (
                      <button className="confirm-btn" style={s.confirmBtn}
                        onClick={()=>updateStatus(apt._id,'completed')}>
                        <CheckCircle size={13}/> Mark Done
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Profile */}
        {view === 'profile' && (
          <div style={{maxWidth:'520px'}}>
            <div style={s.pageHeader}>
              <div>
                <h2 style={s.heading}>My Profile</h2>
                <p style={s.subheading}>Manage your information and availability</p>
              </div>
            </div>

            {profile ? (
              <div style={s.card}>
                {/* Photo + Info */}
                <div style={s.profileSection}>
                  <PhotoUpload
                    currentPhoto={profile.photo}
                    userName={user.name}
                    onUploadSuccess={async (url) => {
                      await API.put(`/doctors/${profile._id}`, { ...editAvailability, photo: url });
                      fetchProfile();
                    }}
                  />
                  <div style={{flex:1}}>
                    <h3 style={{margin:'0 0 8px 0',color:'#f1f5f9',fontSize:'17px',fontWeight:'600'}}>
                      Dr. {user.name}
                    </h3>
                    <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                      <div style={s.infoRow}><Stethoscope size={14} color="#475569"/><span>{profile.specialization}</span></div>
                      <div style={s.infoRow}><Building2 size={14} color="#475569"/><span>{profile.department}</span></div>
                      {profile.roomNumber && <div style={s.infoRow}><DoorOpen size={14} color="#475569"/><span>{profile.roomNumber}</span></div>}
                      <div style={s.infoRow}><IndianRupee size={14} color="#475569"/><span>₹{profile.fees} per visit</span></div>
                      <div style={s.infoRow}><Star size={14} color="#475569"/><span>{profile.experience} years experience</span></div>
                    </div>
                    <span style={{
                      ...s.statusBadge,
                      marginTop:'10px',
                      display:'inline-flex',
                      alignItems:'center',
                      gap:'4px',
                      background: profile.isApproved?'#10b98115':'#f59e0b15',
                      color: profile.isApproved?'#10b981':'#f59e0b',
                      border: `1px solid ${profile.isApproved?'#10b98130':'#f59e0b30'}`
                    }}>
                      {profile.isApproved ? <><CheckCircle size={12}/> Approved</> : <><Clock size={12}/> Pending Approval</>}
                    </span>
                  </div>
                </div>

                <div style={s.divider}/>

                <p style={{color:'#475569',fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.6px',fontWeight:'600',margin:'0 0 16px 0'}}>
                  Update Availability
                </p>

                <label style={s.label}>Available Days</label>
                <div style={s.tagContainer}>
                  {days.map(day=>(
                    <span key={day} className="tag" style={{...s.tag,
                      background: editAvailability.availableDays.includes(day)?'#2563eb':'transparent',
                      color: editAvailability.availableDays.includes(day)?'white':'#475569',
                      border: `1px solid ${editAvailability.availableDays.includes(day)?'#2563eb':'#161d2a'}`}}
                      onClick={()=>setEditAvailability({...editAvailability,availableDays:toggleItem(editAvailability.availableDays,day)})}>
                      {day.slice(0,3)}
                    </span>
                  ))}
                </div>

                <label style={s.label}>Available Time Slots</label>
                <div style={s.tagContainer}>
                  {slots.map(slot=>(
                    <span key={slot} className="tag" style={{...s.tag,
                      background: editAvailability.availableTimeSlots.includes(slot)?'#2563eb':'transparent',
                      color: editAvailability.availableTimeSlots.includes(slot)?'white':'#475569',
                      border:`1px solid ${editAvailability.availableTimeSlots.includes(slot)?'#2563eb':'#161d2a'}`}}
                      onClick={()=>setEditAvailability({...editAvailability,availableTimeSlots:toggleItem(editAvailability.availableTimeSlots,slot)})}>
                      {slot}
                    </span>
                  ))}
                </div>
                <button style={s.primaryBtn} onClick={updateAvailability}>
                  <Save size={15}/> Save Availability
                </button>
              </div>
            ) : (
              <div style={s.card}>
                <p style={{color:'#475569',marginBottom:'20px',fontSize:'14px'}}>
                  Create your profile to start receiving appointments.
                </p>
                <form onSubmit={createProfile}>
                  <label style={s.label}>Specialization</label>
                  <input style={s.input} placeholder="e.g. Cardiology" onChange={e=>setForm({...form,specialization:e.target.value})} required/>
                  <label style={s.label}>Department</label>
                  <input style={s.input} placeholder="e.g. Heart Care" onChange={e=>setForm({...form,department:e.target.value})} required/>
                  <label style={s.label}>Room Number</label>
                  <input style={s.input} placeholder="e.g. Room 204, Block B" onChange={e=>setForm({...form,roomNumber:e.target.value})}/>
                  <label style={s.label}>Experience (years)</label>
                  <input style={s.input} type="number" placeholder="5" onChange={e=>setForm({...form,experience:e.target.value})} required/>
                  <label style={s.label}>Consultation Fees (₹)</label>
                  <input style={s.input} type="number" placeholder="500" onChange={e=>setForm({...form,fees:e.target.value})} required/>
                  <label style={s.label}>Photo URL <span style={{color:'#334155',textTransform:'none',letterSpacing:'0'}}>(optional)</span></label>
                  <input style={s.input} placeholder="https://example.com/photo.jpg" onChange={e=>setForm({...form,photo:e.target.value})}/>
                  <label style={s.label}>Available Days</label>
                  <div style={s.tagContainer}>
                    {days.map(day=>(
                      <span key={day} className="tag" style={{...s.tag,
                        background:form.availableDays.includes(day)?'#2563eb':'transparent',
                        color:form.availableDays.includes(day)?'white':'#475569',
                        border:`1px solid ${form.availableDays.includes(day)?'#2563eb':'#161d2a'}`}}
                        onClick={()=>setForm({...form,availableDays:toggleItem(form.availableDays,day)})}>
                        {day.slice(0,3)}
                      </span>
                    ))}
                  </div>
                  <label style={s.label}>Available Time Slots</label>
                  <div style={s.tagContainer}>
                    {slots.map(slot=>(
                      <span key={slot} className="tag" style={{...s.tag,
                        background:form.availableTimeSlots.includes(slot)?'#2563eb':'transparent',
                        color:form.availableTimeSlots.includes(slot)?'white':'#475569',
                        border:`1px solid ${form.availableTimeSlots.includes(slot)?'#2563eb':'#161d2a'}`}}
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
  page:{display:'flex',minHeight:'100vh',background:'#080c14',fontFamily:'"Inter",system-ui,sans-serif'},
  sidebar:{width:'240px',background:'#0d1117',borderRight:'1px solid #161d2a',padding:'20px 16px',display:'flex',flexDirection:'column'},
  logoArea:{display:'flex',alignItems:'center',gap:'10px',padding:'8px 4px',marginBottom:'20px'},
  logoIcon:{width:'32px',height:'32px',background:'#2563eb',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center'},
  logoText:{color:'#f1f5f9',fontWeight:'700',fontSize:'16px',letterSpacing:'-0.3px'},
  profileCard:{display:'flex',alignItems:'center',gap:'10px',padding:'12px',background:'#0f172a',borderRadius:'10px',border:'1px solid #161d2a',marginBottom:'16px'},
  profileAvatar:{width:'36px',height:'36px',borderRadius:'50%',objectFit:'cover',flexShrink:0},
  profileName:{color:'#e2e8f0',margin:0,fontSize:'13px',fontWeight:'600'},
  profileRole:{color:'#10b981',margin:'1px 0 0 0',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.8px'},
  divider:{height:'1px',background:'#161d2a',margin:'4px 0 12px 0'},
  nav:{background:'transparent',border:'none',color:'#475569',padding:'9px 12px',textAlign:'left',cursor:'pointer',borderRadius:'7px',fontSize:'13px',marginBottom:'2px',width:'100%',display:'flex',alignItems:'center',gap:'9px',fontFamily:'"Inter",sans-serif'},
  navActive:{background:'#161d2a',border:'none',color:'#f1f5f9',padding:'9px 12px',textAlign:'left',cursor:'pointer',borderRadius:'7px',fontSize:'13px',marginBottom:'2px',width:'100%',display:'flex',alignItems:'center',gap:'9px',fontFamily:'"Inter",sans-serif'},
  navBadge:{marginLeft:'auto',background:'#ef4444',color:'white',borderRadius:'10px',padding:'1px 6px',fontSize:'11px',fontWeight:'700'},
  logoutBtn:{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'transparent',border:'1px solid #161d2a',color:'#475569',padding:'9px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',width:'100%',fontFamily:'"Inter",sans-serif'},
  main:{flex:1,padding:'36px 40px',overflowY:'auto'},
  pageHeader:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'},
  heading:{color:'#f1f5f9',margin:'0 0 4px 0',fontSize:'20px',fontWeight:'700',letterSpacing:'-0.3px'},
  subheading:{color:'#334155',fontSize:'13px',margin:0},
  warning:{display:'flex',alignItems:'center',gap:'10px',background:'#1a0e00',color:'#fb923c',padding:'13px 16px',borderRadius:'9px',marginBottom:'20px',border:'1px solid #431407',fontSize:'13px'},
  alertBadge:{display:'flex',alignItems:'center',gap:'6px',background:'#ef444415',color:'#ef4444',border:'1px solid #ef444430',borderRadius:'20px',padding:'4px 12px',fontSize:'12px',fontWeight:'600'},
  emptyState:{textAlign:'center',padding:'60px 20px',display:'flex',flexDirection:'column',alignItems:'center'},
  aptCard:{background:'#0d1117',border:'1px solid #161d2a',borderRadius:'11px',padding:'16px 18px',marginBottom:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'},
  aptLeft:{display:'flex',alignItems:'center',gap:'14px'},
  aptAvatar:{width:'44px',height:'44px',borderRadius:'9px',objectFit:'cover',border:'1px solid #161d2a',flexShrink:0},
  aptMeta:{display:'flex',alignItems:'center',gap:'5px',color:'#475569',fontSize:'12px'},
  aptRight:{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'8px'},
  statusBadge:{padding:'3px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.4px'},
  confirmBtn:{display:'flex',alignItems:'center',gap:'5px',background:'#052e16',color:'#4ade80',border:'1px solid #14532d',padding:'6px 11px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'600',fontFamily:'"Inter",sans-serif'},
  cancelBtn:{display:'flex',alignItems:'center',gap:'5px',background:'#1a0505',color:'#f87171',border:'1px solid #2d0a0a',padding:'6px 11px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'600',fontFamily:'"Inter",sans-serif'},
  card:{background:'#0d1117',border:'1px solid #161d2a',borderRadius:'12px',padding:'24px'},
  profileSection:{display:'flex',gap:'20px',alignItems:'flex-start'},
  infoRow:{display:'flex',alignItems:'center',gap:'7px',color:'#64748b',fontSize:'13px'},
  label:{display:'block',color:'#334155',fontSize:'11px',marginBottom:'7px',marginTop:'16px',textTransform:'uppercase',letterSpacing:'0.6px',fontWeight:'600'},
  input:{width:'100%',padding:'10px 13px',background:'#080c14',border:'1px solid #161d2a',borderRadius:'8px',color:'#f1f5f9',fontSize:'13px',boxSizing:'border-box'},
  primaryBtn:{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'#2563eb',color:'white',border:'none',padding:'11px',borderRadius:'8px',cursor:'pointer',marginTop:'20px',width:'100%',fontWeight:'600',fontSize:'13px',fontFamily:'"Inter",sans-serif'},
  tagContainer:{display:'flex',flexWrap:'wrap',gap:'7px',marginTop:'8px'},
  tag:{padding:'6px 13px',borderRadius:'20px',cursor:'pointer',fontSize:'12px',userSelect:'none',transition:'all 0.15s',fontWeight:'500'},
  toast:{background:'#0a1f12',color:'#4ade80',border:'1px solid #14532d',padding:'11px 16px',borderRadius:'9px',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px'},
  toastClose:{background:'transparent',border:'none',color:'#4ade80',cursor:'pointer',display:'flex',alignItems:'center'},
};

export default DoctorDashboard;