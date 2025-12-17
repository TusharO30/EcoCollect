import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// ✅ Correct Import Path
import { API_BASE_URL } from '../config';

import { Leaf, Mail, Lock, User, MapPin, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    location: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ✅ 1. Register with Live API
      await axios.post(`${API_BASE_URL}/api/auth/register`, formData);

      // ✅ 2. Auto-Login with Live API
      const loginRes = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      // 3. Save Session
      sessionStorage.setItem('token', loginRes.data.token);
      sessionStorage.setItem('role', loginRes.data.user.role);
      sessionStorage.setItem('userId', loginRes.data.user.id);
      
      // Save Name/Email so Dashboard can display it immediately
      sessionStorage.setItem('userName', loginRes.data.user.name); 
      sessionStorage.setItem('userEmail', loginRes.data.user.email);

      // 4. Redirect
      if (loginRes.data.user.role === 'admin') navigate('/admin');
      else if (loginRes.data.user.role === 'collector') navigate('/collector');
      else navigate('/dashboard');

    } catch (err) {
      alert("Registration Failed: " + (err.response?.data?.message || "Server Error"));
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { value: "user", label: "Individual User" },
    { value: "collector", label: "Waste Collector" },
    { value: "admin", label: "Administrator" },
  ];

  return (
    <div className="register-container">
      {/* GLOBAL CSS & ANIMATIONS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', sans-serif; }

        /* Background Mesh Gradient */
        .register-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
          background-image: 
            radial-gradient(at 0% 0%, hsla(152, 76%, 85%, 1) 0, transparent 50%), 
            radial-gradient(at 100% 0%, hsla(190, 80%, 90%, 1) 0, transparent 50%), 
            radial-gradient(at 100% 100%, hsla(152, 60%, 85%, 1) 0, transparent 50%);
          padding: 20px;
        }

        /* Card Styling */
        .register-card {
          width: 100%;
          max-width: 480px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid white;
          border-radius: 24px;
          padding: 48px;
          box-shadow: 
            0 20px 25px -5px rgba(0, 0, 0, 0.05), 
            0 8px 10px -6px rgba(0, 0, 0, 0.01),
            0 0 0 1px rgba(0,0,0,0.02); /* Crisp border */
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Typography */
        .gradient-text {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Inputs */
        .input-group { position: relative; margin-bottom: 20px; }
        .input-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }
        
        .custom-input {
          width: 100%;
          padding: 12px 16px 12px 44px; /* Space for icon */
          background-color: #f1f5f9;
          border: 1px solid transparent;
          border-radius: 12px;
          font-size: 15px;
          color: #1e293b;
          transition: all 0.2s ease;
          outline: none;
        }

        .custom-input:hover { background-color: #e2e8f0; }
        
        .custom-input:focus {
          background-color: white;
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        /* Icons inside inputs */
        .input-icon {
          position: absolute;
          left: 14px;
          top: 38px; /* Adjust based on label height */
          color: #94a3b8;
          transition: color 0.2s;
          pointer-events: none;
        }

        .custom-input:focus ~ .input-icon { color: #10b981; }

        /* Button */
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(180deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
          margin-top: 10px;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        /* Links */
        .link-text {
          text-align: center;
          margin-top: 24px;
          font-size: 14px;
          color: #64748b;
        }
        .link-btn {
          background: none;
          border: none;
          color: #10b981;
          font-weight: 700;
          cursor: pointer;
          padding: 0 0 0 4px;
        }
        .link-btn:hover { text-decoration: underline; }

        /* Logo Animation */
        .logo-wrapper {
          width: 60px;
          height: 60px;
          background: #ecfdf5;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          transform: rotate(-5deg);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
          transition: transform 0.3s;
        }
        .register-card:hover .logo-wrapper { transform: rotate(0deg) scale(1.05); }

      `}</style>

      <div className="register-card">
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div className="logo-wrapper">
            <Leaf size={32} color="#10b981" fill="#10b981" fillOpacity={0.2} />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
            Join <span className="gradient-text">EcoCollect</span>
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>
            Start your journey towards a cleaner planet.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister}>
          
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="custom-input"
            />
            <User size={18} className="input-icon" />
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="custom-input"
            />
            <Mail size={18} className="input-icon" />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="custom-input"
            />
            <Lock size={18} className="input-icon" />
          </div>

          <div className="input-group">
            <label className="input-label">Location</label>
            <input
              type="text"
              name="location"
              placeholder="City, Area"
              value={formData.location}
              onChange={handleChange}
              className="custom-input"
            />
            <MapPin size={18} className="input-icon" />
          </div>

          <div className="input-group">
            <label className="input-label">I am a...</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="custom-input"
              style={{ appearance: 'none', cursor: 'pointer', backgroundColor: 'white' }}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <ShieldCheck size={18} className="input-icon" />
            <div style={{ position: "absolute", right: "16px", top: "38px", pointerEvents: "none", color: "#94a3b8" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="submit-btn">
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Creating Account...
              </>
            ) : (
              <>
                Create Account <ArrowRight size={20} />
              </>
            )}
          </button>

        </form>

        <p className="link-text">
          Already have an account?
          <button type="button" onClick={() => navigate("/")} className="link-btn">
            Sign in
          </button>
        </p>

      </div>
    </div>
  );
}