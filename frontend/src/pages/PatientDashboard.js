import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

function PatientDashboard() {
  const { user, logout } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [view, setView] = useState('doctors'); // 'doctors' or 'appointments'
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingForm, setBookingForm] = useState({ date: '', timeSlot: '', symptoms: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await API.get('/doctors');
      setDoctors(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchAppointments = async () => {
    try {
      const res = await API.get('/appointments/my');
      setAppointments(res.data);
    } catch (err) { console.log(err); }
  };

  const bookAppointment = async (e) => {
    e.preventDefault();
    try {
      await API.post('/appointments', {
        doctorId: selectedDoctor._id,
        ...bookingForm
      });
      setMessage('Appointment booked successfully!');
      setSelectedDoctor(null);
      fetchAppointments();
      setView('appointments');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Booking failed');
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await API.delete(`/appointments/${id}`);
      fetchAppointments();
    } catch (err) { console.log(err); }
  };

  const statusColor = { pending:'#f59e0b', confirmed:'#10b981', cancelled:'#ef4444', completed:'#6366f1' };

  const getAvailableDates = (availableDays) => {
  const dayMap = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 };
  const dates = [];
  const today = new Date();
  // Get next 30 days
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = Object.keys(dayMap).find(k => dayMap[k] === date.getDay());
    if (availableDays.includes(dayName)) {
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  return dates;
};

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <h2 style={s.logo}>🏥 MediBook</h2>
        <p style={s.userInfo}>{user.name}</p>
        <p style={s.userRole}>Patient</p>
        <hr style={{borderColor:'#334155', margin:'20px 0'}}/>
        <button style={view==='doctors'?s.navActive:s.nav} onClick={()=>setView('doctors')}>👨‍⚕️ Find Doctors</button>
        <button style={view==='appointments'?s.navActive:s.nav} onClick={()=>setView('appointments')}>📋 My Appointments</button>
        <button style={s.logoutBtn} onClick={logout}>🚪 Logout</button>
      </div>

      {/* Main Content */}
      <div style={s.main}>
        {message && <div style={s.toast}>{message} <button onClick={()=>setMessage('')} style={s.toastClose}>✕</button></div>}

        {/* Doctors View */}
        {view === 'doctors' && !selectedDoctor && (
          <div>
            <h2 style={s.heading}>Find a Doctor</h2>
            {doctors.length === 0 && <p style={{color:'#94a3b8'}}>No approved doctors yet. Ask admin to approve doctors.</p>}
            <div style={s.grid}>
              {doctors.map(doc => (
                <div key={doc._id} style={s.card}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${doc.user?.name}&background=2563eb&color=fff&size=80`}
                    alt={doc.user?.name}
                    style={s.avatar}
                  />
                  <h3 style={s.docName}>Dr. {doc.user?.name}</h3>
                  <p style={s.spec}>🩺 {doc.specialization}</p>
                  <p style={s.dept}>🏢 {doc.department}</p>
                  <p style={s.fee}>💰 ₹{doc.fees} per visit</p>
                  <p style={s.exp}>⭐ {doc.experience} years experience</p>
                  <button style={s.bookBtn} onClick={()=>setSelectedDoctor(doc)}>Book Appointment</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Form */}
        {view === 'doctors' && selectedDoctor && (
          <div style={s.bookingContainer}>
            <button style={s.back} onClick={()=>setSelectedDoctor(null)}>← Back</button>
            <h2 style={s.heading}>Book with Dr. {selectedDoctor.user?.name}</h2>
            <div style={s.bookingCard}>
              <img
                src={`https://ui-avatars.com/api/?name=${selectedDoctor.user?.name}&background=2563eb&color=fff&size=100`}
                alt={selectedDoctor.user?.name}
                style={{...s.avatar, width:'100px', height:'100px', fontSize:'36px'}}
              />
              <p>🩺 {selectedDoctor.specialization} | 🏢 {selectedDoctor.department}</p>
              <p>💰 ₹{selectedDoctor.fees} | ⭐ {selectedDoctor.experience} yrs exp</p>
              <hr style={{margin:'20px 0', borderColor:'#e2e8f0'}}/>
              <form onSubmit={bookAppointment}>
<label style={s.label}>Select Date</label>
<select style={s.input} onChange={e=>setBookingForm({...bookingForm, date:e.target.value})} required>
  <option value="">Choose a date</option>
  {getAvailableDates(selectedDoctor.availableDays).map(date=>(
    <option key={date} value={date}>{date}</option>
  ))}
</select>
                <label style={s.label}>Select Time Slot</label>
                <select style={s.input} onChange={e=>setBookingForm({...bookingForm, timeSlot:e.target.value})} required>
                  <option value="">Choose a slot</option>
                  {selectedDoctor.availableTimeSlots.map(slot=>(
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                <label style={s.label}>Symptoms / Reason</label>
                <textarea style={{...s.input, height:'80px'}}
                  placeholder="Describe your symptoms..."
                  onChange={e=>setBookingForm({...bookingForm, symptoms:e.target.value})} />
                <button style={s.bookBtn} type="submit">Confirm Booking</button>
              </form>
            </div>
          </div>
        )}

        {/* Appointments View */}
        {view === 'appointments' && (
          <div>
            <h2 style={s.heading}>My Appointments</h2>
            {appointments.length === 0 && <p style={{color:'#94a3b8'}}>No appointments yet. Book one!</p>}
            {appointments.map(apt => (
              <div key={apt._id} style={s.aptCard}>
                <div style={s.aptLeft}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${apt.doctor?.user?.name}&background=2563eb&color=fff&size=50`}
                    alt="doctor"
                    style={{width:'50px',height:'50px',borderRadius:'50%',marginRight:'15px'}}
                  />
                  <div>
                    <h4 style={{margin:0}}>Dr. {apt.doctor?.user?.name}</h4>
                    <p style={{margin:'4px 0',color:'#64748b'}}>📅 {apt.date} at {apt.timeSlot}</p>
                    {apt.symptoms && <p style={{margin:'4px 0',color:'#64748b',fontSize:'13px'}}>🤒 {apt.symptoms}</p>}
                  </div>
                </div>
                <div style={s.aptRight}>
                  <span style={{...s.badge, background:statusColor[apt.status]}}>{apt.status}</span>
                  {apt.status === 'pending' && (
                    <button style={s.cancelBtn} onClick={()=>cancelAppointment(apt._id)}>Cancel</button>
                  )}
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
  page: { display:'flex', minHeight:'100vh', background:'#f8fafc', fontFamily:'sans-serif' },
  sidebar: { width:'240px', background:'#0f172a', color:'white', padding:'30px 20px', display:'flex', flexDirection:'column' },
  logo: { color:'white', margin:'0 0 5px 0', fontSize:'20px' },
  userInfo: { color:'#94a3b8', margin:'0', fontSize:'14px', marginTop:'10px' },
  userRole: { color:'#2563eb', margin:'2px 0', fontSize:'12px', textTransform:'uppercase' },
  nav: { background:'transparent', border:'none', color:'#94a3b8', padding:'12px 15px', textAlign:'left', cursor:'pointer', borderRadius:'8px', fontSize:'14px', marginBottom:'5px' },
  navActive: { background:'#1e293b', border:'none', color:'white', padding:'12px 15px', textAlign:'left', cursor:'pointer', borderRadius:'8px', fontSize:'14px', marginBottom:'5px' },
  logoutBtn: { background:'transparent', border:'1px solid #334155', color:'#94a3b8', padding:'10px', borderRadius:'8px', cursor:'pointer', marginTop:'auto', fontSize:'14px' },
  main: { flex:1, padding:'40px' },
  heading: { color:'#0f172a', marginBottom:'25px' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'20px' },
  card: { background:'white', borderRadius:'12px', padding:'25px', textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', border:'1px solid #e2e8f0' },
  avatar: { width:'80px', height:'80px', borderRadius:'50%', marginBottom:'10px' },
  docName: { margin:'0 0 5px 0', fontSize:'16px', color:'#0f172a' },
  spec: { color:'#2563eb', fontSize:'13px', margin:'4px 0' },
  dept: { color:'#64748b', fontSize:'13px', margin:'4px 0' },
  fee: { color:'#10b981', fontSize:'13px', margin:'4px 0', fontWeight:'bold' },
  exp: { color:'#64748b', fontSize:'13px', margin:'4px 0' },
  bookBtn: { background:'#2563eb', color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', marginTop:'10px', width:'100%', fontWeight:'bold' },
  bookingContainer: { maxWidth:'500px' },
  bookingCard: { background:'white', padding:'30px', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', textAlign:'center' },
  back: { background:'transparent', border:'none', color:'#2563eb', cursor:'pointer', fontSize:'16px', marginBottom:'15px', padding:0 },
  label: { display:'block', textAlign:'left', color:'#374151', fontSize:'14px', marginBottom:'5px', marginTop:'15px' },
  input: { width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #e2e8f0', boxSizing:'border-box', fontSize:'14px' },
  aptCard: { background:'white', borderRadius:'12px', padding:'20px', marginBottom:'15px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' },
  aptLeft: { display:'flex', alignItems:'center' },
  aptRight: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px' },
  badge: { color:'white', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'bold', textTransform:'uppercase' },
  cancelBtn: { background:'#fee2e2', color:'#ef4444', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px' },
  toast: { background:'#10b981', color:'white', padding:'12px 20px', borderRadius:'8px', marginBottom:'20px', display:'flex', justifyContent:'space-between' },
  toastClose: { background:'transparent', border:'none', color:'white', cursor:'pointer', fontSize:'16px' },
};

export default PatientDashboard;