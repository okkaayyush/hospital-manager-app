import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'patient', specialization:'' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/register', form);
      login(res.data.user, res.data.token);
      navigate(`/${res.data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>🏥 Hospital App</h2>
        <h3>Register</h3>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} placeholder="Full Name"
            onChange={e => setForm({...form, name: e.target.value})} />
          <input style={styles.input} placeholder="Email"
            onChange={e => setForm({...form, email: e.target.value})} />
          <input style={styles.input} placeholder="Password" type="password"
            onChange={e => setForm({...form, password: e.target.value})} />
          <select style={styles.input}
            onChange={e => setForm({...form, role: e.target.value})}>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
          {form.role === 'doctor' && (
            <input style={styles.input} placeholder="Specialization"
              onChange={e => setForm({...form, specialization: e.target.value})} />
          )}
          <button style={styles.button} type="submit">Register</button>
        </form>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#f0f2f5' },
  card: { background:'white', padding:'40px', borderRadius:'10px', width:'350px', boxShadow:'0 2px 10px rgba(0,0,0,0.1)', textAlign:'center' },
  input: { width:'100%', padding:'10px', margin:'8px 0', borderRadius:'5px', border:'1px solid #ddd', boxSizing:'border-box' },
  button: { width:'100%', padding:'10px', background:'#2563eb', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', marginTop:'10px' },
  error: { color:'red', fontSize:'14px' }
};

export default Register;