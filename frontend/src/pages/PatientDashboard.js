import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

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

  const statusColor = { pending:'#f59e0b', confirmed:'#10b981', cancelled:'#ef4444', completed:'#6366f1' };

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
    const doc = apt.doctor?.user?.name || apt.doctor?.name || '';
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Appointment Confirmation</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;max-width:500px;margin:auto}
        h1{color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:10px}
        .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e5e7eb}
        .label{color:#6b7280;font-size:14px} .value{font-weight:600;font-size:14px}
        .badge{background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700}
        .footer{margin-top:30px;text-align:center;color:#9ca3af;font-size:12px}
      </style></head>
      <body>
        <h1>🏥 MediBook — Appointment Confirmation</h1>
        <div class="row"><span class="label">Patient</span><span class="value">${user.name}</span></div>
        <div class="row"><span class="label">Doctor</span><span class="value">Dr. ${doc}</span></div>
        <div class="row"><span class="label">Specialization</span><span class="value">${apt.doctor?.specialization || ''}</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${apt.date}</span></div>
        <div class="row"><span class="label">Time</span><span class="value">${apt.timeSlot}</span></div>
        <div class="row"><span class="label">Symptoms</span><span class="value">${apt.symptoms || 'N/A'}</span></div>
        <div class="row"><span class="label">Status</span><span class="badge">${apt.status}</span></div>
        <div class="footer">Generated on ${new Date().toLocaleString()} · MediBook Hospital System</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const getAvailableDates = (availableDays) => {
    const dayMap = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 };
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

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div>
          <h2 style={s.logo}>🏥 MediBook</h2>
          <div style={s.sideProfile}>
            <img src={avatarUrl(user.name, '0f766e')} alt={user.name} style={s.sideAvatar} />
            <p style={s.userInfo}>{user.name}</p>
            <p style={s.userRole}>Patient</p>
          </div>
          <hr style={{borderColor:'#1e293b',margin:'20px 0'}}/>
          <button style={view==='doctors'?s.navActive:s.nav} onClick={()=>{setView('doctors');setSelectedDoctor(null);}}>
            👨‍⚕️ Find Doctors
          </button>
          <button style={view==='appointments'?s.navActive:s.nav} onClick={()=>setView('appointments')}>
            📋 My Appointments
            {appointments.filter(a=>a.status==='pending').length > 0 &&
              <span style={s.navBadge}>{appointments.filter(a=>a.status==='pending').length}</span>}
          </button>
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

        {/* Find Doctors */}
        {view === 'doctors' && !selectedDoctor && (
          <div>
            <div style={s.pageHeader}>
              <h2 style={s.heading}>Find a Doctor</h2>
            </div>

            {/* Search + Filter */}
            <div style={s.searchRow}>
              <input
                style={s.searchInput}
                placeholder="🔍 Search by name, specialization, department..."
                value={search}
                onChange={e=>setSearch(e.target.value)}
              />
            </div>

            {/* Specialization Pills */}
            <div style={s.pillRow}>
              <span style={{...s.pill, ...(search===''?s.pillActive:{})}} onClick={()=>setSearch('')}>All</span>
              {specializations.map(spec=>(
                <span key={spec}
                  style={{...s.pill, ...(search===spec?s.pillActive:{})}}
                  onClick={()=>setSearch(spec)}>
                  {spec}
                </span>
              ))}
            </div>

            {filteredDoctors.length === 0 && (
              <div style={s.emptyState}>
                <p style={{fontSize:'40px',margin:0}}>🔍</p>
                <p style={{color:'#475569',margin:'10px 0 0 0'}}>No doctors found</p>
              </div>
            )}

            <div style={s.grid}>
              {filteredDoctors.map(doc => (
                <div key={doc._id} style={s.docCard}>
                  <img
                    src={doc.photo || avatarUrl(doc.user?.name)}
                    alt={doc.user?.name}
                    style={s.docAvatar}
                    onError={e=>e.target.src=avatarUrl(doc.user?.name)}
                  />
                  <h3 style={s.docName}>Dr. {doc.user?.name}</h3>
                  <span style={s.specBadge}>{doc.specialization}</span>
                  <p style={s.docDetail}>🏢 {doc.department}</p>
                  {doc.roomNumber && <p style={s.docDetail}>🚪 {doc.roomNumber}</p>}
                  <p style={s.docFee}>💰 ₹{doc.fees} <span style={{color:'#475569',fontWeight:'400'}}>per visit</span></p>
                  <p style={s.docDetail}>⭐ {doc.experience} yrs experience</p>
                  <button style={s.bookBtn} onClick={()=>setSelectedDoctor(doc)}>Book Appointment</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Form */}
        {view === 'doctors' && selectedDoctor && (
          <div style={{maxWidth:'520px'}}>
            <button style={s.backBtn} onClick={()=>setSelectedDoctor(null)}>← Back to Doctors</button>
            <h2 style={s.heading}>Book Appointment</h2>
            <div style={s.card}>
              {/* Doctor Info */}
              <div style={s.bookingDocInfo}>
                <img
                  src={selectedDoctor.photo || avatarUrl(selectedDoctor.user?.name)}
                  alt={selectedDoctor.user?.name}
                  style={s.bookingAvatar}
                  onError={e=>e.target.src=avatarUrl(selectedDoctor.user?.name)}
                />
                <div>
                  <h3 style={{margin:'0 0 4px 0',color:'#f1f5f9'}}>Dr. {selectedDoctor.user?.name}</h3>
                  <p style={{margin:'2px 0',color:'#94a3b8',fontSize:'13px'}}>🩺 {selectedDoctor.specialization}</p>
                  <p style={{margin:'2px 0',color:'#94a3b8',fontSize:'13px'}}>🏢 {selectedDoctor.department} {selectedDoctor.roomNumber && `· 🚪 ${selectedDoctor.roomNumber}`}</p>
                  <p style={{margin:'2px 0',color:'#10b981',fontSize:'13px',fontWeight:'600'}}>💰 ₹{selectedDoctor.fees} per visit</p>
                </div>
              </div>

              <hr style={{borderColor:'#1e293b',margin:'20px 0'}}/>

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
                      <div key={slot}
                        style={{
                          ...s.slotBtn,
                          background: isBooked ? '#1e293b' : isSelected ? '#2563eb' : '#0a0f1e',
                          color: isBooked ? '#334155' : isSelected ? 'white' : '#94a3b8',
                          border: `1px solid ${isBooked?'#1e293b':isSelected?'#2563eb':'#334155'}`,
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          textDecoration: isBooked ? 'line-through' : 'none',
                        }}
                        onClick={()=>!isBooked && bookingForm.date && setBookingForm({...bookingForm, timeSlot:slot})}>
                        {slot}
                        {isBooked && <div style={{fontSize:'9px',color:'#ef4444',marginTop:'2px'}}>BOOKED</div>}
                      </div>
                    );
                  })}
                </div>
                {!bookingForm.date && <p style={{color:'#475569',fontSize:'12px',marginTop:'8px'}}>Select a date first to see slot availability</p>}

                <label style={s.label}>Symptoms / Reason <span style={{color:'#475569'}}>(optional)</span></label>
                <textarea style={{...s.input, height:'90px', resize:'none'}}
                  placeholder="Describe your symptoms or reason for visit..."
                  onChange={e=>setBookingForm({...bookingForm, symptoms:e.target.value})} />

                <button style={{...s.bookBtn, marginTop:'20px', borderRadius:'10px', padding:'13px'}} type="submit">
                  Confirm Booking →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* My Appointments */}
        {view === 'appointments' && (
          <div>
            <h2 style={s.heading}>My Appointments</h2>
            {appointments.length === 0 && (
              <div style={s.emptyState}>
                <p style={{fontSize:'40px',margin:0}}>📭</p>
                <p style={{color:'#475569',margin:'10px 0 0 0'}}>No appointments yet. Book one!</p>
              </div>
            )}
            {appointments.map(apt => (
              <div key={apt._id} style={s.aptCard}>
                <div style={s.aptLeft}>
                  <img
                    src={apt.doctor?.photo || avatarUrl(apt.doctor?.user?.name)}
                    alt="doctor"
                    style={{width:'48px',height:'48px',borderRadius:'10px',marginRight:'15px',objectFit:'cover'}}
                    onError={e=>e.target.src=avatarUrl(apt.doctor?.user?.name)}
                  />
                  <div>
                    <h4 style={{margin:0,color:'#f1f5f9',fontSize:'15px'}}>Dr. {apt.doctor?.user?.name}</h4>
                    <p style={{margin:'3px 0',color:'#64748b',fontSize:'13px'}}>🩺 {apt.doctor?.specialization}</p>
                    <p style={{margin:'3px 0',color:'#64748b',fontSize:'13px'}}>📅 {apt.date} · ⏰ {apt.timeSlot}</p>
                    {apt.symptoms && <p style={{margin:'3px 0',color:'#64748b',fontSize:'12px'}}>🤒 {apt.symptoms}</p>}
                  </div>
                </div>
                <div style={s.aptRight}>
                  <span style={{
                    ...s.statusBadge,
                    background: statusColor[apt.status]+'22',
                    color: statusColor[apt.status],
                    border: `1px solid ${statusColor[apt.status]}44`
                  }}>{apt.status}</span>
                  <div style={{display:'flex',gap:'8px'}}>
                    <button style={s.printBtn} onClick={()=>printConfirmation(apt)}>🖨 Print</button>
                    {apt.status === 'pending' && (
                      <button style={s.cancelBtn} onClick={()=>cancelAppointment(apt._id)}>✕ Cancel</button>
                    )}
                  </div>
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
  sideAvatar:{width:'60px',height:'60px',borderRadius:'50%',marginBottom:'10px',objectFit:'cover'},
  userInfo:{color:'#e2e8f0',margin:0,fontSize:'14px',fontWeight:'600'},
  userRole:{color:'#2563eb',margin:'2px 0 0 0',fontSize:'11px',textTransform:'uppercase',letterSpacing:'1px'},
  nav:{background:'transparent',border:'none',color:'#64748b',padding:'11px 14px',textAlign:'left',cursor:'pointer',borderRadius:'8px',fontSize:'14px',marginBottom:'4px',width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center'},
  navActive:{background:'#1e293b',border:'none',color:'#f1f5f9',padding:'11px 14px',textAlign:'left',cursor:'pointer',borderRadius:'8px',fontSize:'14px',marginBottom:'4px',width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center'},
  navBadge:{background:'#2563eb',color:'white',borderRadius:'10px',padding:'1px 7px',fontSize:'11px',fontWeight:'700'},
  logoutBtn:{background:'transparent',border:'1px solid #1e293b',color:'#64748b',padding:'10px',borderRadius:'8px',cursor:'pointer',fontSize:'14px',width:'100%'},
  main:{flex:1,padding:'40px',overflowY:'auto'},
  pageHeader:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'},
  heading:{color:'#f1f5f9',margin:'0 0 20px 0',fontSize:'22px',fontWeight:'700'},
  searchRow:{marginBottom:'16px'},
  searchInput:{width:'100%',padding:'12px 16px',background:'#0d1117',border:'1px solid #1e293b',borderRadius:'10px',color:'#f1f5f9',fontSize:'14px',boxSizing:'border-box',outline:'none'},
  pillRow:{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'24px'},
  pill:{padding:'6px 14px',borderRadius:'20px',cursor:'pointer',fontSize:'13px',background:'#0d1117',color:'#64748b',border:'1px solid #1e293b'},
  pillActive:{background:'#2563eb22',color:'#60a5fa',border:'1px solid #2563eb44'},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'16px'},
  docCard:{background:'#0d1117',border:'1px solid #1e293b',borderRadius:'14px',padding:'24px',textAlign:'center'},
  docAvatar:{width:'80px',height:'80px',borderRadius:'50%',marginBottom:'12px',objectFit:'cover',border:'2px solid #1e293b'},
  docName:{margin:'0 0 8px 0',fontSize:'15px',color:'#f1f5f9',fontWeight:'600'},
  specBadge:{background:'#2563eb22',color:'#60a5fa',border:'1px solid #2563eb44',padding:'3px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'600'},
  docDetail:{color:'#64748b',fontSize:'12px',margin:'6px 0'},
  docFee:{color:'#10b981',fontSize:'13px',margin:'6px 0',fontWeight:'700'},
  bookBtn:{background:'#2563eb',color:'white',border:'none',padding:'10px',borderRadius:'8px',cursor:'pointer',marginTop:'12px',width:'100%',fontWeight:'600',fontSize:'13px'},
  card:{background:'#0d1117',border:'1px solid #1e293b',borderRadius:'14px',padding:'28px'},
  bookingDocInfo:{display:'flex',gap:'16px',alignItems:'flex-start'},
  bookingAvatar:{width:'70px',height:'70px',borderRadius:'12px',objectFit:'cover',border:'2px solid #1e293b',flexShrink:0},
  backBtn:{background:'transparent',border:'none',color:'#2563eb',cursor:'pointer',fontSize:'14px',marginBottom:'16px',padding:0},
  label:{display:'block',color:'#64748b',fontSize:'12px',marginBottom:'8px',marginTop:'18px',textTransform:'uppercase',letterSpacing:'0.5px'},
  input:{width:'100%',padding:'11px 14px',background:'#0a0f1e',border:'1px solid #1e293b',borderRadius:'8px',color:'#f1f5f9',fontSize:'14px',boxSizing:'border-box',outline:'none'},
  slotGrid:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginTop:'8px'},
  slotBtn:{padding:'10px 6px',borderRadius:'8px',textAlign:'center',fontSize:'13px',fontWeight:'500',transition:'all 0.15s'},
  aptCard:{background:'#0d1117',border:'1px solid #1e293b',borderRadius:'12px',padding:'18px 20px',marginBottom:'12px',display:'flex',justifyContent:'space-between',alignItems:'center'},
  aptLeft:{display:'flex',alignItems:'center'},
  aptRight:{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'8px'},
  statusBadge:{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px'},
  printBtn:{background:'#1e293b',color:'#94a3b8',border:'1px solid #334155',padding:'6px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'12px'},
  cancelBtn:{background:'#450a0a',color:'#f87171',border:'1px solid #7f1d1d',padding:'6px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'12px'},
  emptyState:{textAlign:'center',padding:'60px 20px'},
  toast:{background:'#052e16',color:'#4ade80',border:'1px solid #14532d',padding:'12px 20px',borderRadius:'10px',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center'},
  toastClose:{background:'transparent',border:'none',color:'#4ade80',cursor:'pointer',fontSize:'16px'},
};

export default PatientDashboard;