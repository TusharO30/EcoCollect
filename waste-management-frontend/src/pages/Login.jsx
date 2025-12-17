import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Leaf, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Real Backend Connection
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      
      // This ensures data is specific to THIS tab only.
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('role', res.data.user.role);
      sessionStorage.setItem('userId', res.data.user.id);
      sessionStorage.setItem("userName", res.data.user.name); 
      sessionStorage.setItem("userEmail", res.data.user.email);

      // Redirect based on role
      if (res.data.user.role === 'admin') navigate('/admin');
      else if (res.data.user.role === 'collector') navigate('/collector');
      else navigate('/dashboard');
      
    } catch (err) {
      alert("Login Failed: " + (err.response?.data?.message || "Server Error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* GLOBAL CSS & ANIMATIONS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', sans-serif; }

        /* Background Mesh Gradient */
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
          background-image: 
            radial-gradient(at 0% 100%, hsla(152, 76%, 85%, 1) 0, transparent 50%), 
            radial-gradient(at 100% 0%, hsla(190, 80%, 90%, 1) 0, transparent 50%);
          padding: 20px;
        }

        /* Card Styling */
        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid white;
          border-radius: 24px;
          padding: 48px;
          box-shadow: 
            0 20px 25px -5px rgba(0, 0, 0, 0.05), 
            0 8px 10px -6px rgba(0, 0, 0, 0.01),
            0 0 0 1px rgba(0,0,0,0.02);
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
        .input-group { position: relative; margin-bottom: 24px; }
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
          top: 38px;
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

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 32px 0;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background-color: #e2e8f0;
        }
        .divider-text {
          font-size: 12px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Links */
        .link-text {
          text-align: center;
          margin: 0;
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
          width: 64px;
          height: 64px;
          background: #ecfdf5;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          transform: rotate(-5deg);
          box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.15);
          transition: transform 0.3s;
        }
        .login-card:hover .logo-wrapper { transform: rotate(0deg) scale(1.05); }

      `}</style>

      <div className="login-card">
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div className="logo-wrapper">
            <Leaf size={32} color="#10b981" fill="#10b981" fillOpacity={0.2} />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
            Welcome <span className="gradient-text">Back</span>
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>
            Sign in to continue your eco-journey.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="custom-input"
            />
            <Mail size={18} className="input-icon" />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="custom-input"
            />
            <Lock size={18} className="input-icon" />
          </div>

          <button type="submit" disabled={isLoading} className="submit-btn">
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={20} />
              </>
            )}
          </button>

        </form>

        {/* Divider */}
        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">or</span>
          <div className="divider-line" />
        </div>

        {/* Register Link */}
        <p className="link-text">
          Don't have an account?
          <button type="button" onClick={() => navigate("/register")} className="link-btn">
            Create one now
          </button>
        </p>

      </div>
    </div>
  );
}