import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Stethoscope, ArrowRight, Hospital, CheckCircle } from 'lucide-react';
import API from '../api';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'patient', specialization:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await API.post(endpoint, form);
      login(res.data.user, res.data.token);
      navigate(`/${res.data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const toggle = () => { setIsLogin(!isLogin); setError(''); };

  const BrandPanel = () => (
    <div style={s.brandInner}>
      <div style={s.brandLogo}><Hospital size={36} color="white" /></div>
      <h1 style={s.brandTitle}>MediBook</h1>
      <p style={s.brandSubtitle}>Your complete hospital appointment management system</p>
      <div style={s.brandFeatures}>
        {['Book appointments with verified doctors','Real-time slot availability','Secure & private health records'].map((f,i) => (
          <div key={i} style={s.brandFeature}>
            <CheckCircle size={15} color="#64748b" style={{flexShrink:0}} />
            <span style={s.brandFeatureText}>{f}</span>
          </div>
        ))}
      </div>
      <div style={s.brandCta}>
        <p style={s.brandCtaText}>{isLogin ? 'New to MediBook?' : 'Already a member?'}</p>
        <button style={s.brandCtaBtn} onClick={toggle}>
          {isLogin ? 'Create an account' : 'Sign in instead'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #3a3a3a; }
        input:focus { border-color: #ffffff !important; outline: none; }
        .panel-slide {
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Left Half */}
      <div style={s.half}>
        <div className="panel-slide" style={{
          width: '100%', height: '100%',
          transform: isLogin ? 'translateX(0)' : 'translateX(100%)',
          position: 'absolute',
          background: '#111111',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '60px 40px',
        }}>
          {/* Login Form */}
          <div style={s.formInner}>
            <div style={s.formHeader}>
              <h2 style={s.formTitle}>Welcome back</h2>
              <p style={s.formSubtitle}>Sign in to your MediBook account</p>
            </div>
            {error && isLogin && <div style={s.error}>{error}</div>}
            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.inputGroup}>
                <Mail size={16} color="#64748b" style={s.inputIcon}/>
                <input style={s.input} type="email" placeholder="Email address"
                  onChange={e=>setForm({...form,email:e.target.value})} required/>
              </div>
              <div style={s.inputGroup}>
                <Lock size={16} color="#64748b" style={s.inputIcon}/>
                <input style={s.input} type="password" placeholder="Password"
                  onChange={e=>setForm({...form,password:e.target.value})} required/>
              </div>
              <button style={{...s.submitBtn,opacity:loading?0.7:1}} type="submit" disabled={loading}>
                {loading?'Signing in...':'Sign In'} {!loading&&<ArrowRight size={16}/>}
              </button>
            </form>
            <p style={s.toggleText}>Don't have an account?
              <button style={s.toggleBtn} onClick={toggle}> Register</button>
            </p>
          </div>
        </div>

        {/* Brand slides in from left during register */}
        <div className="panel-slide" style={{
          width: '100%', height: '100%',
          transform: isLogin ? 'translateX(-100%)' : 'translateX(0)',
          position: 'absolute',
          background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '60px 40px',
        }}>
          <BrandPanel />
        </div>
      </div>

      {/* Right Half */}
      <div style={s.half}>
        {/* Brand on right during login */}
        <div className="panel-slide" style={{
          width: '100%', height: '100%',
          transform: isLogin ? 'translateX(0)' : 'translateX(100%)',
          position: 'absolute',
          background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '60px 40px',
        }}>
          <BrandPanel />
        </div>

        {/* Register Form slides in from right */}
        <div className="panel-slide" style={{
          width: '100%', height: '100%',
          transform: isLogin ? 'translateX(100%)' : 'translateX(0)',
          position: 'absolute',
          background: '#111111',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '60px 40px',
        }}>
          <div style={s.formInner}>
            <div style={s.formHeader}>
              <h2 style={s.formTitle}>Create account</h2>
              <p style={s.formSubtitle}>Join MediBook today</p>
            </div>
            {error && !isLogin && <div style={s.error}>{error}</div>}
            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.inputGroup}>
                <User size={16} color="#64748b" style={s.inputIcon}/>
                <input style={s.input} placeholder="Full Name"
                  onChange={e=>setForm({...form,name:e.target.value})} required/>
              </div>
              <div style={s.inputGroup}>
                <Mail size={16} color="#64748b" style={s.inputIcon}/>
                <input style={s.input} type="email" placeholder="Email address"
                  onChange={e=>setForm({...form,email:e.target.value})} required/>
              </div>
              <div style={s.inputGroup}>
                <Lock size={16} color="#64748b" style={s.inputIcon}/>
                <input style={s.input} type="password" placeholder="Password"
                  onChange={e=>setForm({...form,password:e.target.value})} required/>
              </div>
              <div style={s.roleToggle}>
                <button type="button"
                  style={{...s.roleBtn,...(form.role==='patient'?s.roleBtnActive:{})}}
                  onClick={()=>setForm({...form,role:'patient'})}>
                  <User size={14}/> Patient
                </button>
                <button type="button"
                  style={{...s.roleBtn,...(form.role==='doctor'?s.roleBtnActive:{})}}
                  onClick={()=>setForm({...form,role:'doctor'})}>
                  <Stethoscope size={14}/> Doctor
                </button>
              </div>
              {form.role==='doctor' && (
                <div style={s.inputGroup}>
                  <Stethoscope size={16} color="#64748b" style={s.inputIcon}/>
                  <input style={s.input} placeholder="Specialization"
                    onChange={e=>setForm({...form,specialization:e.target.value})}/>
                </div>
              )}
              <button style={{...s.submitBtn,opacity:loading?0.7:1}} type="submit" disabled={loading}>
                {loading?'Creating...':'Create Account'} {!loading&&<ArrowRight size={16}/>}
              </button>
            </form>
            <p style={s.toggleText}>Already have an account?
              <button style={s.toggleBtn} onClick={toggle}> Sign in</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:{position:'relative',display:'flex',minHeight:'100vh',fontFamily:'"Inter",system-ui,sans-serif',background:'#111111',overflow:'hidden'},
  half:{position:'relative',width:'50%',height:'100vh',overflow:'hidden'},
  formInner:{width:'100%',maxWidth:'340px'},
  formHeader:{marginBottom:'28px'},
  formTitle:{color:'#ffffff',fontSize:'26px',fontWeight:'700',marginBottom:'6px',letterSpacing:'-0.5px'},
  formSubtitle:{color:'#64748b',fontSize:'14px'},
  error:{background:'#1a0a0a',border:'1px solid #3f1f1f',color:'#f87171',padding:'11px 14px',borderRadius:'8px',fontSize:'13px',marginBottom:'16px'},
  form:{display:'flex',flexDirection:'column',gap:'11px'},
  inputGroup:{position:'relative',display:'flex',alignItems:'center'},
  inputIcon:{position:'absolute',left:'13px',pointerEvents:'none'},
  input:{width:'100%',padding:'11px 13px 11px 40px',background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:'8px',color:'#ffffff',fontSize:'14px',transition:'border-color 0.2s'},
  roleToggle:{display:'flex',gap:'8px'},
  roleBtn:{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'9px',border:'1px solid #2a2a2a',borderRadius:'8px',cursor:'pointer',fontSize:'13px',background:'#1a1a1a',color:'#64748b',fontWeight:'500'},
  roleBtnActive:{background:'#ffffff',color:'#000000',border:'1px solid #ffffff'},
  submitBtn:{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',width:'100%',padding:'12px',background:'#ffffff',color:'#000000',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'14px',fontWeight:'600',marginTop:'2px'},
  toggleText:{color:'#64748b',textAlign:'center',marginTop:'18px',fontSize:'13px'},
  toggleBtn:{background:'transparent',border:'none',color:'#ffffff',cursor:'pointer',fontSize:'13px',fontWeight:'600'},
  brandInner:{width:'100%',maxWidth:'340px'},
  brandLogo:{width:'60px',height:'60px',background:'rgba(255,255,255,0.08)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'24px',border:'1px solid rgba(255,255,255,0.1)'},
  brandTitle:{color:'#ffffff',fontSize:'34px',fontWeight:'800',marginBottom:'10px',letterSpacing:'-1px'},
  brandSubtitle:{color:'#94a3b8',fontSize:'14px',marginBottom:'36px',lineHeight:'1.6'},
  brandFeatures:{display:'flex',flexDirection:'column',gap:'13px',marginBottom:'40px'},
  brandFeature:{display:'flex',alignItems:'center',gap:'11px'},
  brandFeatureText:{color:'#cbd5e1',fontSize:'14px'},
  brandCta:{borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:'28px'},
  brandCtaText:{color:'#475569',fontSize:'13px',marginBottom:'10px'},
  brandCtaBtn:{background:'transparent',border:'1px solid rgba(255,255,255,0.15)',color:'#ffffff',padding:'9px 18px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:'500'},
};

export default Auth;