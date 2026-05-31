import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import useWindowSize from '../hooks/useWindowSize';
import {
  Search, Calendar, Clock, Stethoscope, Building2, DoorOpen,
  IndianRupee, Star, LogOut, ChevronLeft, Printer,
  X, CheckCircle, AlertCircle, XCircle, Inbox, Hospital, Menu
} from 'lucide-react';

function PatientDashboard() {
  const { user, logout } = useAuth();
  const { isMobile } = useWindowSize();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [view, setView] = useState('doctors');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingForm, setBookingForm] = useState({ date:'', timeSlot:'', symptoms:'' });
  const [bookedSlots, setBookedSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [, setLastBooked] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const statusConfig = {
    pending:   { color:'#f59e0b', bg:'#f59e0b15', border:'#f59e0b30', icon:<AlertCircle size={12}/> },
    confirmed: { color:'#10b981', bg:'#10b98115', border:'#10b98130', icon:<CheckCircle size={12}/> },
    cancelled: { color:'#ef4444', bg:'#ef444415', border:'#ef444430', icon:<XCircle size={12}/> },
    completed: { color:'#6366f1', bg:'#6366f115', border:'#6366f130', icon:<CheckCircle size={12}/> },
  };

  useEffect(() => { fetchDoctors(); fetchAppointments(); }, []);

  const fetchDoctors = async () => {
    try { const res = await API.get('/doctors'); setDoctors(res.data); }
    catch (err) { console.log(err); }
  };

  const fetchAppointments = async () => {
    try { const res = await API.get('/appointments/my'); setAppointments(res.data); }
    catch (err) { console.log(err); }
  };

  const fetchBookedSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    try {
      const res = await API.get(`/appointments/booked-slots/${doctorId}/${date}`);
      setBookedSlots(res.data);
    } catch (err) { console.log(err); }
  };

  const handleDateChange = (date) => {
    setBookingForm({ ...bookingForm, date, timeSlot:'' });
    fetchBookedSlots(selectedDoctor._id, date);
  };

  const bookAppointment = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/appointments', { doctorId: selectedDoctor._id, ...bookingForm });
      setLastBooked({ ...res.data, doctor: selectedDoctor, patientName: user.name });
      setMessage('Appointment booked successfully!');
      setSelectedDoctor(null);
      fetchAppointments();
      setView('appointments');
    } catch (err) { setMessage(err.response?.data?.message || 'Booking failed'); }
  };

  const cancelAppointment = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try { await API.delete(`/appointments/${id}`); fetchAppointments(); }
    catch (err) { console.log(err); }
  };

  const printConfirmation = (apt) => {
    const doc = apt.doctor?.user?.name || '';
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Appointment Confirmation</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;max-width:500px;margin:auto}
        h1{color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:10px}
        .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e5e7eb}
        .label{color:#6b7280;font-size:14px}.value{font-weight:600;font-size:14px}
        .badge{background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700}
        .footer{margin-top:30px;text-align:center;color:#9ca3af;font-size:12px}
      </style></head>
      <body>
        <h1>MediBook — Appointment Confirmation</h1>
        <div class="row"><span class="label">Patient</span><span class="value">${user.name}</span></div>
        <div class="row"><span class="label">Doctor</span><span class="value">Dr. ${doc}</span></div>
        <div class="row"><span class="label">Specialization</span><span class="value">${apt.doctor?.specialization||''}</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${apt.date}</span></div>
        <div class="row"><span class="label">Time</span><span class="value">${apt.timeSlot}</span></div>
        <div class="row"><span class="label">Symptoms</span><span class="value">${apt.symptoms||'N/A'}</span></div>
        <div class="row"><span class="label">Status</span><span class="badge">${apt.status}</span></div>
        <div class="footer">Generated on ${new Date().toLocaleString()} · MediBook Hospital System</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const getAvailableDates = (availableDays) => {
    const dayMap = { Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6 };
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = Object.keys(dayMap).find(k => dayMap[k] === date.getDay());
      if (availableDays.includes(dayName)) dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const avatarUrl = (name, bg='2563eb') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'D')}&background=${bg}&color=fff&size=80`;

  const filteredDoctors = doctors.filter(doc =>
    doc.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    doc.specialization?.toLowerCase().includes(search.toLowerCase()) ||
    doc.department?.toLowerCase().includes(search.toLowerCase())
  );

  const specializations = [...new Set(doctors.map(d => d.specialization).filter(Boolean))];
  const pendingCount = appointments.filter(a => a.status === 'pending').length;

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
      <div style={{display:'flex',flexDirection:'column',gap:'0',flex:1}}>
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
          <img src={avatarUrl(user.name,'0f766e')} alt={user.name} style={s.profileAvatar}/>
          <div>
            <p style={s.profileName}>{user.name}</p>
            <p style={s.profileRole}>Patient</p>
          </div>
        </div>

        <div style={s.divider}/>

        <nav style={{display:'flex',flexDirection:'column',gap:'2px'}}>
          <button style={view==='doctors'?s.navActive:s.nav}
            onClick={()=>{setView('doctors');setSelectedDoctor(null);setSidebarOpen(false);}}>
            <Stethoscope size={16}/>
            <span>Find Doctors</span>
          </button>
          <button style={view==='appointments'?s.navActive:s.nav}
            onClick={()=>{setView('appointments');setSidebarOpen(false);}}>
            <Calendar size={16}/>
            <span>My Appointments</span>
            {pendingCount > 0 && <span style={s.navBadge}>{pendingCount}</span>}
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
        input::placeholder, textarea::placeholder { color: #334155; }
        input:focus, textarea:focus, select:focus { border-color: #334155 !important; outline: none; }
        select option { background: #0d1117; color: #f1f5f9; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        .doc-card:hover { border-color: #334155 !important; }
        .book-btn:hover { background: #1d4ed8 !important; }
      `}</style>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div style={s.overlay} onClick={()=>setSidebarOpen(false)}/>
      )}

      <Sidebar/>

      {/* Main */}
      <div style={{...s.main, ...(isMobile?{padding:'0'}:{})}}>

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
            <div style={{width:'36px'}}/>
          </div>
        )}

        <div style={{padding: isMobile ? '16px' : '36px 40px'}}>
          {message && (
            <div style={s.toast}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <CheckCircle size={16} color="#4ade80"/>{message}
              </div>
              <button onClick={()=>setMessage('')} style={s.toastClose}><X size={14}/></button>
            </div>
          )}

          {/* Find Doctors */}
          {view === 'doctors' && !selectedDoctor && (
            <div>
              <div style={s.pageHeader}>
                <div>
                  <h2 style={{...s.heading,...(isMobile?{fontSize:'18px'}:{})}}>Find a Doctor</h2>
                  <p style={s.subheading}>{filteredDoctors.length} doctors available</p>
                </div>
              </div>

              <div style={s.searchWrapper}>
                <Search size={16} color="#475569" style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)'}}/>
                <input style={s.searchInput} placeholder="Search by name, specialization..."
                  value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>

              <div style={s.pillRow}>
                <button style={{...s.pill,...(search===''?s.pillActive:{})}} onClick={()=>setSearch('')}>All</button>
                {specializations.map(spec=>(
                  <button key={spec} style={{...s.pill,...(search===spec?s.pillActive:{})}}
                    onClick={()=>setSearch(spec)}>{spec}</button>
                ))}
              </div>

              {filteredDoctors.length === 0 && (
                <div style={s.emptyState}>
                  <Search size={36} color="#1e293b"/>
                  <p style={{color:'#475569',margin:'12px 0 0 0'}}>No doctors found</p>
                </div>
              )}

              {/* Horizontal Doctor Cards */}
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                {filteredDoctors.map(doc => (
                  <div key={doc._id} className="doc-card" style={s.docCard}>
                    <img
                      src={doc.photo||avatarUrl(doc.user?.name)}
                      alt={doc.user?.name}
                      style={{...s.docCardImg,...(isMobile?{width:'70px',height:'70px'}:{})}}
                      onError={e=>e.target.src=avatarUrl(doc.user?.name)}
                    />
                    <div style={s.docCardBody}>
                      <div style={s.docCardTop}>
                        <div>
                          <h3 style={s.docName}>Dr. {doc.user?.name}</h3>
                          <span style={s.specBadge}>{doc.specialization}</span>
                        </div>
                        <button className="book-btn" style={{...s.bookBtn,...(isMobile?{padding:'8px 12px',fontSize:'12px'}:{})}}
                          onClick={()=>setSelectedDoctor(doc)}>
                          Book
                        </button>
                      </div>
                      <div style={s.docCardMeta}>
                        <div style={s.metaItem}><Building2 size={13} color="#475569"/><span>{doc.department}</span></div>
                        {doc.roomNumber && <div style={s.metaItem}><DoorOpen size={13} color="#475569"/><span>{doc.roomNumber}</span></div>}
                        <div style={s.metaItem}><IndianRupee size={13} color="#10b981"/><span style={{color:'#10b981',fontWeight:'600'}}>₹{doc.fees} per visit</span></div>
                        <div style={s.metaItem}><Star size={13} color="#475569"/><span>{doc.experience} yrs exp</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booking Form */}
          {view === 'doctors' && selectedDoctor && (
            <div style={{maxWidth: isMobile?'100%':'520px'}}>
              <button style={s.backBtn} onClick={()=>setSelectedDoctor(null)}>
                <ChevronLeft size={16}/> Back
              </button>
              <h2 style={{...s.heading,...(isMobile?{fontSize:'18px'}:{})}}>Book Appointment</h2>
              <div style={s.card}>
                <div style={s.bookingDocInfo}>
                  <img src={selectedDoctor.photo||avatarUrl(selectedDoctor.user?.name)}
                    alt={selectedDoctor.user?.name}
                    style={{...s.bookingAvatar,...(isMobile?{width:'52px',height:'52px'}:{})}}
                    onError={e=>e.target.src=avatarUrl(selectedDoctor.user?.name)}/>
                  <div>
                    <h3 style={{margin:'0 0 6px 0',color:'#f1f5f9',fontSize: isMobile?'15px':'16px',fontWeight:'600'}}>
                      Dr. {selectedDoctor.user?.name}
                    </h3>
                    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                      <div style={s.metaItem}><Stethoscope size={13} color="#475569"/><span style={{color:'#94a3b8',fontSize:'13px'}}>{selectedDoctor.specialization}</span></div>
                      <div style={s.metaItem}><Building2 size={13} color="#475569"/><span style={{color:'#94a3b8',fontSize:'13px'}}>{selectedDoctor.department}</span></div>
                      <div style={s.metaItem}><IndianRupee size={13} color="#10b981"/><span style={{color:'#10b981',fontSize:'13px',fontWeight:'600'}}>₹{selectedDoctor.fees} per visit</span></div>
                    </div>
                  </div>
                </div>

                <div style={s.divider}/>

                <form onSubmit={bookAppointment}>
                  <label style={s.label}>Select Date</label>
                  <select style={s.input} onChange={e=>handleDateChange(e.target.value)} required>
                    <option value="">Choose an available date</option>
                    {getAvailableDates(selectedDoctor.availableDays).map(date=>(
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>

                  <label style={s.label}>Select Time Slot</label>
                  <div style={{...s.slotGrid,...(isMobile?{gridTemplateColumns:'repeat(3,1fr)'}:{})}}>
                    {selectedDoctor.availableTimeSlots.map(slot => {
                      const isBooked = bookedSlots.includes(slot);
                      const isSelected = bookingForm.timeSlot === slot;
                      return (
                        <div key={slot} style={{
                          ...s.slotBtn,
                          background: isBooked?'#0d1117':isSelected?'#2563eb':'transparent',
                          color: isBooked?'#1e293b':isSelected?'white':'#64748b',
                          border:`1px solid ${isBooked?'#1e293b':isSelected?'#2563eb':'#1e293b'}`,
                          cursor: isBooked?'not-allowed':'pointer',
                        }} onClick={()=>!isBooked&&bookingForm.date&&setBookingForm({...bookingForm,timeSlot:slot})}>
                          <Clock size={11}/>
                          <div>{slot}</div>
                          {isBooked&&<div style={{fontSize:'9px',color:'#ef4444'}}>BOOKED</div>}
                        </div>
                      );
                    })}
                  </div>
                  {!bookingForm.date&&<p style={{color:'#334155',fontSize:'12px',marginTop:'8px'}}>Select a date first</p>}

                  <label style={s.label}>Symptoms <span style={{color:'#334155',textTransform:'none',letterSpacing:'0'}}>(optional)</span></label>
                  <textarea style={{...s.input,height:'80px',resize:'none'}}
                    placeholder="Describe your symptoms..."
                    onChange={e=>setBookingForm({...bookingForm,symptoms:e.target.value})}/>

                  <button className="book-btn" style={{...s.bookBtn,marginTop:'16px',padding:'13px',borderRadius:'10px',fontSize:'14px',width:'100%'}} type="submit">
                    Confirm Booking
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* My Appointments */}
          {view === 'appointments' && (
            <div>
              <div style={s.pageHeader}>
                <div>
                  <h2 style={{...s.heading,...(isMobile?{fontSize:'18px'}:{})}}>My Appointments</h2>
                  <p style={s.subheading}>{appointments.length} total</p>
                </div>
              </div>

              {appointments.length === 0 && (
                <div style={s.emptyState}>
                  <Inbox size={36} color="#1e293b"/>
                  <p style={{color:'#475569',margin:'12px 0 0 0'}}>No appointments yet</p>
                  <button style={{...s.bookBtn,marginTop:'16px',width:'auto',padding:'10px 20px'}}
                    onClick={()=>setView('doctors')}>Find a Doctor</button>
                </div>
              )}

              {appointments.map(apt => {
                const sc = statusConfig[apt.status] || statusConfig.pending;
                return (
                  <div key={apt._id} style={{...s.aptCard,...(isMobile?{flexDirection:'column',alignItems:'flex-start',gap:'12px'}:{})}}>
                    <div style={s.aptLeft}>
                      <img src={apt.doctor?.photo||avatarUrl(apt.doctor?.user?.name)}
                        alt="doctor" style={s.aptAvatar}
                        onError={e=>e.target.src=avatarUrl(apt.doctor?.user?.name)}/>
                      <div>
                        <h4 style={{margin:'0 0 4px 0',color:'#f1f5f9',fontSize:'14px',fontWeight:'600'}}>
                          Dr. {apt.doctor?.user?.name}
                        </h4>
                        <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                          <div style={s.aptMeta}><Stethoscope size={12} color="#475569"/><span>{apt.doctor?.specialization}</span></div>
                          <div style={s.aptMeta}><Calendar size={12} color="#475569"/><span>{apt.date}</span><Clock size={12} color="#475569"/><span>{apt.timeSlot}</span></div>
                          {apt.symptoms&&<div style={s.aptMeta}><AlertCircle size={12} color="#475569"/><span>{apt.symptoms}</span></div>}
                        </div>
                      </div>
                    </div>
                    <div style={{...s.aptRight,...(isMobile?{width:'100%',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}:{})}}>
                      <span style={{...s.statusBadge,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,display:'flex',alignItems:'center',gap:'4px'}}>
                        {sc.icon}{apt.status}
                      </span>
                      <div style={{display:'flex',gap:'6px'}}>
                        <button style={s.printBtn} onClick={()=>printConfirmation(apt)}>
                          <Printer size={13}/>
                        </button>
                        {apt.status==='pending'&&(
                          <button style={s.cancelBtn} onClick={()=>cancelAppointment(apt._id)}>
                            <X size={13}/> Cancel
                          </button>
                        )}
                      </div>
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
  profileRole:{color:'#2563eb',margin:'1px 0 0 0',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.8px'},
  divider:{height:'1px',background:'#161d2a',margin:'4px 0 12px 0'},
  nav:{background:'transparent',border:'none',color:'#475569',padding:'9px 12px',textAlign:'left',cursor:'pointer',borderRadius:'7px',fontSize:'13px',marginBottom:'2px',width:'100%',display:'flex',alignItems:'center',gap:'9px',fontFamily:'"Inter",sans-serif'},
  navActive:{background:'#161d2a',border:'none',color:'#f1f5f9',padding:'9px 12px',textAlign:'left',cursor:'pointer',borderRadius:'7px',fontSize:'13px',marginBottom:'2px',width:'100%',display:'flex',alignItems:'center',gap:'9px',fontFamily:'"Inter",sans-serif'},
  navBadge:{marginLeft:'auto',background:'#2563eb',color:'white',borderRadius:'10px',padding:'1px 6px',fontSize:'11px',fontWeight:'700'},
  logoutBtn:{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'transparent',border:'1px solid #161d2a',color:'#475569',padding:'9px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',width:'100%',fontFamily:'"Inter",sans-serif'},
  closeBtn:{background:'transparent',border:'none',color:'#64748b',cursor:'pointer',padding:'4px',display:'flex',alignItems:'center'},
  mobileTopBar:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:'#0d1117',borderBottom:'1px solid #161d2a',position:'sticky',top:0,zIndex:100},
  menuBtn:{background:'transparent',border:'none',color:'#94a3b8',cursor:'pointer',display:'flex',alignItems:'center',padding:'4px'},
  main:{flex:1,overflowY:'auto'},
  pageHeader:{marginBottom:'20px'},
  heading:{color:'#f1f5f9',margin:'0 0 4px 0',fontSize:'20px',fontWeight:'700',letterSpacing:'-0.3px'},
  subheading:{color:'#334155',fontSize:'13px',margin:0},
  searchWrapper:{position:'relative',marginBottom:'14px'},
  searchInput:{width:'100%',padding:'11px 14px 11px 42px',background:'#0d1117',border:'1px solid #161d2a',borderRadius:'9px',color:'#f1f5f9',fontSize:'13px',boxSizing:'border-box'},
  pillRow:{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'20px'},
  pill:{padding:'5px 12px',borderRadius:'20px',cursor:'pointer',fontSize:'12px',background:'transparent',color:'#475569',border:'1px solid #161d2a',fontFamily:'"Inter",sans-serif'},
  pillActive:{background:'#2563eb15',color:'#60a5fa',border:'1px solid #2563eb40'},
  // Horizontal doctor card
  docCard:{background:'#0d1117',border:'1px solid #161d2a',borderRadius:'12px',padding:'16px',display:'flex',gap:'16px',alignItems:'flex-start',transition:'border-color 0.2s, transform 0.2s'},
  docCardImg:{width:'88px',height:'88px',borderRadius:'10px',objectFit:'cover',border:'1px solid #161d2a',flexShrink:0},
  docCardBody:{flex:1,minWidth:0},
  docCardTop:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'},
  docCardMeta:{display:'flex',flexWrap:'wrap',gap:'8px 16px'},
  docName:{margin:'0 0 6px 0',fontSize:'15px',color:'#f1f5f9',fontWeight:'600'},
  specBadge:{background:'#2563eb15',color:'#60a5fa',border:'1px solid #2563eb30',padding:'2px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:'600'},
  metaItem:{display:'flex',alignItems:'center',gap:'5px',color:'#475569',fontSize:'12px'},
  bookBtn:{background:'#2563eb',color:'white',border:'none',padding:'9px 16px',borderRadius:'8px',cursor:'pointer',fontWeight:'600',fontSize:'13px',fontFamily:'"Inter",sans-serif',whiteSpace:'nowrap'},
  card:{background:'#0d1117',border:'1px solid #161d2a',borderRadius:'12px',padding:'20px'},
  bookingDocInfo:{display:'flex',gap:'14px',alignItems:'flex-start'},
  bookingAvatar:{width:'64px',height:'64px',borderRadius:'10px',objectFit:'cover',border:'1px solid #161d2a',flexShrink:0},
  backBtn:{display:'flex',alignItems:'center',gap:'4px',background:'transparent',border:'none',color:'#475569',cursor:'pointer',fontSize:'13px',marginBottom:'16px',padding:0,fontFamily:'"Inter",sans-serif'},
  label:{display:'block',color:'#334155',fontSize:'11px',marginBottom:'7px',marginTop:'16px',textTransform:'uppercase',letterSpacing:'0.6px',fontWeight:'600'},
  input:{width:'100%',padding:'10px 13px',background:'#080c14',border:'1px solid #161d2a',borderRadius:'8px',color:'#f1f5f9',fontSize:'13px',boxSizing:'border-box'},
  slotGrid:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'7px',marginTop:'8px'},
  slotBtn:{padding:'8px 4px',borderRadius:'7px',textAlign:'center',fontSize:'12px',fontWeight:'500',transition:'all 0.15s',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'},
  aptCard:{background:'#0d1117',border:'1px solid #161d2a',borderRadius:'11px',padding:'16px',marginBottom:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'},
  aptLeft:{display:'flex',alignItems:'center',gap:'12px'},
  aptAvatar:{width:'44px',height:'44px',borderRadius:'9px',objectFit:'cover',border:'1px solid #161d2a',flexShrink:0},
  aptMeta:{display:'flex',alignItems:'center',gap:'5px',color:'#475569',fontSize:'12px'},
  aptRight:{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'8px'},
  statusBadge:{padding:'3px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.4px'},
  printBtn:{background:'#0f172a',color:'#475569',border:'1px solid #161d2a',padding:'6px 10px',borderRadius:'6px',cursor:'pointer',display:'flex',alignItems:'center',fontFamily:'"Inter",sans-serif'},
  cancelBtn:{background:'#1a0505',color:'#f87171',border:'1px solid #2d0a0a',padding:'6px 10px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',display:'flex',alignItems:'center',gap:'4px',fontFamily:'"Inter",sans-serif'},
  emptyState:{textAlign:'center',padding:'60px 20px',display:'flex',flexDirection:'column',alignItems:'center'},
  toast:{background:'#0a1f12',color:'#4ade80',border:'1px solid #14532d',padding:'11px 16px',borderRadius:'9px',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px'},
  toastClose:{background:'transparent',border:'none',color:'#4ade80',cursor:'pointer',display:'flex',alignItems:'center'},
};

export default PatientDashboard;