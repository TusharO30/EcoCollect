import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../config';
import { 
  Truck, CheckCircle2, Clock, Navigation, 
  DollarSign, BarChart, LogOut, List, 
  AlertTriangle, X, Star, Power, TrendingUp, Bell,
  Battery, AlertOctagon, CalendarOff, Coffee, 
  Trash2 
} from "lucide-react";

const CollectorDashboard = () => {
  // --- STATE ---
  const [view, setView] = useState("jobs");
  const [collectorStatus, setCollectorStatus] = useState("offline"); 
  const [leaveDate, setLeaveDate] = useState(""); 
  
  // New State for tracking when the truck was last emptied
  const [lastUnloadTime, setLastUnloadTime] = useState(null);

  const [allAssignments, setAllAssignments] = useState([]);
  const [notification, setNotification] = useState(null);
  
  const prevJobCountRef = useRef(0);
  
  const [stats, setStats] = useState({
    completedToday: 0,
    totalWeight: 0,
    earnings: 0,
    rating: 4.9,
    truckLoad: 0,
    truckMax: 500
  });

  const [reportModal, setReportModal] = useState({ show: false, requestId: null });
  const [statusModal, setStatusModal] = useState(false); 
  const [issueReason, setIssueReason] = useState("Bin Not Found");

  const navigate = useNavigate();
  const collectorName = sessionStorage.getItem("userName") || "Driver";
  const collectorId = sessionStorage.getItem("userId");

  // --- FETCH DATA ---
  useEffect(() => {
    if (!collectorId) {
      navigate('/');
    } else {
      // Load saved status, leave date, and unload time
      const savedStatus = localStorage.getItem(`status_${collectorId}`);
      const savedLeaveDate = localStorage.getItem(`leaveDate_${collectorId}`);
      const savedUnloadTime = localStorage.getItem(`lastUnloadTime_${collectorId}`);
      
      if (savedStatus) setCollectorStatus(savedStatus);
      if (savedLeaveDate) setLeaveDate(savedLeaveDate);
      if (savedUnloadTime) setLastUnloadTime(new Date(savedUnloadTime));

      fetchAssignments();

      const interval = setInterval(() => {
        if (savedStatus === 'online') fetchAssignments(true);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [collectorId, navigate, collectorStatus]);

  // Effect to re-calculate stats whenever lastUnloadTime changes
  useEffect(() => {
    if (allAssignments.length > 0) {
      calculateStats(allAssignments);
    }
  }, [lastUnloadTime]);

  const fetchAssignments = async (isBackgroundUpdate = false) => {
    try {
      const res = await axios.get('http://localhost:5000/api/requests/all');
      
      const myJobs = res.data.filter(req => {
        const assignedId = req.assignedCollectorId?._id || req.assignedCollectorId;
        return assignedId === collectorId;
      });

      const activeCount = myJobs.filter(r => r.status === 'Assigned' || r.status === 'Pending').length;
      
      if (!isBackgroundUpdate) {
        prevJobCountRef.current = activeCount;
      } else if (activeCount > prevJobCountRef.current && collectorStatus === 'online') {
        showNotification(`🔔 New Pickup Assigned!`);
        prevJobCountRef.current = activeCount;
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Audio play blocked"));
      }

      setAllAssignments(myJobs);
      calculateStats(myJobs);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const calculateStats = (data) => {
    const completed = data.filter(r => r.status === 'Completed');
    const today = completed.filter(r => {
      const d = new Date(r.updatedAt || r.pickupDate);
      return d.toDateString() === new Date().toDateString();
    });

    let totalLifetimeWeight = 0;
    let currentTruckLoad = 0;

    completed.forEach(r => {
      const w = parseFloat(String(r.amount).replace(/[^\d.]/g, ''));
      if(!isNaN(w)) {
        // Always add to lifetime stats
        totalLifetimeWeight += w;

        // Check if this job was done AFTER the last unload time
        const jobDate = new Date(r.updatedAt || r.pickupDate);
        if (!lastUnloadTime || jobDate > lastUnloadTime) {
          currentTruckLoad += w;
        }
      }
    });

    setStats(prev => ({
      ...prev,
      completedToday: today.length,
      totalWeight: totalLifetimeWeight,
      earnings: totalLifetimeWeight * 0.5,
      // Clamp load at max to prevent UI breaking, though logic handles reset
      truckLoad: currentTruckLoad > 500 ? 500 : currentTruckLoad 
    }));
  };

  // --- ACTIONS ---
  
  const updateStatus = (newStatus, date = "") => {
    setCollectorStatus(newStatus);
    setLeaveDate(date);
    localStorage.setItem(`status_${collectorId}`, newStatus);
    if(date) localStorage.setItem(`leaveDate_${collectorId}`, date);
    else localStorage.removeItem(`leaveDate_${collectorId}`);
    setStatusModal(false);
  };

  // NEW: Handle Unload Action
  const handleUnload = () => {
    if (stats.truckLoad <= 0) {
      alert("Truck is already empty!");
      return;
    }
    
    if (window.confirm("Are you at the disposal center? This will reset your current load to 0kg.")) {
      const now = new Date();
      setLastUnloadTime(now);
      localStorage.setItem(`lastUnloadTime_${collectorId}`, now.toISOString());
      
      // Play a satisfying sound effect
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'); // Heavy door shut sound
      audio.play().catch(e => console.log("Audio blocked"));
      
      showNotification("✅ Truck Unloaded Successfully");
    }
  };

  const handleComplete = async (requestId) => {
    if (stats.truckLoad >= stats.truckMax) {
      alert("⚠️ Truck Full! Please unload at the disposal center before collecting more.");
      return;
    }

    if (!window.confirm("Confirm collection successful?")) return;
    try {
      await axios.put(`http://localhost:5000/api/requests/complete/${requestId}`);
      alert("✅ Job Completed!");
      fetchAssignments();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Check backend connection."));
    }
  };

  const handleReportIssue = async () => {
    if (!reportModal.requestId) return;
    try {
      await axios.put(`http://localhost:5000/api/requests/report-issue/${reportModal.requestId}`, { 
        reason: issueReason 
      });
      alert("⚠️ Issue Reported Successfully.");
      setReportModal({ show: false, requestId: null });
      fetchAssignments();
    } catch (err) { alert("Error reporting issue."); }
  };

  const openMaps = (location) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  };

  const activeJobs = allAssignments.filter(req => req.status !== 'Completed' && req.status !== 'Issue Reported' && req.status !== 'Rejected');
  const historyJobs = allAssignments.filter(req => req.status === 'Completed' || req.status === 'Issue Reported' || req.status === 'Rejected');

  const loadPercentage = Math.min((stats.truckLoad / stats.truckMax) * 100, 100);
  const isOverloaded = loadPercentage >= 90;

  const getStatusColor = () => {
    if (collectorStatus === 'online') return "#10b981";
    if (collectorStatus === 'leave') return "#f59e0b";
    return "#94a3b8";
  };

  // --- RENDER ---
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif", color: "#0f172a", paddingBottom: "40px" }}>
      <style>{`
        @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        .hover-card { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
      `}</style>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div style={{
          position: "fixed", top: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 100,
          background: "#10b981", color: "white", padding: "12px 24px", borderRadius: "99px",
          boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.4)", display: "flex", alignItems: "center", gap: "12px",
          animation: "slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)", fontWeight: "600", fontSize: "14px"
        }}>
          <Bell size={18} fill="currentColor" />
          {notification}
          <button onClick={() => setNotification(null)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", padding: "4px" }}><X size={16}/></button>
        </div>
      )}

      {/* HEADER */}
      <header style={{ backgroundColor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 50, padding: "16px 0" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)" }}>
              <Truck size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>{collectorName}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f59e0b", fontWeight: "700" }}>
                  <Star size={14} fill="#f59e0b" /> {stats.rating}
                </span>
                <span style={{ width: "4px", height: "4px", background: "#cbd5e1", borderRadius: "50%" }}></span>
                <span style={{ color: getStatusColor(), fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", background: getStatusColor(), borderRadius: "50%", animation: collectorStatus === 'online' ? "pulse-ring 2s infinite" : "none" }}></div>
                  {collectorStatus === 'online' ? "Online" : collectorStatus === 'leave' ? "On Leave" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button 
              onClick={() => setStatusModal(true)} 
              style={{ 
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "99px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "700", transition: "all 0.2s", 
                background: collectorStatus === 'online' ? "#dcfce7" : collectorStatus === 'leave' ? "#fef3c7" : "#f1f5f9", 
                color: collectorStatus === 'online' ? "#166534" : collectorStatus === 'leave' ? "#b45309" : "#64748b",
                boxShadow: collectorStatus === 'online' ? "0 0 0 4px rgba(22, 101, 52, 0.1)" : "none"
              }}
            >
              {collectorStatus === 'online' ? <Power size={16} /> : collectorStatus === 'leave' ? <CalendarOff size={16} /> : <Power size={16} />} 
              {collectorStatus === 'online' ? "On Duty" : collectorStatus === 'leave' ? "On Leave" : "Off Duty"}
            </button>
            <button onClick={() => { sessionStorage.clear(); navigate('/'); }} style={{ background: "#fee2e2", border: "none", width: "40px", height: "40px", borderRadius: "50%", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 24px" }}>
        
        {/* TRUCK LOAD TRACKER with UNLOAD BUTTON */}
        <div style={{ background: "white", padding: "24px", borderRadius: "20px", border: "1px solid #e2e8f0", marginBottom: "32px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ padding: "10px", background: isOverloaded ? "#fef2f2" : "#f0f9ff", borderRadius: "12px", color: isOverloaded ? "#ef4444" : "#0284c7" }}>
                {isOverloaded ? <AlertOctagon size={24} /> : <Battery size={24} />}
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0", color: "#0f172a" }}>Truck Capacity</h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
                  Current Load: <strong style={{ color: isOverloaded ? "#ef4444" : "#0f172a" }}>{stats.truckLoad.toFixed(1)} kg</strong> / {stats.truckMax} kg
                </p>
              </div>
            </div>

            {/* UNLOAD BUTTON - Only visible if there is load */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
               {isOverloaded && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "800", color: "white", background: "#ef4444", padding: "6px 12px", borderRadius: "99px" }}>
                    <AlertTriangle size={14} /> FULL
                  </div>
               )}
               <button 
                 onClick={handleUnload}
                 disabled={stats.truckLoad <= 0}
                 style={{ 
                   display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "99px", 
                   border: "1px solid #e2e8f0", background: stats.truckLoad > 0 ? "#0f172a" : "#f1f5f9", 
                   color: stats.truckLoad > 0 ? "white" : "#94a3b8", fontWeight: "700", fontSize: "13px", 
                   cursor: stats.truckLoad > 0 ? "pointer" : "not-allowed", transition: "all 0.2s"
                 }}
               >
                 <Trash2 size={14} /> Unload
               </button>
            </div>
          </div>
          
          <div style={{ width: "100%", height: "16px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden", position: "relative" }}>
            <div style={{ 
              width: `${loadPercentage}%`, 
              height: "100%", 
              background: isOverloaded ? "linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)" : "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              borderRadius: "99px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}></div>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          <StatCard icon={<CheckCircle2 size={24} color="#10b981"/>} label="Jobs Done Today" value={stats.completedToday} bg="#ecfdf5" />
          <StatCard icon={<BarChart size={24} color="#3b82f6"/>} label="Total Lifetime Weight" value={`${stats.totalWeight.toFixed(1)} kg`} bg="#eff6ff" />
        </div>

        {/* NAVIGATION TABS */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", background: "white", padding: "6px", borderRadius: "16px", border: "1px solid #e2e8f0", width: "fit-content", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <TabButton active={view === "jobs"} onClick={() => setView("jobs")} icon={<List size={18}/>} label={`Route (${activeJobs.length})`} />
          <TabButton active={view === "history"} onClick={() => setView("history")} icon={<Clock size={18}/>} label="History" />
          <TabButton active={view === "earnings"} onClick={() => setView("earnings")} icon={<TrendingUp size={18}/>} label="Earnings" />
        </div>

        {/* --- VIEW: ACTIVE JOBS --- */}
        {view === "jobs" && (
          collectorStatus === 'online' ? (
            <div style={{ display: "grid", gap: "24px" }}>
              {activeJobs.length === 0 ? (
                <EmptyState title="All Caught Up!" desc="No active pickup tasks assigned to you right now." icon={<CheckCircle2 size={64} />} />
              ) : (
                activeJobs.map(job => (
                  <div key={job._id} className="hover-card" style={{ background: "white", borderRadius: "20px", padding: "28px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                      <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                        <span style={{ width: "fit-content", background: job.wasteType === 'Plastic' ? '#e0f2fe' : '#fef3c7', color: job.wasteType === 'Plastic' ? '#0284c7' : '#d97706', padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {job.wasteType} • {job.amount}
                        </span>
                        <div>
                          <h3 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 6px", color: "#0f172a" }}>{job.location}</h3>
                          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: "500" }}>Customer: {job.userId?.name || "User"}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", background: "#f8fafc", padding: "8px 12px", borderRadius: "10px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>{new Date(job.pickupDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "16px", paddingTop: "24px", borderTop: "1px solid #f1f5f9" }}>
                      <button onClick={() => openMaps(job.location)} style={actionBtnStyle("#f1f5f9", "white", "#0f172a", "#e2e8f0")}>
                        <Navigation size={18} /> Map
                      </button>
                      <button onClick={() => setReportModal({ show: true, requestId: job._id })} style={actionBtnStyle("#fef2f2", "#fff1f2", "#be123c", "#fecdd3")}>
                        <AlertTriangle size={18} /> Report
                      </button>
                      <button onClick={() => handleComplete(job._id)} style={actionBtnStyle("#059669", "#10b981", "white", "transparent", true)}>
                        <CheckCircle2 size={18} /> Complete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : collectorStatus === 'leave' ? (
             <div style={{ textAlign: "center", padding: "80px 24px", background: "#fffbeb", borderRadius: "24px", border: "2px dashed #fcd34d", color: "#92400e" }}>
               <div style={{ width: "80px", height: "80px", background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                 <Coffee size={40} color="#f59e0b" />
               </div>
               <h3 style={{ margin: "0 0 8px", color: "#b45309", fontSize: "20px", fontWeight: "800" }}>You are on Leave</h3>
               <p style={{ margin: "0 0 32px", fontSize: "15px" }}>
                 Enjoy your time off! Your status is set to unavailable. <br/>
                 {leaveDate && <span>Returning on: <strong>{new Date(leaveDate).toDateString()}</strong></span>}
               </p>
               <button onClick={() => setStatusModal(true)} style={{ padding: "14px 32px", background: "#f59e0b", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", fontSize: "15px" }}>Change Status</button>
             </div>
          ) : (
            <div style={{ textAlign: "center", padding: "80px 24px", background: "white", borderRadius: "24px", border: "2px dashed #e2e8f0", color: "#94a3b8" }}>
              <div style={{ width: "80px", height: "80px", background: "#f8fafc", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <Power size={40} />
              </div>
              <h3 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "20px", fontWeight: "800" }}>You are currently Offline</h3>
              <p style={{ margin: "0 0 32px", fontSize: "15px" }}>Go "On Duty" to start receiving assignments.</p>
              <button onClick={() => updateStatus('online')} style={{ padding: "14px 32px", background: "#10b981", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", fontSize: "15px", boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)" }}>Start Shift</button>
            </div>
          )
        )}

        {/* --- VIEW: HISTORY --- */}
        {view === "history" && (
          <div style={{ display: "grid", gap: "20px" }}>
            {historyJobs.length === 0 ? (
              <EmptyState title="No History" desc="You haven't completed any jobs yet." icon={<Clock size={48} />} />
            ) : (
              historyJobs.map(job => (
                <div key={job._id} style={{ background: "white", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 4px", color: "#0f172a" }}>{job.wasteType} Collection</h3>
                    <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>{job.location}</p>
                  </div>
                  <div>
                    {job.status === 'Completed' ? (
                      <span style={{ fontSize: "12px", fontWeight: "800", color: "#166534", background: "#dcfce7", padding: "6px 12px", borderRadius: "99px", border: "1px solid #bbf7d0" }}>COMPLETED</span>
                    ) : (
                      <span style={{ fontSize: "12px", fontWeight: "800", color: "#991b1b", background: "#fee2e2", padding: "6px 12px", borderRadius: "99px", border: "1px solid #fecaca" }}>REPORTED</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- VIEW: EARNINGS --- */}
        {view === "earnings" && (
          <div style={{ background: "white", borderRadius: "24px", padding: "60px 40px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
            <div style={{ width: "80px", height: "80px", background: "#ecfdf5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "#10b981" }}>
              <DollarSign size={40} />
            </div>
            <p style={{ fontSize: "14px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Total Earnings</p>
            <h2 style={{ fontSize: "56px", fontWeight: "800", color: "#0f172a", margin: "0 0 32px", letterSpacing: "-2px" }}>₹{stats.earnings.toFixed(2)}</h2>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "#f8fafc", borderRadius: "99px", border: "1px solid #e2e8f0", color: "#475569", fontSize: "14px", fontWeight: "600" }}>
              <Clock size={16} /> Next Payout: <span style={{ color: "#0f172a" }}>Friday</span>
            </div>
          </div>
        )}

      </div>

      {/* --- STATUS MANAGEMENT MODAL --- */}
      {statusModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", width: "90%", maxWidth: "400px", borderRadius: "24px", padding: "32px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
               <h2 style={{ fontSize: "20px", fontWeight: "800", margin: 0, color: "#0f172a" }}>Set Status</h2>
               <button onClick={() => setStatusModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={24}/></button>
             </div>
             
             <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
               <button onClick={() => updateStatus('online')} style={statusOptionStyle(collectorStatus === 'online', "#10b981", "#dcfce7")}>
                 <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ padding: "8px", background: "#dcfce7", borderRadius: "8px", color: "#166534" }}><Power size={18}/></div>
                    <div style={{textAlign:'left'}}>
                      <div style={{fontWeight:'700', color: '#166534'}}>On Duty</div>
                      <div style={{fontSize:'12px', color: '#166534', opacity: 0.8}}>Available for jobs</div>
                    </div>
                 </div>
                 {collectorStatus === 'online' && <CheckCircle2 size={18} color="#166534"/>}
               </button>

               <button onClick={() => updateStatus('offline')} style={statusOptionStyle(collectorStatus === 'offline', "#64748b", "#f1f5f9")}>
                 <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ padding: "8px", background: "#f1f5f9", borderRadius: "8px", color: "#475569" }}><Power size={18}/></div>
                    <div style={{textAlign:'left'}}>
                      <div style={{fontWeight:'700', color: '#475569'}}>Off Duty</div>
                      <div style={{fontSize:'12px', color: '#64748b'}}>Not accepting jobs</div>
                    </div>
                 </div>
                 {collectorStatus === 'offline' && <CheckCircle2 size={18} color="#475569"/>}
               </button>

               <div style={{ border: collectorStatus === 'leave' ? "2px solid #f59e0b" : "1px solid #e2e8f0", borderRadius: "12px", padding: "4px" }}>
                 <button onClick={() => { if(collectorStatus !== 'leave') updateStatus('leave'); }} style={{ ...statusOptionStyle(collectorStatus === 'leave', "#f59e0b", "#fef3c7"), border: "none", marginBottom: collectorStatus === 'leave' ? '12px' : '0' }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ padding: "8px", background: "#fef3c7", borderRadius: "8px", color: "#b45309" }}><CalendarOff size={18}/></div>
                      <div style={{textAlign:'left'}}>
                        <div style={{fontWeight:'700', color: '#b45309'}}>On Leave</div>
                        <div style={{fontSize:'12px', color: '#b45309', opacity: 0.8}}>Unavailable until date</div>
                      </div>
                   </div>
                   {collectorStatus === 'leave' && <CheckCircle2 size={18} color="#b45309"/>}
                 </button>
                 
                 {collectorStatus === 'leave' && (
                   <div style={{ padding: "0 12px 12px", animation: "slideIn 0.2s ease-out" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#b45309", marginBottom: "6px" }}>Returning On:</label>
                      <input 
                        type="date" 
                        value={leaveDate}
                        onChange={(e) => {
                          setLeaveDate(e.target.value);
                          localStorage.setItem(`leaveDate_${collectorId}`, e.target.value);
                        }}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #fcd34d", outline: "none", fontSize: "14px", color: "#78350f" }}
                      />
                   </div>
                 )}
               </div>

             </div>
          </div>
        </div>
      )}

      {/* REPORT ISSUE MODAL */}
      {reportModal.show && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", width: "90%", maxWidth: "400px", borderRadius: "24px", padding: "32px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", margin: 0, color: "#0f172a" }}>Report Issue</h2>
              <button onClick={() => setReportModal({show:false, requestId:null})} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={24}/></button>
            </div>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "16px", fontWeight: "500" }}>Why can't this waste be collected?</p>
            <select value={issueReason} onChange={(e) => setIssueReason(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "15px", marginBottom: "24px", outline: "none", background: "#f8fafc", color: "#1e293b", cursor: "pointer", fontWeight: "500" }}>
              <option value="Bin Not Found">Bin Not Found</option>
              <option value="Access Blocked">Access Blocked (Gate Locked)</option>
              <option value="Contaminated Waste">Waste Contaminated</option>
              <option value="Incorrect Address">Incorrect Address</option>
              <option value="Other">Other</option>
            </select>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setReportModal({show:false, requestId:null})} style={{ flex: 1, padding: "14px", background: "white", border: "1px solid #e2e8f0", color: "#64748b", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleReportIssue} style={{ flex: 1, padding: "14px", background: "#ef4444", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.3)" }}>Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// HELPER COMPONENTS
const actionBtnStyle = (hoverBg, bg, color, border, primary) => ({
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "12px", 
  border: `1px solid ${border || 'transparent'}`, 
  background: bg, color: color, fontWeight: "700", cursor: "pointer", transition: "all 0.2s", fontSize: "14px",
  boxShadow: primary ? "0 4px 6px -1px rgba(16, 185, 129, 0.3)" : "none"
});

const statusOptionStyle = (isActive, activeColor, activeBg) => ({
  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px",
  borderRadius: "12px", border: isActive ? `2px solid ${activeColor}` : "1px solid #e2e8f0",
  background: isActive ? activeBg : "white", cursor: "pointer", transition: "all 0.2s"
});

const EmptyState = ({ icon, title, desc }) => (
  <div style={{ textAlign: "center", padding: "80px 24px", color: "#94a3b8", background: "white", borderRadius: "24px", border: "2px dashed #e2e8f0" }}>
    <div style={{ margin: "0 auto 24px", width: "fit-content", opacity: 0.5 }}>{icon}</div>
    <h3 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "18px", fontWeight: "700" }}>{title}</h3>
    <p style={{ margin: 0, fontSize: "15px", maxWidth: "300px", marginLeft: "auto", marginRight: "auto" }}>{desc}</p>
  </div>
);

const StatCard = ({ icon, label, value, bg }) => (
  <div style={{ background: "white", padding: "24px", borderRadius: "20px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>
      <div style={{ padding: "10px", background: bg, borderRadius: "12px", display: "flex" }}>{icon}</div>
      {label}
    </div>
    <div style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", letterSpacing: "-1px" }}>{value}</div>
  </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    style={{ 
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 24px", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "700", transition: "all 0.2s",
      background: active ? "#0f172a" : "transparent", color: active ? "white" : "#64748b",
      boxShadow: active ? "0 4px 12px rgba(15, 23, 42, 0.15)" : "none"
    }}
  >
    {icon} {label}
  </button>
);

export default CollectorDashboard;