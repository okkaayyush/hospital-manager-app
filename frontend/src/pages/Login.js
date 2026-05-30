import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      login(res.data.user, res.data.token);
      navigate(`/${res.data.user.role}`);
    } catch (err) {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.leftContent}>
          <h1 style={s.brand}>🏥 MediBook</h1>
          <p style={s.tagline}>Your health, our priority.</p>
          <div style={s.features}>
            <div style={s.feature}>✅ Book appointments instantly</div>
            <div style={s.feature}>👨‍⚕️ Verified doctors only</div>
            <div style={s.feature}>📋 Track your health history</div>
            <div style={s.feature}>🔒 Secure & private</div>
          </div>
        </div>
      </div>
      <div style={s.right}>
        <div style={s.card}>
          <h2 style={s.title}>Welcome back</h2>
          <p style={s.subtitle}>Sign in to your account</p>
          {error && <div style={s.error}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" placeholder="you@example.com"
              onChange={e=>setForm({...form, email:e.target.value})} required />
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" placeholder="••••••••"
              onChange={e=>setForm({...form, password:e.target.value})} required />
            <button style={{...s.btn, opacity: loading?0.7:1}} type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
          <p style={s.footer}>Don't have an account? <Link to="/register" style={s.link}>Register</Link></p>
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
  features:{display:'flex',flexDirection:'column',gap:'15px'},
  feature:{fontSize:'16px',color:'#cbd5e1',display:'flex',alignItems:'center',gap:'10px'},
  right:{width:'480px',background:'#0f172a',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px'},
  card:{width:'100%',maxWidth:'360px'},
  title:{color:'white',fontSize:'28px',margin:'0 0 8px 0',fontWeight:'700'},
  subtitle:{color:'#64748b',margin:'0 0 30px 0',fontSize:'15px'},
  error:{background:'#450a0a',color:'#fca5a5',padding:'12px',borderRadius:'8px',marginBottom:'20px',fontSize:'14px'},
  label:{display:'block',color:'#94a3b8',fontSize:'13px',marginBottom:'6px',marginTop:'18px'},
  input:{width:'100%',padding:'12px 14px',background:'#1e293b',border:'1px solid #334155',borderRadius:'8px',color:'white',fontSize:'14px',boxSizing:'border-box',outline:'none'},
  btn:{width:'100%',padding:'13px',background:'#2563eb',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'15px',fontWeight:'600',marginTop:'24px'},
  footer:{color:'#64748b',textAlign:'center',marginTop:'24px',fontSize:'14px'},
  link:{color:'#2563eb',textDecoration:'none'},
};

export default Login;