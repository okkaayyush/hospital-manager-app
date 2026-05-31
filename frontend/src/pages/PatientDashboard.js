import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import {
  Search, Calendar, Clock, Stethoscope, Building2, DoorOpen,
  IndianRupee, Star, LogOut, ChevronLeft, Printer,
  X, CheckCircle, AlertCircle, XCircle, Inbox, Hospital
} from 'lucide-react';

function PatientDashboard() {
  const { user, logout } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [view, setView] = useState('doctors');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingForm, setBookingForm] = useState({ date:'', timeSlot:'', symptoms:'' });
  const [bookedSlots, setBookedSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [, setLastBooked] = useState(null);

  const statusConfig = {
    pending:   { color:'#f59e0b', bg:'#f59e0b15', border:'#f59e0b30', icon: <AlertCircle size={12}/> },
    confirmed: { color:'#10b981', bg:'#10b98115', border:'#10b98130', icon: <CheckCircle size={12}/> },
    cancelled: { color:'#ef4444', bg:'#ef444415', border:'#ef444430', icon: <XCircle size={12}/> },
    completed: { color:'#6366f1', bg:'#6366f115', border:'#6366f130', icon: <CheckCircle size={12}/> },
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

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #334155; }
        input:focus, textarea:focus, select:focus { border-color: #334155 !important; outline: none; }
        select option { background: #0d1117; color: #f1f5f9; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        .nav-btn:hover { background: #1e293b !important; color: #f1f5f9 !important; }
        .doc-card:hover { border-color: #334155 !important; transform: translateY(-2px); transition: all 0.2s; }
        .book-btn:hover { background: #1d4ed8 !important; }
        .slot-btn:hover { border-color: #2563eb !important; color: #60a5fa !important; }
      `}</style>

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={{display:'flex',flexDirection:'column',gap:'0',flex:1}}>
          {/* Logo */}
          <div style={s.logoArea}>
            <div style={s.logoIcon}><Hospital size={20} color="white"/></div>
            <span style={s.logoText}>MediBook</span>
          </div>

          {/* Profile */}
          <div style={s.profileCard}>
            <img src={avatarUrl(user.name,'0f766e')} alt={user.name} style={s.profileAvatar}/>
            <div>
              <p style={s.profileName}>{user.name}</p>
              <p style={s.profileRole}>Patient</p>
            </div>
          </div>

          <div style={s.divider}/>

          {/* Nav */}
          <nav style={{display:'flex',flexDirection:'column',gap:'2px'}}>
            <button className="nav-btn" style={view==='doctors'?s.navActive:s.nav}
              onClick={()=>{setView('doctors');setSelectedDoctor(null);}}>
              <Stethoscope size={16}/>
              <span>Find Doctors</span>
            </button>
            <button className="nav-btn" style={view==='appointments'?s.navActive:s.nav}
              onClick={()=>setView('appointments')}>
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

        {/* Find Doctors */}
        {view === 'doctors' && !selectedDoctor && (
          <div>
            <div style={s.pageHeader}>
              <div>
                <h2 style={s.heading}>Find a Doctor</h2>
                <p style={s.subheading}>{filteredDoctors.length} doctors available</p>
              </div>
            </div>

            {/* Search */}
            <div style={s.searchWrapper}>
              <Search size={16} color="#475569" style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)'}}/>
              <input style={s.searchInput} placeholder="Search by name, specialization or department..."
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>

            {/* Filter Pills */}
            <div style={s.pillRow}>
              <button style={{...s.pill,...(search===''?s.pillActive:{})}} onClick={()=>setSearch('')}>All</button>
              {specializations.map(spec=>(
                <button key={spec} style={{...s.pill,...(search===spec?s.pillActive:{})}}
                  onClick={()=>setSearch(spec)}>{spec}</button>
              ))}
            </div>

            {filteredDoctors.length === 0 && (
              <div style={s.emptyState}>
                <Search size={40} color="#1e293b"/>
                <p style={{color:'#475569',margin:'12px 0 0 0',fontSize:'15px'}}>No doctors found</p>
              </div>
            )}

            <div style={s.grid}>
              {filteredDoctors.map(doc => (
                <div key={doc._id} className="doc-card" style={s.docCard}>
                  <img src={doc.photo||avatarUrl(doc.user?.name)} alt={doc.user?.name}
                    style={s.docAvatar} onError={e=>e.target.src=avatarUrl(doc.user?.name)}/>
                  <h3 style={s.docName}>Dr. {doc.user?.name}</h3>
                  <span style={s.specBadge}>{doc.specialization}</span>
                  <div style={s.docMeta}>
                    <div style={s.docMetaRow}><Building2 size={13} color="#475569"/><span>{doc.department}</span></div>
                    {doc.roomNumber && <div style={s.docMetaRow}><DoorOpen size={13} color="#475569"/><span>{doc.roomNumber}</span></div>}
                    <div style={s.docMetaRow}><IndianRupee size={13} color="#10b981"/><span style={{color:'#10b981',fontWeight:'600'}}>₹{doc.fees} per visit</span></div>
                    <div style={s.docMetaRow}><Star size={13} color="#475569"/><span>{doc.experience} yrs experience</span></div>
                  </div>
                  <button className="book-btn" style={s.bookBtn} onClick={()=>setSelectedDoctor(doc)}>
                    Book Appointment
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Form */}
        {view === 'doctors' && selectedDoctor && (
          <div style={{maxWidth:'520px'}}>
            <button style={s.backBtn} onClick={()=>setSelectedDoctor(null)}>
              <ChevronLeft size={16}/> Back to Doctors
            </button>
            <h2 style={s.heading}>Book Appointment</h2>
            <div style={s.card}>
              <div style={s.bookingDocInfo}>
                <img src={selectedDoctor.photo||avatarUrl(selectedDoctor.user?.name)}
                  alt={selectedDoctor.user?.name} style={s.bookingAvatar}
                  onError={e=>e.target.src=avatarUrl(selectedDoctor.user?.name)}/>
                <div>
                  <h3 style={{margin:'0 0 6px 0',color:'#f1f5f9',fontSize:'16px',fontWeight:'600'}}>Dr. {selectedDoctor.user?.name}</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                    <div style={s.docMetaRow}><Stethoscope size={13} color="#475569"/><span style={{color:'#94a3b8',fontSize:'13px'}}>{selectedDoctor.specialization}</span></div>
                    <div style={s.docMetaRow}><Building2 size={13} color="#475569"/><span style={{color:'#94a3b8',fontSize:'13px'}}>{selectedDoctor.department}{selectedDoctor.roomNumber&&` · ${selectedDoctor.roomNumber}`}</span></div>
                    <div style={s.docMetaRow}><IndianRupee size={13} color="#10b981"/><span style={{color:'#10b981',fontSize:'13px',fontWeight:'600'}}>₹{selectedDoctor.fees} per visit</span></div>
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
                <div style={s.slotGrid}>
                  {selectedDoctor.availableTimeSlots.map(slot => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = bookingForm.timeSlot === slot;
                    return (
                      <div key={slot} className={!isBooked?'slot-btn':''} style={{
                        ...s.slotBtn,
                        background: isBooked?'#0d1117':isSelected?'#2563eb':'transparent',
                        color: isBooked?'#1e293b':isSelected?'white':'#64748b',
                        border: `1px solid ${isBooked?'#1e293b':isSelected?'#2563eb':'#1e293b'}`,
                        cursor: isBooked?'not-allowed':'pointer',
                      }} onClick={()=>!isBooked&&bookingForm.date&&setBookingForm({...bookingForm,timeSlot:slot})}>
                        <Clock size={11} style={{marginBottom:'2px'}}/>
                        <div>{slot}</div>
                        {isBooked&&<div style={{fontSize:'9px',color:'#ef4444',marginTop:'1px',letterSpacing:'0.5px'}}>BOOKED</div>}
                      </div>
                    );
                  })}
                </div>
                {!bookingForm.date&&<p style={{color:'#334155',fontSize:'12px',marginTop:'8px'}}>Select a date first to check availability</p>}

                <label style={s.label}>Symptoms / Reason <span style={{color:'#334155',textTransform:'none',letterSpacing:'0'}}>(optional)</span></label>
                <textarea style={{...s.input,height:'90px',resize:'none'}}
                  placeholder="Describe your symptoms or reason for visit..."
                  onChange={e=>setBookingForm({...bookingForm,symptoms:e.target.value})}/>

                <button className="book-btn" style={{...s.bookBtn,marginTop:'20px',padding:'13px',borderRadius:'10px',fontSize:'14px'}} type="submit">
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
                <h2 style={s.heading}>My Appointments</h2>
                <p style={s.subheading}>{appointments.length} total appointments</p>
              </div>
            </div>

            {appointments.length === 0 && (
              <div style={s.emptyState}>
                <Inbox size={40} color="#1e293b"/>
                <p style={{color:'#475569',margin:'12px 0 0 0',fontSize:'15px'}}>No appointments yet</p>
                <button style={{...s.bookBtn,marginTop:'16px',width:'auto',padding:'10px 20px'}}
                  onClick={()=>setView('doctors')}>Find a Doctor</button>
              </div>
            )}

            {appointments.map(apt => {
              const sc = statusConfig[apt.status] || statusConfig.pending;
              return (
                <div key={apt._id} style={s.aptCard}>
                  <div style={s.aptLeft}>
                    <img src={apt.doctor?.photo||avatarUrl(apt.doctor?.user?.name)}
                      alt="doctor" style={s.aptAvatar}
                      onError={e=>e.target.src=avatarUrl(apt.doctor?.user?.name)}/>
                    <div>
                      <h4 style={{margin:'0 0 4px 0',color:'#f1f5f9',fontSize:'15px',fontWeight:'600'}}>
                        Dr. {apt.doctor?.user?.name}
                      </h4>
                      <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                        <div style={s.aptMeta}><Stethoscope size={12} color="#475569"/><span>{apt.doctor?.specialization}</span></div>
                        <div style={s.aptMeta}><Calendar size={12} color="#475569"/><span>{apt.date}</span><Clock size={12} color="#475569"/><span>{apt.timeSlot}</span></div>
                        {apt.symptoms&&<div style={s.aptMeta}><AlertCircle size={12} color="#475569"/><span>{apt.symptoms}</span></div>}
                      </div>
                    </div>
                  </div>
                  <div style={s.aptRight}>
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
  profileRole:{color:'#2563eb',margin:'1px 0 0 0',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.8px'},
  divider:{height:'1px',background:'#161d2a',margin:'4px 0 12px 0'},
  nav:{background:'transparent',border:'none',color:'#475569',padding:'9px 12px',textAlign:'left',cursor:'pointer',borderRadius:'7px',fontSize:'13px',marginBottom:'2px',width:'100%',display:'flex',alignItems:'center',gap:'9px',fontFamily:'"Inter",sans-serif'},
  navActive:{background:'#161d2a',border:'none',color:'#f1f5f9',padding:'9px 12px',textAlign:'left',cursor:'pointer',borderRadius:'7px',fontSize:'13px',marginBottom:'2px',width:'100%',display:'flex',alignItems:'center',gap:'9px',fontFamily:'"Inter",sans-serif'},
  navBadge:{marginLeft:'auto',background:'#2563eb',color:'white',borderRadius:'10px',padding:'1px 6px',fontSize:'11px',fontWeight:'700'},
  logoutBtn:{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'transparent',border:'1px solid #161d2a',color:'#475569',padding:'9px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',width:'100%',fontFamily:'"Inter",sans-serif'},
  main:{flex:1,padding:'36px 40px',overflowY:'auto'},
  pageHeader:{marginBottom:'24px'},
  heading:{color:'#f1f5f9',margin:'0 0 4px 0',fontSize:'20px',fontWeight:'700',letterSpacing:'-0.3px'},
  subheading:{color:'#334155',fontSize:'13px',margin:0},
  searchWrapper:{position:'relative',marginBottom:'14px'},
  searchInput:{width:'100%',padding:'11px 14px 11px 42px',background:'#0d1117',border:'1px solid #161d2a',borderRadius:'9px',color:'#f1f5f9',fontSize:'13px',boxSizing:'border-box'},
  pillRow:{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'24px'},
  pill:{padding:'5px 12px',borderRadius:'20px',cursor:'pointer',fontSize:'12px',background:'transparent',color:'#475569',border:'1px solid #161d2a',fontFamily:'"Inter",sans-serif'},
  pillActive:{background:'#2563eb15',color:'#60a5fa',border:'1px solid #2563eb40'},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:'14px'},
  docCard:{background:'#0d1117',border:'1px solid #161d2a',borderRadius:'12px',padding:'20px',textAlign:'center',transition:'all 0.2s'},
  docAvatar:{width:'72px',height:'72px',borderRadius:'50%',marginBottom:'12px',objectFit:'cover',border:'2px solid #161d2a'},
  docName:{margin:'0 0 6px 0',fontSize:'14px',color:'#f1f5f9',fontWeight:'600'},
  specBadge:{background:'#2563eb15',color:'#60a5fa',border:'1px solid #2563eb30',padding:'2px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:'600'},
  docMeta:{display:'flex',flexDirection:'column',gap:'5px',margin:'10px 0 14px 0',textAlign:'left'},
  docMetaRow:{display:'flex',alignItems:'center',gap:'6px',color:'#475569',fontSize:'12px'},
  bookBtn:{background:'#2563eb',color:'white',border:'none',padding:'9px',borderRadius:'8px',cursor:'pointer',width:'100%',fontWeight:'600',fontSize:'13px',fontFamily:'"Inter",sans-serif'},
  card:{background:'#0d1117',border:'1px solid #161d2a',borderRadius:'12px',padding:'24px'},
  bookingDocInfo:{display:'flex',gap:'14px',alignItems:'flex-start'},
  bookingAvatar:{width:'64px',height:'64px',borderRadius:'10px',objectFit:'cover',border:'1px solid #161d2a',flexShrink:0},
  backBtn:{display:'flex',alignItems:'center',gap:'4px',background:'transparent',border:'none',color:'#475569',cursor:'pointer',fontSize:'13px',marginBottom:'16px',padding:0,fontFamily:'"Inter",sans-serif'},
  label:{display:'block',color:'#334155',fontSize:'11px',marginBottom:'7px',marginTop:'16px',textTransform:'uppercase',letterSpacing:'0.6px',fontWeight:'600'},
  input:{width:'100%',padding:'10px 13px',background:'#080c14',border:'1px solid #161d2a',borderRadius:'8px',color:'#f1f5f9',fontSize:'13px',boxSizing:'border-box'},
  slotGrid:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'7px',marginTop:'8px'},
  slotBtn:{padding:'8px 4px',borderRadius:'7px',textAlign:'center',fontSize:'12px',fontWeight:'500',transition:'all 0.15s',display:'flex',flexDirection:'column',alignItems:'center'},
  aptCard:{background:'#0d1117',border:'1px solid #161d2a',borderRadius:'11px',padding:'16px 18px',marginBottom:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'},
  aptLeft:{display:'flex',alignItems:'center',gap:'14px'},
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