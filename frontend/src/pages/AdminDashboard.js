import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import useWindowSize from '../hooks/useWindowSize';
import {
  Hospital, LogOut, Stethoscope, Users, Calendar, CheckCircle,
  Clock, Trash2, UserCheck, Building2, DoorOpen, IndianRupee,
  Star, AlertCircle, XCircle, X, ArrowRight, User, Menu
} from 'lucide-react';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const { isMobile } = useWindowSize();
  const [view, setView] = useState('doctors');
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const statusConfig = {
    pending:   { color:'#f59e0b', bg:'#f59e0b15', border:'#f59e0b30', icon:<AlertCircle size={11}/> },
    confirmed: { color:'#10b981', bg:'#10b98115', border:'#10b98130', icon:<CheckCircle size={11}/> },
    cancelled: { color:'#ef4444', bg:'#ef444415', border:'#ef444430', icon:<XCircle size={11}/> },
    completed: { color:'#6366f1', bg:'#6366f115', border:'#6366f130', icon:<CheckCircle size={11}/> },
  };

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
      setMessage('Doctor approved successfully');
      fetchDoctors();
    } catch (err) { setMessage('Failed to approve'); }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete ${name} and all their data?`)) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setMessage('User deleted');
      fetchUsers(); fetchDoctors(); fetchAppointments();
    } catch (err) { setMessage('Failed to delete'); }
  };

  const deleteAppointment = async (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await API.delete(`/admin/appointments/${id}`);
      setMessage('Appointment deleted');
      fetchAppointments();
    } catch (err) { setMessage('Failed to delete'); }
  };

  const avatarUrl = (name, bg='2563eb') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'U')}&background=${bg}&color=fff&size=50`;

  const pendingDoctors = doctors.filter(d => !d.isApproved).length;

  const stats = [
    { label:'Users', value:users.length, color:'#2563eb', icon:<Users size={16}/> },
    { label:'Doctors', value:doctors.length, color:'#10b981', icon:<Stethoscope size={16}/> },
    { label:'Pending', value:pendingDoctors, color:'#f59e0b', icon:<Clock size={16}/> },
    { label:'Appointments', value:appointments.length, color:'#6366f1', icon:<Calendar size={16}/> },
  ];

  const Sidebar = () => (
    <div style={{
      ...s.sidebar,
      ...(isMobile ? {
        position:'fixed', top:0, left:0, height:'100vh', zIndex:1000,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        boxShadow: sidebarOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none',
      } : {})
    }}>
      <div style={{display:'flex',flexDirection:'column',flex:1}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
          <div style={s.logoArea}>
            <div style={s.logoIcon}><Hospital size={20} color="white"/></div>
            <span style={s.logoText}>MediBook</span>
          </div>
          {isMobile && (
            <button style={s.closeBtn} onClick={()=>setSidebarOpen(false)}>
              <X size={18}/>
            </button>
          )}
        </div>

        <div style={s.profileCard}>
          <img src={avatarUrl(user.name,'a855f7')} alt={user.name} style={s.profileAvatar}/>
          <div>
            <p style={s.profileName}>{user.name}</p>
            <p style={s.profileRole}>Admin</p>
          </div>
        </div>

        <div style={s.divider}/>

        <nav style={{display:'flex',flexDirection:'column',gap:'2px'}}>
          <button style={view==='doctors'?s.navActive:s.nav}
            onClick={()=>{setView('doctors');setSidebarOpen(false);}}>
            <Stethoscope size={16}/>
            <span>Doctors</span>
            {pendingDoctors > 0 && <span style={s.navBadge}>{pendingDoctors}</span>}
          </button>
          <button style={view==='users'?s.navActive:s.nav}
            onClick={()=>{setView('users');setSidebarOpen(false);}}>
            <Users size={16}/>
            <span>Users</span>
          </button>
          <button style={view==='appointments'?s.navActive:s.nav}
            onClick={()=>{setView('appointments');setSidebarOpen(false);}}>
            <Calendar size={16}/>
            <span>Appointments</span>
          </button>
        </nav>
      </div>
      <button style={s.logoutBtn} onClick={logout}>
        <LogOut size={15}/> Sign Out
      </button>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .approve-btn:hover { background: #064e3b !important; }
        .delete-btn:hover { background: #7f1d1d !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
      `}</style>

      {isMobile && sidebarOpen && (
        <div style={s.overlay} onClick={()=>setSidebarOpen(false)}/>
      )}

      <Sidebar/>

      <div style={{...s.main,...(isMobile?{padding:0}:{})}}>

        {/* Mobile top bar */}
        {isMobile && (
          <div style={s.mobileTopBar}>
            <button style={s.menuBtn} onClick={()=>setSidebarOpen(true)}>
              <Menu size={20}/>
            </button>
            <div style={s.logoArea}>
              <div style={{...s.logoIcon,width:'26px',height:'26px'}}><Hospital size={16} color="white"/></div>
              <span style={{...s.logoText,fontSize:'15px'}}>MediBook</span>
            </div>
            {pendingDoctors > 0
              ? <span style={{...s.navBadge,background:'#ef4444'}}>{pendingDoctors}</span>
              : <div style={{width:'28px'}}/>
            }
          </div>
        )}

        <div style={{padding: isMobile?'16px':'36px 40px'}}>
          {message && (
            <div style={s.toast}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <CheckCircle size={16} color="#4ade80"/>{message}
              </div>
              <button onClick={()=>setMessage('')} style={s.toastClose}><X size={14}/></button>
            </div>
          )}

          {/* Stats */}
          <div style={{...s.statsGrid,...(isMobile?{gridTemplateColumns:'repeat(2,1fr)',gap:'10px',marginBottom:'20px'}:{})}}>
            {stats.map(stat => (
              <div key={stat.label} style={{...s.statCard,borderTop:`2px solid ${stat.color}22`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <h3 style={{...s.statNum,color:stat.color,...(isMobile?{fontSize:'22px'}:{})}}>{stat.value}</h3>
                    <p style={s.statLabel}>{stat.label}</p>
                  </div>
                  <div style={{...s.statIcon,background:`${stat.color}15`,color:stat.color}}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Doctors */}
          {view === 'doctors' && (
            <div>
              <div style={s.sectionHeader}>
                <h2 style={{...s.heading,...(isMobile?{fontSize:'17px'}:{})}}>Manage Doctors</h2>
                <p style={s.subheading}>{doctors.length} doctors · {pendingDoctors} pending</p>
              </div>
              {doctors.length === 0 && <p style={{color:'#334155',fontSize:'14px'}}>No doctors registered yet.</p>}
              {doctors.map(doc => (
                <div key={doc._id} style={{
                  ...s.card,
                  ...(isMobile?{flexDirection:'column',alignItems:'flex-start',gap:'12px'}:{})
                }}>
                  <div style={s.cardLeft}>
                    <img src={doc.photo||avatarUrl(doc.user?.name)} alt="doctor"
                      style={s.avatar} onError={e=>e.target.src=avatarUrl(doc.user?.name)}/>
                    <div>
                      <h4 style={{margin:'0 0 5px 0',color:'#f1f5f9',fontSize:'14px',fontWeight:'600'}}>
                        Dr. {doc.user?.name}
                      </h4>
                      <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                        <div style={s.metaRow}>
                          <Stethoscope size={12} color="#475569"/><span>{doc.specialization}</span>
                          <Building2 size={12} color="#475569"/><span>{doc.department}</span>
                        </div>
                        <div style={s.metaRow}>
                          <IndianRupee size={12} color="#475569"/><span>₹{doc.fees}</span>
                          <Star size={12} color="#475569"/><span>{doc.experience} yrs</span>
                          {doc.roomNumber && <><DoorOpen size={12} color="#475569"/><span>{doc.roomNumber}</span></>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{...s.cardRight,...(isMobile?{width:'100%',justifyContent:'space-between'}:{})}}>
                    {doc.isApproved ? (
                      <span style={{...s.badge,background:'#10b98115',color:'#10b981',border:'1px solid #10b98130',display:'flex',alignItems:'center',gap:'4px'}}>
                        <CheckCircle size={11}/> Approved
                      </span>
                    ) : (
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <span style={{...s.badge,background:'#f59e0b15',color:'#f59e0b',border:'1px solid #f59e0b30',display:'flex',alignItems:'center',gap:'4px'}}>
                          <Clock size={11}/> Pending
                        </span>
                        <button className="approve-btn" style={s.approveBtn} onClick={()=>approveDoctor(doc._id)}>
                          <UserCheck size={13}/> Approve
                        </button>
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
              <div style={s.sectionHeader}>
                <h2 style={{...s.heading,...(isMobile?{fontSize:'17px'}:{})}}>All Users</h2>
                <p style={s.subheading}>{users.length} registered users</p>
              </div>
              {users.map(u => (
                <div key={u._id} style={s.card}>
                  <div style={s.cardLeft}>
                    <img src={avatarUrl(u.name,u.role==='doctor'?'2563eb':u.role==='admin'?'a855f7':'0f766e')}
                      alt="user" style={s.avatar}/>
                    <div>
                      <h4 style={{margin:'0 0 3px 0',color:'#f1f5f9',fontSize:'14px',fontWeight:'600'}}>{u.name}</h4>
                      {!isMobile && <p style={{margin:'0 0 5px 0',color:'#334155',fontSize:'12px'}}>{u.email}</p>}
                      <span style={{
                        ...s.badge,
                        background: u.role==='admin'?'#a855f715':u.role==='doctor'?'#2563eb15':'#10b98115',
                        color: u.role==='admin'?'#a855f7':u.role==='doctor'?'#60a5fa':'#10b981',
                        border: `1px solid ${u.role==='admin'?'#a855f730':u.role==='doctor'?'#2563eb30':'#10b98130'}`,
                        display:'inline-flex',alignItems:'center',gap:'4px'
                      }}>
                        <User size={10}/> {u.role}
                      </span>
                    </div>
                  </div>
                  {u.role !== 'admin' && (
                    <button className="delete-btn" style={{...s.deleteBtn,...(isMobile?{padding:'6px 8px'}:{})}}
                      onClick={()=>deleteUser(u._id, u.name)}>
                      <Trash2 size={13}/>
                      {!isMobile && ' Delete'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Appointments */}
          {view === 'appointments' && (
            <div>
              <div style={s.sectionHeader}>
                <h2 style={{...s.heading,...(isMobile?{fontSize:'17px'}:{})}}>All Appointments</h2>
                <p style={s.subheading}>{appointments.length} total</p>
              </div>
              {appointments.length === 0 && <p style={{color:'#334155',fontSize:'14px'}}>No appointments yet.</p>}
              {appointments.map(apt => {
                const sc = statusConfig[apt.status] || statusConfig.pending;
                return (
                  <div key={apt._id} style={{
                    ...s.card,
                    ...(isMobile?{flexDirection:'column',alignItems:'flex-start',gap:'10px'}:{})
                  }}>
                    <div style={s.cardLeft}>
                      <div style={s.aptIconBox}>
                        <Calendar size={18} color="#475569"/>
                      </div>
                      <div>
                        <h4 style={{margin:'0 0 4px 0',color:'#f1f5f9',fontSize:'13px',fontWeight:'600',display:'flex',alignItems:'center',gap:'5px',flexWrap:'wrap'}}>
                          {apt.patient?.name}
                          <ArrowRight size={12} color="#334155"/>
                          Dr. {apt.doctor?.user?.name}
                        </h4>
                        <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                          <div style={s.metaRow}>
                            <Calendar size={12} color="#475569"/><span>{apt.date}</span>
                            <Clock size={12} color="#475569"/><span>{apt.timeSlot}</span>
                          </div>
                          {apt.symptoms && (
                            <div style={s.metaRow}>
                              <AlertCircle size={12} color="#475569"/><span>{apt.symptoms}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{...s.cardRight,...(isMobile?{width:'100%',justifyContent:'space-between'}:{})}}>
                      <span style={{...s.badge,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,display:'flex',alignItems:'center',gap:'4px'}}>
                        {sc.icon}{apt.status}
                      </span>
                      <button className="delete-btn" style={s.deleteBtn} onClick={()=>deleteAppointment(apt._id)}>
                        <Trash2 size={13}/> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:{display:'flex',minHeight:'100vh',background:'#080c14',fontFamily:'"Inter",system-ui,sans-serif'},
  sidebar:{width:'240px',background:'#0d1117',borderRight:'1px solid #161d2a',padding:'20px 16px',display:'flex',flexDirection:'column'},
  overlay:{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',zIndex:999},
  logoArea:{display:'flex',alignItems:'center',gap:'10px'},
  logoIcon:{width:'32px',height:'32px',background:'#2563eb',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center'},
  logoText:{color:'#f1f5f9',fontWeight:'700',fontSize:'16px',letterSpacing:'-0.3px'},
  profileCard:{display:'flex',alignItems:'center',gap:'10px',padding:'12px',background:'#0f172a',borderRadius:'10px',border:'1px solid #161d2a',marginBottom:'16px'},
  profileAvatar:{width:'36px',height:'36px',borderRadius:'50%',objectFit:'cover',flexShrink:0},
  profileName:{color:'#e2e8f0',margin:0,fontSize:'13px',fontWeight:'600'},
  profileRole:{color:'#a855f7',margin:'1px 0 0 0',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.8px'},
  divider:{height:'1px',background:'#161d2a',margin:'4px 0 12px 0'},
  nav:{background:'transparent',border:'none',color:'#475569',padding:'9px 12px',textAlign:'left',cursor:'pointer',borderRadius:'7px',fontSize:'13px',marginBottom:'2px',width:'100%',display:'flex',alignItems:'center',gap:'9px',fontFamily:'"Inter",sans-serif'},
  navActive:{background:'#161d2a',border:'none',color:'#f1f5f9',padding:'9px 12px',textAlign:'left',cursor:'pointer',borderRadius:'7px',fontSize:'13px',marginBottom:'2px',width:'100%',display:'flex',alignItems:'center',gap:'9px',fontFamily:'"Inter",sans-serif'},
  navBadge:{marginLeft:'auto',background:'#ef4444',color:'white',borderRadius:'10px',padding:'1px 6px',fontSize:'11px',fontWeight:'700'},
  logoutBtn:{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'transparent',border:'1px solid #161d2a',color:'#475569',padding:'9px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',width:'100%',fontFamily:'"Inter",sans-serif'},
  closeBtn:{background:'transparent',border:'none',color:'#64748b',cursor:'pointer',padding:'4px',display:'flex',alignItems:'center'},
  mobileTopBar:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:'#0d1117',borderBottom:'1px solid #161d2a',position:'sticky',top:0,zIndex:100},
  menuBtn:{background:'transparent',border:'none',color:'#94a3b8',cursor:'pointer',display:'flex',alignItems:'center',padding:'4px'},
  main:{flex:1,overflowY:'auto'},
  statsGrid:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'32px'},
  statCard:{background:'#0d1117',border:'1px solid #161d2a',padding:'18px',borderRadius:'11px'},
  statNum:{margin:'0 0 4px 0',fontSize:'28px',fontWeight:'700'},
  statLabel:{margin:0,color:'#334155',fontSize:'12px'},
  statIcon:{width:'32px',height:'32px',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center'},
  sectionHeader:{marginBottom:'20px'},
  heading:{color:'#f1f5f9',margin:'0 0 4px 0',fontSize:'20px',fontWeight:'700',letterSpacing:'-0.3px'},
  subheading:{color:'#334155',fontSize:'13px',margin:0},
  card:{background:'#0d1117',border:'1px solid #161d2a',borderRadius:'11px',padding:'16px',marginBottom:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'},
  cardLeft:{display:'flex',alignItems:'center',gap:'13px'},
  cardRight:{display:'flex',alignItems:'center',gap:'8px'},
  avatar:{width:'44px',height:'44px',borderRadius:'9px',objectFit:'cover',border:'1px solid #161d2a'},
  aptIconBox:{width:'44px',height:'44px',borderRadius:'9px',background:'#161d2a',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  metaRow:{display:'flex',alignItems:'center',gap:'5px',color:'#475569',fontSize:'12px',flexWrap:'wrap'},
  badge:{padding:'3px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.4px'},
  approveBtn:{display:'flex',alignItems:'center',gap:'5px',background:'#052e16',color:'#4ade80',border:'1px solid #14532d',padding:'6px 12px',borderRadius:'7px',cursor:'pointer',fontSize:'12px',fontWeight:'600',fontFamily:'"Inter",sans-serif'},
  deleteBtn:{display:'flex',alignItems:'center',gap:'5px',background:'#1a0505',color:'#f87171',border:'1px solid #2d0a0a',padding:'6px 12px',borderRadius:'7px',cursor:'pointer',fontSize:'12px',fontWeight:'600',fontFamily:'"Inter",sans-serif'},
  toast:{background:'#0a1f12',color:'#4ade80',border:'1px solid #14532d',padding:'11px 16px',borderRadius:'9px',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px'},
  toastClose:{background:'transparent',border:'none',color:'#4ade80',cursor:'pointer',display:'flex',alignItems:'center'},
};

export default AdminDashboard;