import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('appointments');
  const [form, setForm] = useState({ specialization:'', department:'', experience:'', fees:'', availableDays:[], availableTimeSlots:[] });
  const [editAvailability, setEditAvailability] = useState({ availableDays:[], availableTimeSlots:[] });
  const [message, setMessage] = useState('');

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

  return (
    <div style={s.page}>
      <div style={s.sidebar}>
        <h2 style={s.logo}>🏥 MediBook</h2>
        <p style={s.userInfo}>Dr. {user.name}</p>
        <p style={s.userRole}>Doctor</p>
        <hr style={{borderColor:'#334155', margin:'20px 0'}}/>
        <button style={view==='appointments'?s.navActive:s.nav} onClick={()=>setView('appointments')}>📋 Appointments</button>
        <button style={view==='profile'?s.navActive:s.nav} onClick={()=>setView('profile')}>👤 My Profile</button>
        <button style={s.logoutBtn} onClick={logout}>🚪 Logout</button>
      </div>

      <div style={s.main}>
        {message && <div style={s.toast}>{message} <button onClick={()=>setMessage('')} style={s.toastClose}>✕</button></div>}

        {/* Appointments */}
        {view === 'appointments' && (
          <div>
            <h2 style={s.heading}>My Appointments</h2>
            {!profile && <div style={s.warning}>⚠️ Create your profile first, then ask admin to approve it before appointments show up.</div>}
            {appointments.length === 0 && profile && <p style={{color:'#94a3b8'}}>No appointments yet.</p>}
            {appointments.map(apt => (
              <div key={apt._id} style={s.aptCard}>
                <div style={s.aptLeft}>
                  <img src={`https://ui-avatars.com/api/?name=${apt.patient?.name}&background=10b981&color=fff&size=50`}
                    alt="patient" style={{width:'50px',height:'50px',borderRadius:'50%',marginRight:'15px'}} />
                  <div>
                    <h4 style={{margin:0}}>{apt.patient?.name}</h4>
                    <p style={{margin:'4px 0',color:'#64748b'}}>📅 {apt.date} at {apt.timeSlot}</p>
                    {apt.symptoms && <p style={{margin:'4px 0',color:'#64748b',fontSize:'13px'}}>🤒 {apt.symptoms}</p>}
                  </div>
                </div>
                <div style={s.aptRight}>
                  <span style={{...s.badge, background:statusColor[apt.status]}}>{apt.status}</span>
                  {apt.status === 'pending' && (
                    <div style={{display:'flex',gap:'8px'}}>
                      <button style={s.confirmBtn} onClick={()=>updateStatus(apt._id,'confirmed')}>Confirm</button>
                      <button style={s.cancelBtn} onClick={()=>updateStatus(apt._id,'cancelled')}>Cancel</button>
                    </div>
                  )}
                  {apt.status === 'confirmed' && (
                    <button style={s.confirmBtn} onClick={()=>updateStatus(apt._id,'completed')}>Mark Done</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile */}
        {view === 'profile' && (
          <div style={{maxWidth:'500px'}}>
            <h2 style={s.heading}>My Profile</h2>
            {profile ? (
              <div style={s.formCard}>
                {/* Info */}
                <div style={{textAlign:'center', marginBottom:'20px'}}>
                  <img src={`https://ui-avatars.com/api/?name=${user.name}&background=2563eb&color=fff&size=80`}
                    alt={user.name} style={{width:'80px',height:'80px',borderRadius:'50%',marginBottom:'10px'}} />
                  <h3 style={{margin:'0 0 5px 0'}}>Dr. {user.name}</h3>
                  <p style={{margin:'4px 0',color:'#64748b'}}>🩺 {profile.specialization} | 🏢 {profile.department}</p>
                  <p style={{margin:'4px 0',color:'#64748b'}}>💰 ₹{profile.fees} | ⭐ {profile.experience} yrs</p>
                  <p style={{margin:'8px 0'}}>Status: <span style={{color: profile.isApproved?'#10b981':'#f59e0b', fontWeight:'bold'}}>
                    {profile.isApproved ? '✅ Approved' : '⏳ Pending Approval'}
                  </span></p>
                </div>

                <hr style={{borderColor:'#e2e8f0', margin:'20px 0'}}/>

                {/* Edit Availability */}
                <h4 style={{color:'#0f172a', margin:'0 0 15px 0'}}>Update Availability</h4>
                <label style={s.label}>Available Days</label>
                <div style={s.tagContainer}>
                  {days.map(day=>(
                    <span key={day}
                      style={{...s.tag, background: editAvailability.availableDays.includes(day)?'#2563eb':'#e2e8f0', color: editAvailability.availableDays.includes(day)?'white':'#374151'}}
                      onClick={()=>setEditAvailability({...editAvailability, availableDays: toggleItem(editAvailability.availableDays, day)})}>
                      {day.slice(0,3)}
                    </span>
                  ))}
                </div>

                <label style={s.label}>Available Time Slots</label>
                <div style={s.tagContainer}>
                  {slots.map(slot=>(
                    <span key={slot}
                      style={{...s.tag, background: editAvailability.availableTimeSlots.includes(slot)?'#2563eb':'#e2e8f0', color: editAvailability.availableTimeSlots.includes(slot)?'white':'#374151'}}
                      onClick={()=>setEditAvailability({...editAvailability, availableTimeSlots: toggleItem(editAvailability.availableTimeSlots, slot)})}>
                      {slot}
                    </span>
                  ))}
                </div>
                <button style={s.bookBtn} onClick={updateAvailability}>💾 Save Availability</button>
              </div>
            ) : (
              <div style={s.formCard}>
                <p style={{color:'#64748b',marginBottom:'20px'}}>Create your doctor profile to start receiving appointments.</p>
                <form onSubmit={createProfile}>
                  <label style={s.label}>Specialization</label>
                  <input style={s.input} placeholder="e.g. Cardiology"
                    onChange={e=>setForm({...form,specialization:e.target.value})} required />
                  <label style={s.label}>Department</label>
                  <input style={s.input} placeholder="e.g. Heart Care"
                    onChange={e=>setForm({...form,department:e.target.value})} required />
                  <label style={s.label}>Experience (years)</label>
                  <input style={s.input} type="number" placeholder="5"
                    onChange={e=>setForm({...form,experience:e.target.value})} required />
                  <label style={s.label}>Consultation Fees (₹)</label>
                  <input style={s.input} type="number" placeholder="500"
                    onChange={e=>setForm({...form,fees:e.target.value})} required />
                  <label style={s.label}>Available Days</label>
                  <div style={s.tagContainer}>
                    {days.map(day=>(
                      <span key={day}
                        style={{...s.tag, background: form.availableDays.includes(day)?'#2563eb':'#e2e8f0', color: form.availableDays.includes(day)?'white':'#374151'}}
                        onClick={()=>setForm({...form, availableDays:toggleItem(form.availableDays,day)})}>
                        {day.slice(0,3)}
                      </span>
                    ))}
                  </div>
                  <label style={s.label}>Available Time Slots</label>
                  <div style={s.tagContainer}>
                    {slots.map(slot=>(
                      <span key={slot}
                        style={{...s.tag, background: form.availableTimeSlots.includes(slot)?'#2563eb':'#e2e8f0', color: form.availableTimeSlots.includes(slot)?'white':'#374151'}}
                        onClick={()=>setForm({...form, availableTimeSlots:toggleItem(form.availableTimeSlots,slot)})}>
                        {slot}
                      </span>
                    ))}
                  </div>
                  <button style={s.bookBtn} type="submit">Create Profile</button>
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
  page:{display:'flex',minHeight:'100vh',background:'#f8fafc',fontFamily:'sans-serif'},
  sidebar:{width:'240px',background:'#0f172a',color:'white',padding:'30px 20px',display:'flex',flexDirection:'column'},
  logo:{color:'white',margin:'0 0 5px 0',fontSize:'20px'},
  userInfo:{color:'#94a3b8',margin:'0',fontSize:'14px',marginTop:'10px'},
  userRole:{color:'#10b981',margin:'2px 0',fontSize:'12px',textTransform:'uppercase'},
  nav:{background:'transparent',border:'none',color:'#94a3b8',padding:'12px 15px',textAlign:'left',cursor:'pointer',borderRadius:'8px',fontSize:'14px',marginBottom:'5px'},
  navActive:{background:'#1e293b',border:'none',color:'white',padding:'12px 15px',textAlign:'left',cursor:'pointer',borderRadius:'8px',fontSize:'14px',marginBottom:'5px'},
  logoutBtn:{background:'transparent',border:'1px solid #334155',color:'#94a3b8',padding:'10px',borderRadius:'8px',cursor:'pointer',marginTop:'auto',fontSize:'14px'},
  main:{flex:1,padding:'40px'},
  heading:{color:'#0f172a',marginBottom:'25px'},
  warning:{background:'#fef3c7',color:'#92400e',padding:'15px',borderRadius:'8px',marginBottom:'20px'},
  aptCard:{background:'white',borderRadius:'12px',padding:'20px',marginBottom:'15px',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'},
  aptLeft:{display:'flex',alignItems:'center'},
  aptRight:{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'8px'},
  badge:{color:'white',padding:'4px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:'bold',textTransform:'uppercase'},
  confirmBtn:{background:'#dcfce7',color:'#16a34a',border:'none',padding:'6px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'12px'},
  cancelBtn:{background:'#fee2e2',color:'#ef4444',border:'none',padding:'6px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'12px'},
  formCard:{background:'white',padding:'30px',borderRadius:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'},
  label:{display:'block',color:'#374151',fontSize:'14px',marginBottom:'5px',marginTop:'15px'},
  input:{width:'100%',padding:'10px',borderRadius:'8px',border:'1px solid #e2e8f0',boxSizing:'border-box',fontSize:'14px'},
  bookBtn:{background:'#2563eb',color:'white',border:'none',padding:'12px',borderRadius:'8px',cursor:'pointer',marginTop:'20px',width:'100%',fontWeight:'bold'},
  tagContainer:{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'8px'},
  tag:{padding:'6px 12px',borderRadius:'20px',cursor:'pointer',fontSize:'13px',userSelect:'none'},
  toast:{background:'#10b981',color:'white',padding:'12px 20px',borderRadius:'8px',marginBottom:'20px',display:'flex',justifyContent:'space-between'},
  toastClose:{background:'transparent',border:'none',color:'white',cursor:'pointer',fontSize:'16px'},
};

export default DoctorDashboard;