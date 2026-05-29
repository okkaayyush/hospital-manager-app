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

  useEffect(() => {
    fetchDoctors();
    fetchUsers();
    fetchAppointments();
  }, []);

  const fetchDoctors = async () => {
    try {
      // Get all doctors including unapproved
      const res = await API.get('/admin/doctors');
      setDoctors(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchAppointments = async () => {
    try {
      const res = await API.get('/admin/appointments');
      setAppointments(res.data);
    } catch (err) { console.log(err); }
  };

  const approveDoctor = async (id) => {
    try {
      await API.put(`/admin/doctors/${id}/approve`);
      setMessage('Doctor approved successfully!');
      fetchDoctors();
    } catch (err) { setMessage('Failed to approve'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setMessage('User deleted');
      fetchUsers();
    } catch (err) { setMessage('Failed to delete'); }
  };

  const stats = {
    totalUsers: users.length,
    totalDoctors: doctors.length,
    pendingDoctors: doctors.filter(d => !d.isApproved).length,
    totalAppointments: appointments.length,
  };

  return (
    <div style={s.page}>
      <div style={s.sidebar}>
        <h2 style={s.logo}>🏥 MediBook</h2>
        <p style={s.userInfo}>{user.name}</p>
        <p style={s.userRole}>Admin</p>
        <hr style={{borderColor:'#334155',margin:'20px 0'}}/>
        <button style={view==='doctors'?s.navActive:s.nav} onClick={()=>setView('doctors')}>👨‍⚕️ Doctors</button>
        <button style={view==='users'?s.navActive:s.nav} onClick={()=>setView('users')}>👥 Users</button>
        <button style={view==='appointments'?s.navActive:s.nav} onClick={()=>setView('appointments')}>📋 Appointments</button>
        <button style={s.logoutBtn} onClick={logout}>🚪 Logout</button>
      </div>

      <div style={s.main}>
        {message && <div style={s.toast}>{message}<button onClick={()=>setMessage('')} style={s.toastClose}>✕</button></div>}

        {/* Stats */}
        <div style={s.statsGrid}>
          <div style={s.statCard}><h3 style={s.statNum}>{stats.totalUsers}</h3><p style={s.statLabel}>Total Users</p></div>
          <div style={s.statCard}><h3 style={s.statNum}>{stats.totalDoctors}</h3><p style={s.statLabel}>Total Doctors</p></div>
          <div style={{...s.statCard, borderTop:'3px solid #f59e0b'}}><h3 style={s.statNum}>{stats.pendingDoctors}</h3><p style={s.statLabel}>Pending Approvals</p></div>
          <div style={s.statCard}><h3 style={s.statNum}>{stats.totalAppointments}</h3><p style={s.statLabel}>Total Appointments</p></div>
        </div>

        {/* Doctors */}
        {view === 'doctors' && (
          <div>
            <h2 style={s.heading}>Manage Doctors</h2>
            {doctors.map(doc => (
              <div key={doc._id} style={s.card}>
                <div style={s.cardLeft}>
                  <img src={`https://ui-avatars.com/api/?name=${doc.user?.name}&background=2563eb&color=fff&size=50`}
                    alt="doctor" style={{width:'50px',height:'50px',borderRadius:'50%',marginRight:'15px'}} />
                  <div>
                    <h4 style={{margin:0}}>Dr. {doc.user?.name}</h4>
                    <p style={{margin:'4px 0',color:'#64748b',fontSize:'13px'}}>🩺 {doc.specialization} | 🏢 {doc.department}</p>
                    <p style={{margin:'4px 0',color:'#64748b',fontSize:'13px'}}>💰 ₹{doc.fees} | ⭐ {doc.experience} yrs</p>
                  </div>
                </div>
                <div style={s.cardRight}>
                  {doc.isApproved ? (
                    <span style={{...s.badge, background:'#10b981'}}>✅ Approved</span>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:'8px',alignItems:'flex-end'}}>
                      <span style={{...s.badge, background:'#f59e0b'}}>⏳ Pending</span>
                      <button style={s.approveBtn} onClick={()=>approveDoctor(doc._id)}>Approve Doctor</button>
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
                  <img src={`https://ui-avatars.com/api/?name=${u.name}&background=6366f1&color=fff&size=50`}
                    alt="user" style={{width:'50px',height:'50px',borderRadius:'50%',marginRight:'15px'}} />
                  <div>
                    <h4 style={{margin:0}}>{u.name}</h4>
                    <p style={{margin:'4px 0',color:'#64748b',fontSize:'13px'}}>{u.email}</p>
                    <span style={{...s.badge, background: u.role==='admin'?'#6366f1':u.role==='doctor'?'#2563eb':'#10b981', fontSize:'11px', padding:'2px 8px'}}>
                      {u.role}
                    </span>
                  </div>
                </div>
                <div style={s.cardRight}>
                  {u.role !== 'admin' && (
                    <button style={s.deleteBtn} onClick={()=>deleteUser(u._id)}>Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Appointments */}
        {view === 'appointments' && (
          <div>
            <h2 style={s.heading}>All Appointments</h2>
            {appointments.map(apt => (
              <div key={apt._id} style={s.card}>
                <div style={s.cardLeft}>
                  <div>
                    <h4 style={{margin:0}}>{apt.patient?.name} → Dr. {apt.doctor?.user?.name}</h4>
                    <p style={{margin:'4px 0',color:'#64748b',fontSize:'13px'}}>📅 {apt.date} at {apt.timeSlot}</p>
                    {apt.symptoms && <p style={{margin:'4px 0',color:'#64748b',fontSize:'13px'}}>🤒 {apt.symptoms}</p>}
                  </div>
                </div>
                <span style={{...s.badge, background:statusColor[apt.status]}}>{apt.status}</span>
              </div>
            ))}
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
  userRole:{color:'#a855f7',margin:'2px 0',fontSize:'12px',textTransform:'uppercase'},
  nav:{background:'transparent',border:'none',color:'#94a3b8',padding:'12px 15px',textAlign:'left',cursor:'pointer',borderRadius:'8px',fontSize:'14px',marginBottom:'5px'},
  navActive:{background:'#1e293b',border:'none',color:'white',padding:'12px 15px',textAlign:'left',cursor:'pointer',borderRadius:'8px',fontSize:'14px',marginBottom:'5px'},
  logoutBtn:{background:'transparent',border:'1px solid #334155',color:'#94a3b8',padding:'10px',borderRadius:'8px',cursor:'pointer',marginTop:'auto',fontSize:'14px'},
  main:{flex:1,padding:'40px'},
  heading:{color:'#0f172a',marginBottom:'25px'},
  statsGrid:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'20px',marginBottom:'30px'},
  statCard:{background:'white',padding:'20px',borderRadius:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',borderTop:'3px solid #2563eb'},
  statNum:{margin:0,fontSize:'28px',color:'#0f172a'},
  statLabel:{margin:'5px 0 0 0',color:'#64748b',fontSize:'14px'},
  card:{background:'white',borderRadius:'12px',padding:'20px',marginBottom:'15px',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'},
  cardLeft:{display:'flex',alignItems:'center'},
  cardRight:{display:'flex',alignItems:'center',gap:'10px'},
  badge:{color:'white',padding:'4px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:'bold',textTransform:'uppercase'},
  approveBtn:{background:'#dcfce7',color:'#16a34a',border:'none',padding:'8px 16px',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'},
  deleteBtn:{background:'#fee2e2',color:'#ef4444',border:'none',padding:'8px 16px',borderRadius:'8px',cursor:'pointer'},
  toast:{background:'#10b981',color:'white',padding:'12px 20px',borderRadius:'8px',marginBottom:'20px',display:'flex',justifyContent:'space-between'},
  toastClose:{background:'transparent',border:'none',color:'white',cursor:'pointer',fontSize:'16px'},
};

export default AdminDashboard;