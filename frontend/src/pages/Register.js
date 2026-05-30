import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'patient', specialization:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/register', form);
      login(res.data.user, res.data.token);
      navigate(`/${res.data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.leftContent}>
          <h1 style={s.brand}>🏥 MediBook</h1>
          <p style={s.tagline}>Join thousands managing their health smarter.</p>
          <div style={s.roles}>
            <div style={s.roleCard}>
              <span style={s.roleIcon}>🧑‍💼</span>
              <div>
                <p style={s.roleTitle}>Patients</p>
                <p style={s.roleDesc}>Book & manage appointments</p>
              </div>
            </div>
            <div style={s.roleCard}>
              <span style={s.roleIcon}>👨‍⚕️</span>
              <div>
                <p style={s.roleTitle}>Doctors</p>
                <p style={s.roleDesc}>Manage your schedule</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={s.right}>
        <div style={s.card}>
          <h2 style={s.title}>Create account</h2>
          <p style={s.subtitle}>Get started for free</p>
          {error && <div style={s.error}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <label style={s.label}>Full Name</label>
            <input style={s.input} placeholder="John Doe"
              onChange={e=>setForm({...form,name:e.target.value})} required />
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" placeholder="you@example.com"
              onChange={e=>setForm({...form,email:e.target.value})} required />
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" placeholder="••••••••"
              onChange={e=>setForm({...form,password:e.target.value})} required />
            <label style={s.label}>I am a...</label>
            <div style={s.roleToggle}>
              <button type="button"
                style={{...s.toggleBtn, background:form.role==='patient'?'#2563eb':'transparent', color:form.role==='patient'?'white':'#94a3b8'}}
                onClick={()=>setForm({...form,role:'patient'})}>🧑‍💼 Patient</button>
              <button type="button"
                style={{...s.toggleBtn, background:form.role==='doctor'?'#2563eb':'transparent', color:form.role==='doctor'?'white':'#94a3b8'}}
                onClick={()=>setForm({...form,role:'doctor'})}>👨‍⚕️ Doctor</button>
            </div>
            {form.role === 'doctor' && (
              <>
                <label style={s.label}>Specialization</label>
                <input style={s.input} placeholder="e.g. Cardiology"
                  onChange={e=>setForm({...form,specialization:e.target.value})} />
              </>
            )}
            <button style={{...s.btn, opacity:loading?0.7:1}} type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
          <p style={s.footer}>Already have an account? <Link to="/login" style={s.link}>Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:{display:'flex',minHeight:'100vh',fontFamily:'sans-serif'},
  left:{flex:1,background:'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'60px'},
  leftContent:{color:'white'},
  brand:{fontSize:'36px',margin:'0 0 10px 0',letterSpacing:'-1px'},
  tagline:{fontSize:'18px',color:'#94a3b8',margin:'0 0 40px 0'},
  roles:{display:'flex',flexDirection:'column',gap:'15px'},
  roleCard:{display:'flex',alignItems:'center',gap:'15px',background:'rgba(255,255,255,0.05)',padding:'15px 20px',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.1)'},
  roleIcon:{fontSize:'28px'},
  roleTitle:{color:'white',margin:0,fontWeight:'600'},
  roleDesc:{color:'#94a3b8',margin:'2px 0 0 0',fontSize:'13px'},
  right:{width:'480px',background:'#0f172a',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px'},
  card:{width:'100%',maxWidth:'360px'},
  title:{color:'white',fontSize:'28px',margin:'0 0 8px 0',fontWeight:'700'},
  subtitle:{color:'#64748b',margin:'0 0 30px 0',fontSize:'15px'},
  error:{background:'#450a0a',color:'#fca5a5',padding:'12px',borderRadius:'8px',marginBottom:'20px',fontSize:'14px'},
  label:{display:'block',color:'#94a3b8',fontSize:'13px',marginBottom:'6px',marginTop:'18px'},
  input:{width:'100%',padding:'12px 14px',background:'#1e293b',border:'1px solid #334155',borderRadius:'8px',color:'white',fontSize:'14px',boxSizing:'border-box'},
  roleToggle:{display:'flex',gap:'10px',marginTop:'8px'},
  toggleBtn:{flex:1,padding:'10px',border:'1px solid #334155',borderRadius:'8px',cursor:'pointer',fontSize:'14px',fontWeight:'500'},
  btn:{width:'100%',padding:'13px',background:'#2563eb',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'15px',fontWeight:'600',marginTop:'24px'},
  footer:{color:'#64748b',textAlign:'center',marginTop:'24px',fontSize:'14px'},
  link:{color:'#2563eb',textDecoration:'none'},
};

export default Register;