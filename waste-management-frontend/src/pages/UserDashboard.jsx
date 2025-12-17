import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, MapPin, BarChart3, BookOpen, 
  Leaf, Recycle, Mail, MessageCircle, Phone, 
  ChevronLeft, AlertCircle, ArrowRight, X, Send, Bot, Trash2, Star, CheckCircle2, XCircle
} from "lucide-react";

const UserDashboard = () => {
  // --- STATE ---
  const [view, setView] = useState("home"); 
  const [activeGuide, setActiveGuide] = useState(null); 
  const [requests, setRequests] = useState([]);
  
  const [stats, setStats] = useState({
    totalWeight: 0,
    successRate: 0,
    activeUsers: 0
  });

  const [formData, setFormData] = useState({
    wasteType: "Plastic",
    amount: "",
    location: "",
    pickupDate: "",
  });

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showChat, setShowChat] = useState(false); 
  const [emailForm, setEmailForm] = useState({ subject: "", message: "" });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Retrieve User Data from SESSION STORAGE (Fix for multi-tab login issue)
  const userName = sessionStorage.getItem("userName") || "User";
  const userId = sessionStorage.getItem("userId");

  // --- AUTH CHECK & FETCH DATA ---
  useEffect(() => {
    if (!userId) {
      navigate("/"); // Redirect if no user found in this session
    } else {
      fetchData();
    }
  }, [userId, navigate]);

  const fetchData = async () => {
    try {
      // 1. Fetch Requests
      const resRequests = await axios.get(`http://localhost:5000/api/requests/user/${userId}`);
      const requestData = resRequests.data || []; 
      setRequests(requestData);
      calculatePersonalStats(requestData);

      // 2. Fetch Global User Count
      try {
        const resUsers = await axios.get('http://localhost:5000/api/auth/count');
        setStats(prev => ({ ...prev, activeUsers: resUsers.data.count || 0 }));
      } catch (e) {
        console.warn("Could not fetch user count");
      }
      
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const calculatePersonalStats = (data) => {
    if (!data || data.length === 0) {
      setStats(prev => ({ ...prev, totalWeight: 0, successRate: 0 }));
      return;
    }

    let total = 0;
    let completedCount = 0;

    data.forEach(req => {
      if (req.status === 'Completed') {
        completedCount++;
        const weight = parseFloat(String(req.amount).replace(/[^\d.]/g, ''));
        if (!isNaN(weight)) total += weight;
      }
    });

    const rate = Math.round((completedCount / data.length) * 100);
    setStats(prev => ({ ...prev, totalWeight: total, successRate: rate }));
  };

  // --- ACTIONS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/requests/create', { ...formData, userId });
      alert("Pickup Scheduled Successfully! 🌱");
      setFormData({ wasteType: "Plastic", amount: "", location: "", pickupDate: "" });
      fetchData(); 
      setView("history"); 
    } catch (err) {
      alert("Error submitting request.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this pickup?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/requests/delete/${requestId}`);
      alert("✅ Request Cancelled Successfully");
      fetchData(); 
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel request");
    }
  };

  const handleFeedback = async (requestId) => {
    const feedback = prompt("Please rate your experience (1-5) or leave a comment:");
    if (!feedback) return;
    try {
      await axios.put(`http://localhost:5000/api/requests/feedback/${requestId}`, { feedback });
      alert("🌟 Thank you for your feedback!");
      fetchData(); 
    } catch (err) {
      alert("Failed to submit feedback");
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/support', {
        subject: emailForm.subject,
        message: emailForm.message,
        userId: userId
      });
      alert("✅ Message sent to Support Team!");
      setShowEmailModal(false);
      setEmailForm({ subject: "", message: "" });
    } catch (err) {
      alert("Error sending message. Please try again.");
    }
  };

  const handleLogout = () => {
    sessionStorage.clear(); // Clear Session Storage
    navigate("/");
  };

  const openGuide = (guideTitle) => {
    setActiveGuide(guideTitle);
    setView("guide");
  };

  return (
    <div className="app-container">
      {/* GLOBAL STYLES INJECTION */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * { box-sizing: border-box; }
        body { margin: 0; background-color: #f8fafc; font-family: 'Inter', sans-serif; color: #1e293b; }
        
        /* Animations */
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        
        /* Card Hover Effects */
        .hover-card { transition: all 0.3s ease; border: 1px solid #e2e8f0; }
        .hover-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border-color: #10b981; }
        
        /* Buttons */
        .btn-primary { background: #10b981; color: white; transition: all 0.2s; }
        .btn-primary:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .btn-outline { border: 1px solid #e2e8f0; background: white; color: #475569; transition: all 0.2s; }
        .btn-outline:hover { background: #f1f5f9; color: #1e293b; border-color: #cbd5e1; }
        
        /* Inputs */
        .input-field { width: 100%; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; outline: none; transition: all 0.2s; background: #f8fafc; }
        .input-field:focus { border-color: #10b981; background: white; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
        
        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ 
        borderBottom: "1px solid rgba(226, 232, 240, 0.8)", 
        padding: "16px 32px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        position: "sticky", 
        top: 0, 
        background: "rgba(255, 255, 255, 0.8)", 
        backdropFilter: "blur(12px)", 
        zIndex: 50 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setView("home")}>
          <div style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)" }}>
            <Leaf size={22} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px" }}>EcoCollect</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Welcome back, <span style={{color: "#1e293b"}}>{userName}</span></span>
          <button onClick={handleLogout} className="btn-outline" style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
             Sign Out
          </button>
        </div>
      </nav>

      {/* DYNAMIC CONTENT WRAPPER */}
      <div className="fade-in" style={{ minHeight: "calc(100vh - 80px)" }}>
        {view === "home" && <HomeView stats={stats} setView={setView} setShowEmailModal={setShowEmailModal} setShowChat={setShowChat} openGuide={openGuide} />}
        {view === "schedule" && <ScheduleView formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} loading={loading} setView={setView} />}
        {view === "history" && <HistoryView requests={requests} setView={setView} handleCancel={handleCancel} handleFeedback={handleFeedback} />}
        {view === "locations" && <LocationsView setView={setView} />}
        {view === "callsupport" && <CallSupportView setView={setView} />}
        {view === "guide" && <GuideDetailView activeGuide={activeGuide} setView={setView} />}
      </div>

      {/* FOOTER (Only on Home) */}
      {view === "home" && (
        <div style={{ background: "linear-gradient(180deg, #10b981 0%, #047857 100%)", padding: "80px 20px", textAlign: "center", color: "white", marginTop: "40px" }}>
          <h2 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "20px", letterSpacing: "-0.5px" }}>Ready to Make a Difference?</h2>
          <p style={{ maxWidth: "600px", margin: "0 auto 32px", fontSize: "18px", opacity: 0.9 }}>Join our growing community of eco-warriors and start managing your waste responsibly today.</p>
          <button onClick={() => setView("schedule")} style={{ padding: "16px 40px", backgroundColor: "white", color: "#059669", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)", transition: "transform 0.2s" }} onMouseOver={(e) => e.target.style.transform = "scale(1.05)"} onMouseOut={(e) => e.target.style.transform = "scale(1)"}>
            Get Started Now
          </button>
        </div>
      )}

      {/* EMAIL MODAL */}
      {showEmailModal && (
        <div className="fade-in" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "24px", width: "90%", maxWidth: "500px", position: "relative", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <button onClick={() => setShowEmailModal(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "8px", borderRadius: "50%", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#f1f5f9"} onMouseOut={e => e.currentTarget.style.background = "none"}><X size={24} /></button>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ width: "48px", height: "48px", background: "#ecfdf5", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}><Mail color="#10b981" size={24} /></div>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a" }}>Email Support</h2>
              <p style={{ color: "#64748b", marginTop: "8px" }}>We usually respond within 24 hours.</p>
            </div>
            <form onSubmit={handleSendEmail} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div><label style={labelStyle}>Subject</label><input className="input-field" required value={emailForm.subject} onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})} placeholder="How can we help?" /></div>
              <div><label style={labelStyle}>Message</label><textarea className="input-field" style={{ minHeight: "140px", resize: "vertical" }} required value={emailForm.message} onChange={(e) => setEmailForm({...emailForm, message: e.target.value})} placeholder="Describe your issue..." /></div>
              <button type="submit" className="btn-primary" style={{ padding: "14px", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", border: "none" }}><Send size={18} /> Send Message</button>
            </form>
          </div>
        </div>
      )}

      {/* CHATBOT TRIGGER */}
      <div style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 999 }}>
        {!showChat ? (
          <button onClick={() => setShowChat(true)} style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#10b981", color: "white", border: "none", cursor: "pointer", boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.1) rotate(-5deg)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1) rotate(0)"}>
            <MessageCircle size={32} fill="white" />
          </button>
        ) : (
          <ChatWidget onClose={() => setShowChat(false)} />
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS (With Improved Styling) ---

const HomeView = ({ stats, setView, setShowEmailModal, setShowChat, openGuide }) => (
  <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
    <div style={{ textAlign: "center", padding: "80px 20px 60px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", backgroundColor: "#ecfdf5", color: "#059669", borderRadius: "99px", fontSize: "13px", fontWeight: "700", marginBottom: "24px", border: "1px solid #d1fae5" }}>
         <span style={{ width: "8px", height: "8px", background: "#10b981", borderRadius: "50%" }}></span> Live Dashboard
      </div>
      <h1 style={{ fontSize: "56px", fontWeight: "800", color: "#0f172a", marginBottom: "24px", lineHeight: "1.1", letterSpacing: "-1.5px" }}>Sustainable Waste <br /><span style={{ color: "#10b981", backgroundImage: "linear-gradient(to right, #10b981, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Management Simplified</span></h1>
      <p style={{ fontSize: "20px", color: "#64748b", maxWidth: "600px", margin: "0 auto 48px", lineHeight: "1.6" }}>Join thousands making a difference. Schedule pickups, track your environmental impact, and learn how to recycle better.</p>
      
      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "40px" }}>
        <StatCard icon={<BarChart3 color="#10b981" size={32}/>} value={`${stats.totalWeight} kg`} label="Total Recycled" bg="#ecfdf5" border="#10b981" />
        <StatCard icon={<Recycle color="#3b82f6" size={32}/>} value={`${stats.successRate}%`} label="Success Rate" bg="#eff6ff" border="#3b82f6" />
        <StatCard icon={<Leaf color="#f59e0b" size={32}/>} value={`${stats.activeUsers}+`} label="Active Community" bg="#fffbeb" border="#f59e0b" />
      </div>
    </div>
    
    {/* Quick Actions */}
    <div style={{ padding: "40px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.5px" }}>Quick Actions</h2>
        <div style={{ height: "1px", flex: 1, background: "#e2e8f0" }}></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
        <ActionCard icon={<Calendar size={28} color="#10b981" />} title="Schedule Pickup" desc="Book waste collection in seconds" onClick={() => setView("schedule")} color="#10b981" />
        <ActionCard icon={<MapPin size={28} color="#3b82f6" />} title="Find Drop Points" desc="Locate nearby authorized centers" onClick={() => setView("locations")} color="#3b82f6" />
        <ActionCard icon={<BarChart3 size={28} color="#8b5cf6" />} title="Track Impact" desc="Visualize your contribution" onClick={() => setView("history")} color="#8b5cf6" />
        <ActionCard icon={<BookOpen size={28} color="#f59e0b" />} title="Learn More" desc="Educational recycling guides" onClick={() => document.getElementById('guides').scrollIntoView({ behavior: 'smooth' })} color="#f59e0b" />
      </div>
    </div>

    {/* Guides */}
    <div id="guides" style={{ padding: "40px 0" }}>
       <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.5px" }}>Recycling Guides</h2>
        <div style={{ height: "1px", flex: 1, background: "#e2e8f0" }}></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
        <GuideCard icon={<Recycle />} title="Plastic Waste" desc="Learn which plastics are recyclable." onClick={() => openGuide("Plastic Waste")} />
        <GuideCard icon={<Leaf />} title="Organic Waste" desc="Composting techniques." onClick={() => openGuide("Organic Waste")} />
        <GuideCard icon={<BarChart3 />} title="E-Waste" desc="Safe disposal for electronics." onClick={() => openGuide("E-Waste")} />
        <GuideCard icon={<AlertCircle />} title="Hazardous" desc="Handling paints & chemicals." onClick={() => openGuide("Hazardous")} />
      </div>
    </div>

    {/* Support */}
    <div style={{ padding: "60px 0" }}>
      <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "32px", color: "#0f172a", textAlign: "center" }}>Need Assistance?</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        <ContactCard icon={<Mail size={24} color="#10b981"/>} title="Email Support" sub="Get answers within 24 hours" action="support@ecocollect.com" btnText="Send Email" onClick={() => setShowEmailModal(true)} />
        <ContactCard icon={<MessageCircle size={24} color="#3b82f6"/>} title="Live Chat" sub="Chat with our smart assistant" action="Available 24/7" btnText="Start Chat" onClick={() => setShowChat(true)} />
        <ContactCard icon={<Phone size={24} color="#f59e0b"/>} title="Phone Support" sub="Speak directly with an agent" action="1-800-ECO-COLLECT" btnText="Call Now" onClick={() => setView("callsupport")} />
      </div>
    </div>
  </div>
);

const ScheduleView = ({ formData, setFormData, handleSubmit, loading, setView }) => (
  <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 20px" }}>
    <button onClick={() => setView("home")} className="btn-outline" style={backBtnStyle}><ChevronLeft size={18} /> Back to Dashboard</button>
    <div className="fade-in" style={formCardStyle}>
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", background: "#ecfdf5", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
           <Calendar size={32} color="#10b981" />
        </div>
        <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>Schedule Pickup</h2>
        <p style={{ color: "#64748b" }}>Fill in the details below to arrange a collection.</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div><label style={labelStyle}>Waste Type</label><select className="input-field" value={formData.wasteType} onChange={(e) => setFormData({...formData, wasteType: e.target.value})}><option value="Plastic">♻️ Plastic</option><option value="Organic">🌱 Organic</option><option value="E-Waste">💻 E-Waste</option><option value="Metal">🔩 Metal</option></select></div>
        <div><label style={labelStyle}>Estimated Amount (kg)</label><input className="input-field" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="e.g. 5.5" /></div>
        <div><label style={labelStyle}>Pickup Address</label><input className="input-field" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Enter full address" /></div>
        <div><label style={labelStyle}>Preferred Date</label><input type="date" className="input-field" required value={formData.pickupDate} onChange={(e) => setFormData({...formData, pickupDate: e.target.value})} /></div>
        <button type="submit" disabled={loading} className="btn-primary" style={{ ...primaryBtnStyle, marginTop: "16px" }}>{loading ? "Scheduling..." : "Confirm Pickup"}</button>
      </form>
    </div>
  </div>
);

const HistoryView = ({ requests, setView, handleCancel, handleFeedback }) => (
  <div style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px" }}>
    <button onClick={() => setView("home")} className="btn-outline" style={backBtnStyle}><ChevronLeft size={18} /> Back to Dashboard</button>
    <div className="fade-in" style={{ ...formCardStyle, padding: "0", overflow: "hidden" }}>
      <div style={{ padding: "32px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
         <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Pickup History</h2>
         <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", background: "#f1f5f9", padding: "6px 12px", borderRadius: "99px" }}>{requests.length} Requests</span>
      </div>
      
      {requests.length === 0 ? <div style={{textAlign:"center", padding:"60px 20px", color:"#64748b"}}><Leaf size={48} color="#cbd5e1" style={{marginBottom: "16px"}}/><p>No pickup history found yet.</p></div> : 
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr style={{ textAlign: "left", color: "#64748b", fontSize: "12px", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{padding:"16px 24px", fontWeight: "600"}}>Type</th>
                <th style={{padding:"16px 24px", fontWeight: "600"}}>Date</th>
                <th style={{padding:"16px 24px", fontWeight: "600"}}>Status</th>
                <th style={{padding:"16px 24px", fontWeight: "600", textAlign: "right"}}>Actions</th>
              </tr>
            </thead>
            <tbody>{requests.map((req) => (
              <tr key={req._id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#fcfcfc"} onMouseOut={e => e.currentTarget.style.background = "white"}>
                <td style={{padding:"20px 24px", fontWeight: "600", color: "#334155"}}>{req.wasteType}</td>
                <td style={{padding:"20px 24px", color: "#64748b"}}>{new Date(req.pickupDate).toLocaleDateString()}</td>
                <td style={{padding:"20px 24px"}}>
                  <span style={{ 
                    padding: "6px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px",
                    backgroundColor: req.status === "Completed" ? "#dcfce7" : req.status === "Pending" ? "#fef3c7" : "#fee2e2",
                    color: req.status === "Completed" ? "#166534" : req.status === "Pending" ? "#b45309" : "#991b1b"
                  }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "currentColor" }}></span>
                    {req.status}
                  </span>
                </td>
                <td style={{padding:"20px 24px", textAlign: "right"}}>
                  {req.status === 'Pending' && (
                    <button onClick={() => handleCancel(req._id)} style={{ color: "#ef4444", background: "white", border: "1px solid #fee2e2", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" }} onMouseOver={e => {e.currentTarget.style.background = "#fee2e2";}} onMouseOut={e => {e.currentTarget.style.background = "white";}}>
                      <Trash2 size={14} /> Cancel
                    </button>
                  )}
                  {req.status === 'Completed' && (
                    <button onClick={() => handleFeedback(req._id)} style={{ color: "#d97706", background: "white", border: "1px solid #fef3c7", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" }} onMouseOver={e => {e.currentTarget.style.background = "#fffbeb";}} onMouseOut={e => {e.currentTarget.style.background = "white";}}>
                      <Star size={14} /> {req.feedback ? "Rated" : "Rate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      }
    </div>
  </div>
);

const LocationsView = ({ setView }) => (
  <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
    <button onClick={() => setView("home")} className="btn-outline" style={backBtnStyle}><ChevronLeft size={18} /> Back</button>
    <div className="fade-in" style={{ ...formCardStyle, textAlign: "center", padding: "80px 40px" }}>
      <div style={{ width: "80px", height: "80px", background: "#ecfdf5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
        <MapPin size={40} color="#10b981" />
      </div>
      <h2 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>Map View Coming Soon</h2>
      <p style={{ color: "#64748b", maxWidth: "400px", margin: "0 auto 32px" }}>We are integrating Google Maps to help you find the nearest drop-off points efficiently.</p>
      <button onClick={() => setView("home")} className="btn-outline" style={{ padding: "12px 32px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Return Home</button>
    </div>
  </div>
);

const CallSupportView = ({ setView }) => (
  <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
    <button onClick={() => setView("home")} className="btn-outline" style={backBtnStyle}><ChevronLeft size={18} /> Back</button>
    <div className="fade-in" style={{ ...formCardStyle, textAlign: "center", padding: "80px 40px" }}>
      <div style={{ margin: "0 auto 24px", width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
         <Phone size={40} color="#d97706" />
      </div>
      <h2 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>Phone Lines Closed</h2>
      <p style={{ color: "#64748b", fontSize: "18px", maxWidth: "500px", margin: "0 auto 32px" }}>
        We are upgrading our call center infrastructure. Please use the Live Chat for immediate assistance. 📞
      </p>
      <button onClick={() => setView("home")} className="btn-outline" style={{ padding: "12px 32px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Return Home</button>
    </div>
  </div>
);

// ✅ RICH GUIDE CONTENT
const guideContents = {
  "Plastic Waste": {
    intro: "Plastic is one of the most common waste types. Proper sorting ensures it gets recycled into new products instead of ending up in landfills.",
    steps: [
      "Check the Resin ID Code (usually 1, 2, or 5 are recyclable).",
      "Rinse bottles and containers to remove food residue.",
      "Crush bottles to save space in the bin.",
      "Keep caps on bottles if your local facility accepts them."
    ],
    avoid: "Do not include plastic bags (they jam machines), styrofoam, or heavily soiled food containers.",
    proTip: "If you can poke your finger through the plastic (like cling wrap), it usually cannot be recycled in standard curbside bins."
  },
  "Organic Waste": {
    intro: "Organic waste is biodegradable material that can be composted to create nutrient-rich soil.",
    steps: [
      "Collect fruit and vegetable peels.",
      "Include coffee grounds, tea bags, and eggshells.",
      "Yard trimmings like leaves and grass are excellent.",
      "Use a small kitchen bin to transfer scraps daily."
    ],
    avoid: "Do not compost meat, dairy, or oily foods as they attract pests. Avoid pet waste and diseased plants.",
    proTip: "Balance your 'Greens' (food scraps) with 'Browns' (dried leaves/paper) to prevent odors."
  },
  "E-Waste": {
    intro: "Electronic waste contains hazardous materials like lead and mercury, but also valuable metals like gold and copper.",
    steps: [
      "Gather old phones, cables, batteries, and laptops.",
      "Wipe data from devices before disposal.",
      "Tape the ends of loose batteries to prevent short circuits.",
      "Keep devices dry and intact."
    ],
    avoid: "Never throw electronics in the general trash. Do not dismantle CRT monitors or swollen batteries yourself.",
    proTip: "Many electronics retailers offer trade-in programs for old devices!"
  },
  "Hazardous": {
    intro: "Hazardous waste poses a threat to public health or the environment if handled improperly.",
    steps: [
      "Identify items like paint, motor oil, pesticides, and cleaning chemicals.",
      "Keep products in their original containers with labels.",
      "Seal containers tightly to prevent leaks.",
      "Store in a cool, dry place away from children until pickup."
    ],
    avoid: "Never pour chemicals down the drain or storm sewer. Do not mix different chemicals together.",
    proTip: "Dried-out latex paint can sometimes be disposed of in regular trash, but oil-based paint must always be treated as hazardous."
  }
};

const GuideDetailView = ({ activeGuide, setView }) => {
  const content = guideContents[activeGuide] || {
    intro: "Guide content not available.",
    steps: [],
    avoid: "",
    proTip: ""
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <button onClick={() => setView("home")} className="btn-outline" style={backBtnStyle}><ChevronLeft size={18} /> Back to Guides</button>
      <div className="fade-in" style={{ ...formCardStyle, padding: "60px 40px" }}>
        <div style={{ textAlign: "center" }}>
          <Leaf size={64} color="#10b981" style={{ marginBottom: "24px", display: "inline-block" }} />
          <h1 style={{ fontSize: "36px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>{activeGuide} Disposal Guide</h1>
          <div style={{ width: "60px", height: "4px", background: "#10b981", borderRadius: "2px", margin: "0 auto 32px" }}></div>
        </div>
        
        <div style={{ lineHeight: "1.8", color: "#334155", fontSize: "16px" }}>
          <p style={{ fontSize: "18px", marginBottom: "32px", textAlign: "center", color: "#475569" }}>{content.intro}</p>
          
          <div style={{ display: "grid", gap: "32px" }}>
            
            {/* Steps Section */}
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <CheckCircle2 color="#10b981" /> How to Prepare
              </h3>
                            <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "12px" }}>
                {content.steps.map((step, i) => (
                  <li key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ minWidth: "24px", height: "24px", background: "#10b981", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700" }}>{i+1}</div>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Avoid Section */}
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <XCircle color="#ef4444" /> What to Avoid
              </h3>
              <div style={{ background: "#fef2f2", padding: "20px", borderRadius: "12px", border: "1px solid #fee2e2", color: "#b91c1c", display: "flex", gap: "16px" }}>
                <AlertCircle size={24} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0 }}>{content.avoid}</p>
              </div>
            </div>

            {/* Pro Tip */}
            <div style={{ background: "#ecfdf5", padding: "24px", borderRadius: "12px", borderLeft: "4px solid #10b981" }}>
              <h3 style={{ margin: "0 0 8px", color: "#065f46", fontSize: "18px", fontWeight: "700" }}>🌟 Pro Tip</h3>
              <p style={{ margin: 0, color: "#047857" }}>{content.proTip}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// --- CHAT WIDGET ---
const ChatWidget = ({ onClose }) => {
  const [messages, setMessages] = useState([{ text: "Hi! I'm EcoBot 🤖. How can I help you recycle today?", sender: "bot" }]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTimeout(() => {
      const botResponse = getBotResponse(userMsg.text);
      setMessages((prev) => [...prev, { text: botResponse, sender: "bot" }]);
    }, 600);
  };

  const getBotResponse = (text) => {
    const lower = text.toLowerCase();

    // --- 1. GREETINGS & NAVIGATION ---
    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) 
      return "Hello! 👋 I can help you categorize waste. Try asking 'Where does a banana peel go?'";
    
    if (lower.includes("schedule") || lower.includes("pickup")) 
      return "You can schedule a pickup by clicking the 'Schedule Pickup' card on your dashboard! 🚛";


    //  ORGANIC
    if (["food", "banana", "apple", "fruit", "vegetable", "peel", "leftover", "leaf", "plant", "organic", "egg"].some(k => lower.includes(k))) 
      return "That belongs in **Organic Waste** 🌱. It's perfect for composting!";

    // PLASTIC
    if (["plastic", "bottle", "bag", "wrapper", "container", "straw", "polythene", "jug", "cup"].some(k => lower.includes(k))) 
      return "That goes in **Plastic Waste** ♻️. Please ensure it's clean and dry before recycling.";

    // E-WASTE
    if (["phone", "computer", "laptop", "battery", "batteries", "wire", "charger", "electronic", "bulb", "circuit", "tv"].some(k => lower.includes(k))) 
      return "That is **E-Waste** 💻. Please do NOT throw this in the bin! Schedule a special E-Waste pickup.";

    // METAL
    if (["metal", "can", "tin", "aluminum", "foil", "copper", "iron", "steel", "screw", "nail"].some(k => lower.includes(k))) 
      return "That counts as **Metal Waste** 🔩. It is highly recyclable!";

    // PAPER/CARDBOARD (Bonus)
    if (["paper", "cardboard", "box", "newspaper", "magazine", "book"].some(k => lower.includes(k))) 
      return "Clean paper goes in **Dry Recyclables** 📄. However, if it's greasy (like a pizza box), please treat it as general/organic waste.";

    // --- 3. FALLBACK ---
    return "I'm not sure about that one yet! 🧐 Try asking about specific items like 'bottles', 'batteries', or 'food scraps'.";
  };

  return (
    <div className="fade-in" style={{ width: "380px", height: "550px", backgroundColor: "white", borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #e2e8f0" }}>
      <div style={{ backgroundColor: "#10b981", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "white", padding: "6px", borderRadius: "50%" }}><Bot size={20} color="#10b981" /></div>
          <div>
             <span style={{ fontWeight: "700", fontSize: "16px", display: "block" }}>EcoBot Support</span>
             <span style={{ fontSize: "12px", opacity: 0.9 }}>Online</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", cursor: "pointer", borderRadius: "50%", padding: "6px", display: "flex" }}><X size={18} /></button>
      </div>
      <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "#f8fafc" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", 
            maxWidth: "80%", 
            padding: "12px 16px", 
            borderRadius: "16px", 
            borderBottomRightRadius: msg.sender === "user" ? "4px" : "16px",
            borderBottomLeftRadius: msg.sender === "bot" ? "4px" : "16px",
            fontSize: "14px", 
            lineHeight: "1.5", 
            backgroundColor: msg.sender === "user" ? "#10b981" : "white", 
            color: msg.sender === "user" ? "white" : "#334155", 
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            border: msg.sender === "bot" ? "1px solid #e2e8f0" : "none" 
          }}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ padding: "16px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "10px", backgroundColor: "white" }}>
        <input style={{ flex: 1, padding: "12px 16px", borderRadius: "99px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", background: "#f8fafc" }} placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit" style={{ backgroundColor: "#10b981", color: "white", border: "none", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 6px rgba(16, 185, 129, 0.2)" }}><Send size={18} /></button>
      </form>
    </div>
  );
};

// --- STYLES & HELPER COMPONENTS ---
const StatCard = ({ icon, value, label, bg, border }) => (
  <div className="hover-card" style={{ padding: "32px", borderRadius: "20px", background: "white", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: border }}></div>
    <div style={{ marginBottom: "20px", padding: "16px", backgroundColor: bg, borderRadius: "50%", width: "fit-content" }}>{icon}</div>
    <h3 style={{ fontSize: "40px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px", letterSpacing: "-1px" }}>{value}</h3>
    <p style={{ color: "#64748b", margin: 0, fontWeight: "500", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
  </div>
);

const ActionCard = ({ icon, title, desc, onClick, color }) => (
  <div onClick={onClick} className="hover-card" style={{ padding: "32px", borderRadius: "20px", background: "white", cursor: "pointer", textAlign: "left", position: "relative" }}>
    <div style={{ marginBottom: "20px", width: "56px", height: "56px", borderRadius: "14px", backgroundColor: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: color }}>{icon}</div>
    <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>{title}</h3>
    <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.5" }}>{desc}</p>
    <div style={{ position: "absolute", bottom: "32px", right: "32px", opacity: 0.5 }}>
      <ArrowRight size={20} color={color} />
    </div>
  </div>
);

const GuideCard = ({ icon, title, desc, onClick }) => (
  <div className="hover-card" style={{ padding: "24px", borderRadius: "16px", background: "white", display: "flex", flexDirection: "column", height: "100%" }}>
    <div style={{ marginBottom: "16px", padding: "10px", backgroundColor: "#f0fdf4", borderRadius: "10px", width: "fit-content", color: "#15803d" }}>{icon}</div>
    <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", color: "#0f172a" }}>{title}</h3>
    <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px", flex: 1, lineHeight: "1.5" }}>{desc}</p>
    <button onClick={onClick} style={{ background: "none", border: "none", color: "#10b981", fontWeight: "700", cursor: "pointer", textAlign: "left", padding: 0, display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
      Read Guide <ArrowRight size={16}/>
    </button>
  </div>
);

const ContactCard = ({ icon, title, sub, action, btnText, onClick }) => (
  <div className="hover-card" style={{ padding: "32px", borderRadius: "20px", background: "white", textAlign: "center" }}>
    <div style={{ margin: "0 auto 20px", width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
    <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "#0f172a" }}>{title}</h3>
    <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>{sub}</p>
    <p style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", marginBottom: "24px", background: "#f1f5f9", padding: "8px", borderRadius: "6px", display: "inline-block" }}>{action}</p>
    <br/>
    <button onClick={onClick} className="btn-outline" style={{ padding: "10px 24px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", width: "100%" }}>{btnText}</button>
  </div>
);

const formCardStyle = { padding: "48px", borderRadius: "24px", backgroundColor: "white", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)", border: "1px solid #e2e8f0" };
const labelStyle = { display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" };
const primaryBtnStyle = { width: "100%", padding: "14px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer", marginTop: "10px", transition: "all 0.2s" };
const backBtnStyle = { display: "inline-flex", alignItems: "center", gap: "6px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", padding: "8px 16px", borderRadius: "8px", marginBottom: "24px", cursor: "pointer", fontWeight: "600", fontSize: "13px", transition: "all 0.2s" };

export default UserDashboard;