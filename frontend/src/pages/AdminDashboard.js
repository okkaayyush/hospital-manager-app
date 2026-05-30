import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('doctors');
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState('');

  const statusColor = { pending:'#f59e0b', confirmed:'#10b981', cancelled:'#ef4444', completed:'#6366f1' };

  useEffect(() => { fetchDoctors(); fetchUsers(); fetchAppointments(); }, []);

  const fetchDoctors = async () => {
    try { const res = await API.get('/admin/doctors'); setDoctors(res.data); }
    catch (err) { console.log(err); }
  };

  const fetchUsers = async () => {
    try { const res = await API.get('/admin/users'); setUsers(res.data); }
    catch (err) { console.log(err); }
  };

  const fetchAppointments = async () => {
    try { const res = await API.get('/admin/appointments'); setAppointments(res.data); }
    catch (err) { console.log(err); }
  };

  const approveDoctor = async (id) => {
    try {
      await API.put(`/admin/doctors/${id}/approve`);
      setMessage('Doctor approved successfully!');
      fetchDoctors();
    } catch (err) { setMessage('Failed to approve'); }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete ${name} and all their appointments?`)) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setMessage('User and related data deleted');
      fetchUsers(); fetchDoctors(); fetchAppointments();
    } catch (err) { setMessage('Failed to delete'); }
  };

  const deleteAppointment = async (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await API.delete(`/admin/appointments/${id}`);
      setMessage('Appointment deleted');
      fetchAppointments();
    } catch (err) { setMessage('Failed to delete appointment'); }
  };

  const stats = [
    { label:'Total Users', value: users.length, color:'#2563eb' },
    { label:'Total Doctors', value: doctors.length, color:'#10b981' },
    { label:'Pending Approvals', value: doctors.filter(d=>!d.isApproved).length, color:'#f59e0b' },
    { label:'Total Appointments', value: appointments.length, color:'#6366f1' },
  ];

  const avatarUrl = (name, bg='2563eb') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'U')}&background=${bg}&color=fff&size=50`;

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div>
          <h2 style={s.logo}>🏥 MediBook</h2>
          <div style={s.sideProfile}>
            <img src={avatarUrl(user.name, 'a855f7')} alt={user.name} style={s.sideAvatar} />
            <p style={s.userInfo}>{user.name}</p>
            <p style={s.userRole}>Admin</p>
          </div>
          <hr style={{borderColor:'#1e293b',margin:'20px 0'}}/>
          <button style={view==='doctors'?s.navActive:s.nav} onClick={()=>setView('doctors')}>
            👨‍⚕️ Doctors
            {doctors.filter(d=>!d.isApproved).length > 0 &&
              <span style={s.navBadge}>{doctors.filter(d=>!d.isApproved).length}</span>}
          </button>
          <button style={view==='users'?s.navActive:s.nav} onClick={()=>setView('users')}>👥 Users</button>
          <button style={view==='appointments'?s.navActive:s.nav} onClick={()=>setView('appointments')}>📋 Appointments</button>
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

        {/* Stats */}
        <div style={s.statsGrid}>
          {stats.map(stat => (
            <div key={stat.label} style={{...s.statCard, borderTop:`3px solid ${stat.color}`}}>
              <h3 style={{...s.statNum, color:stat.color}}>{stat.value}</h3>
              <p style={s.statLabel}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Doctors */}
        {view === 'doctors' && (
          <div>
            <h2 style={s.heading}>Manage Doctors</h2>
            {doctors.length === 0 && <p style={{color:'#475569'}}>No doctors yet.</p>}
            {doctors.map(doc => (
              <div key={doc._id} style={s.card}>
                <div style={s.cardLeft}>
                  <img
                    src={doc.photo || avatarUrl(doc.user?.name)}
                    alt="doctor"
                    style={s.avatar}
                    onError={e=>e.target.src=avatarUrl(doc.user?.name)}
                  />
                  <div>
                    <h4 style={{margin:0,color:'#f1f5f9'}}>Dr. {doc.user?.name}</h4>
                    <p style={{margin:'3px 0',color:'#64748b',fontSize:'13px'}}>🩺 {doc.specialization} · 🏢 {doc.department}</p>
                    <p style={{margin:'3px 0',color:'#64748b',fontSize:'13px'}}>💰 ₹{doc.fees} · ⭐ {doc.experience} yrs {doc.roomNumber && `· 🚪 ${doc.roomNumber}`}</p>
                  </div>
                </div>
                <div style={s.cardRight}>
                  {doc.isApproved ? (
                    <span style={{...s.statusBadge, background:'#10b98122', color:'#10b981', border:'1px solid #10b98144'}}>✅ Approved</span>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:'8px',alignItems:'flex-end'}}>
                      <span style={{...s.statusBadge, background:'#f59e0b22', color:'#f59e0b', border:'1px solid #f59e0b44'}}>⏳ Pending</span>
                      <button style={s.approveBtn} onClick={()=>approveDoctor(doc._id)}>Approve</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {view === 'users' && (
          <div>
            <h2 style={s.heading}>All Users</h2>
            {users.map(u => (
              <div key={u._id} style={s.card}>
                <div style={s.cardLeft}>
                  <img src={avatarUrl(u.name, u.role==='doctor'?'2563eb':u.role==='admin'?'a855f7':'0f766e')}
                    alt="user" style={s.avatar} />
                  <div>
                    <h4 style={{margin:0,color:'#f1f5f9'}}>{u.name}</h4>
                    <p style={{margin:'3px 0',color:'#64748b',fontSize:'13px'}}>{u.email}</p>
                    <span style={{
                      ...s.statusBadge,
                      background: u.role==='admin'?'#a855f722':u.role==='doctor'?'#2563eb22':'#10b98122',
                      color: u.role==='admin'?'#a855f7':u.role==='doctor'?'#60a5fa':'#10b981',
                      border: `1px solid ${u.role==='admin'?'#a855f744':u.role==='doctor'?'#2563eb44':'#10b98144'}`
                    }}>{u.role}</span>
                  </div>
                </div>
                {u.role !== 'admin' && (
                  <button style={s.deleteBtn} onClick={()=>deleteUser(u._id, u.name)}>🗑 Delete</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Appointments */}
        {view === 'appointments' && (
          <div>
            <h2 style={s.heading}>All Appointments</h2>
            {appointments.length === 0 && <p style={{color:'#475569'}}>No appointments yet.</p>}
            {appointments.map(apt => (
              <div key={apt._id} style={s.card}>
                <div style={s.cardLeft}>
                  <div style={s.aptIconBox}>📋</div>
                  <div>
                    <h4 style={{margin:0,color:'#f1f5f9',fontSize:'14px'}}>
                      {apt.patient?.name} <span style={{color:'#475569'}}>→</span> Dr. {apt.doctor?.user?.name}
                    </h4>
                    <p style={{margin:'3px 0',color:'#64748b',fontSize:'13px'}}>📅 {apt.date} · ⏰ {apt.timeSlot}</p>
                    {apt.symptoms && <p style={{margin:'3px 0',color:'#64748b',fontSize:'12px'}}>🤒 {apt.symptoms}</p>}
                  </div>
                </div>
                <div style={s.cardRight}>
                  <span style={{
                    ...s.statusBadge,
                    background: statusColor[apt.status]+'22',
                    color: statusColor[apt.status],
                    border: `1px solid ${statusColor[apt.status]}44`
                  }}>{apt.status}</span>
                  <button style={s.deleteBtn} onClick={()=>deleteAppointment(apt._id)}>🗑 Delete</button>
                </div>
              </div>
            ))}
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
  sideAvatar:{width:'56px',height:'56px',borderRadius:'50%',marginBottom:'10px'},
  userInfo:{color:'#e2e8f0',margin:0,fontSize:'14px',fontWeight:'600'},
  userRole:{color:'#a855f7',margin:'2px 0 0 0',fontSize:'11px',textTransform:'uppercase',letterSpacing:'1px'},
  nav:{background:'transparent',border:'none',color:'#64748b',padding:'11px 14px',textAlign:'left',cursor:'pointer',borderRadius:'8px',fontSize:'14px',marginBottom:'4px',width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center'},
  navActive:{background:'#1e293b',border:'none',color:'#f1f5f9',padding:'11px 14px',textAlign:'left',cursor:'pointer',borderRadius:'8px',fontSize:'14px',marginBottom:'4px',width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center'},
  navBadge:{background:'#ef4444',color:'white',borderRadius:'10px',padding:'1px 7px',fontSize:'11px',fontWeight:'700'},
  logoutBtn:{background:'transparent',border:'1px solid #1e293b',color:'#64748b',padding:'10px',borderRadius:'8px',cursor:'pointer',fontSize:'14px',width:'100%'},
  main:{flex:1,padding:'40px',overflowY:'auto'},
  statsGrid:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'32px'},
  statCard:{background:'#0d1117',border:'1px solid #1e293b',padding:'20px',borderRadius:'12px'},
  statNum:{margin:0,fontSize:'30px',fontWeight:'700'},
  statLabel:{margin:'6px 0 0 0',color:'#475569',fontSize:'13px'},
  heading:{color:'#f1f5f9',margin:'0 0 20px 0',fontSize:'20px',fontWeight:'700'},
  card:{background:'#0d1117',border:'1px solid #1e293b',borderRadius:'12px',padding:'18px 20px',marginBottom:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'},
  cardLeft:{display:'flex',alignItems:'center',gap:'14px'},
  cardRight:{display:'flex',alignItems:'center',gap:'10px'},
  avatar:{width:'46px',height:'46px',borderRadius:'10px',objectFit:'cover'},
  aptIconBox:{width:'46px',height:'46px',borderRadius:'10px',background:'#1e293b',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px'},
  statusBadge:{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px'},
  approveBtn:{background:'#052e16',color:'#4ade80',border:'1px solid #14532d',padding:'7px 14px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:'600'},
  deleteBtn:{background:'#450a0a',color:'#f87171',border:'1px solid #7f1d1d',padding:'7px 14px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:'600'},
  toast:{background:'#052e16',color:'#4ade80',border:'1px solid #14532d',padding:'12px 20px',borderRadius:'10px',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center'},
  toastClose:{background:'transparent',border:'none',color:'#4ade80',cursor:'pointer',fontSize:'16px'},
};

export default AdminDashboard;