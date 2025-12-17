import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar 
} from 'recharts';
import { 
  LayoutDashboard, Trash2, Map, BarChart3, Users, 
  Bell, Settings, Search, Calendar, Truck, UserCheck, UserX, RefreshCw,
  CalendarOff // Added CalendarOff icon
} from "lucide-react";

const AdminDashboard = () => {
  // --- STATE ---
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("admin@eco.com");
  const [activeView, setActiveView] = useState("overview");
  const [requests, setRequests] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [selectedCollectors, setSelectedCollectors] = useState({});
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [chartData, setChartData] = useState([]); 
  const [weeklyStats, setWeeklyStats] = useState([]); 
  const navigate = useNavigate();

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#94a3b8']; 

  // --- FETCH DATA ---
  useEffect(() => {
    fetchAllData();

    // AUTO-REFRESH STATUS EVERY 5 SECONDS
    const interval = setInterval(() => {
        fetchCollectors();
    }, 5000);

    const storedName = sessionStorage.getItem("userName");
    const storedEmail = sessionStorage.getItem("userEmail");
    
    if (storedName) setAdminName(storedName);
    if (storedEmail) setAdminEmail(storedEmail);

    return () => clearInterval(interval); 
  }, []);

  const fetchAllData = () => {
    fetchRequests();
    fetchCollectors();
    fetchStats();
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/requests/all');
      const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequests(sorted);
      calculateStats(sorted);
      processWeeklyStats(sorted);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  // ---------------------------------------------------------
  // UPDATED FETCH COLLECTORS LOGIC
  // ---------------------------------------------------------
  const fetchCollectors = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/collectors');
      
      const syncedCollectors = res.data.map(c => {
        const id = c._id || c.id;

        // 1. Get Status (online, offline, leave)
        // We check both ID formats to be safe
        const status1 = localStorage.getItem(`status_${c._id}`);
        const status2 = localStorage.getItem(`status_${c.id}`);
        const currentStatus = status1 || status2 || 'offline';

        // 2. Get Leave Date
        const date1 = localStorage.getItem(`leaveDate_${c._id}`);
        const date2 = localStorage.getItem(`leaveDate_${c.id}`);
        const returnDate = date1 || date2 || null;

        return {
          ...c,
          currentStatus: currentStatus, // Store the actual string ('online', 'leave', 'offline')
          returnDate: returnDate
        };
      });
      
      setCollectors(syncedCollectors);
    } catch (err) {
      console.error("Error fetching collectors:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/requests/stats');
      setChartData(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // --- DATA PROCESSING HELPERS ---
  const calculateStats = (data) => {
    const total = data.length;
    const pending = data.filter(r => r.status === 'Pending').length;
    const completed = data.filter(r => r.status === 'Completed').length;
    setStats({ total, pending, completed });
  };

  const processWeeklyStats = (data) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const aggregated = days.map(day => ({
      day,
      General: 0, Recycling: 0, Organic: 0, Metal: 0
    }));

    data.forEach(req => {
      const dateStr = req.pickupDate || req.createdAt;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const dayIndex = date.getDay();
      const amount = parseFloat(String(req.amount).replace(/[^\d.]/g, '')) || 0;

      if (req.wasteType === 'Plastic') aggregated[dayIndex].Recycling += amount;
      else if (req.wasteType === 'Organic') aggregated[dayIndex].Organic += amount;
      else if (req.wasteType === 'Metal') aggregated[dayIndex].Metal += amount;
      else aggregated[dayIndex].General += amount;
    });

    setWeeklyStats(aggregated);
  };

  // --- ACTIONS ---
  const handleAssign = async (requestId) => {
    const collectorId = selectedCollectors[requestId];
    if (!collectorId) return alert("Please select a collector first.");
    
    // Check if collector is on leave
    const collector = collectors.find(c => c._id === collectorId);
    if (collector && collector.currentStatus === 'leave') {
        if(!window.confirm(`⚠️ ${collector.name} is on leave until ${new Date(collector.returnDate).toLocaleDateString()}. Assign anyway?`)) {
            return;
        }
    }

    try {
      await axios.put(`http://localhost:5000/api/requests/assign/${requestId}`, { collectorId });
      alert("Collector Assigned!");
      fetchRequests();
    } catch (err) {
      alert("Failed to assign");
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm("Reject this request?")) return;
    try {
      await axios.put(`http://localhost:5000/api/requests/reject/${requestId}`);
      alert("Request Rejected");
      fetchRequests();
    } catch (err) {
      alert("Failed to reject");
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  // Helper for Status Colors
  const getStatusColor = (status) => {
    if (status === 'online') return '#10b981';
    if (status === 'leave') return '#f59e0b';
    return '#71717a';
  };

  // --- RENDER CONTENT ---
  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "32px" }}>
              <StatsCard title="Total Pickups" value={stats.total}  icon="🗑️" />
              <StatsCard title="Pending" value={stats.pending}  icon="⏳" />
              <StatsCard title="Completed" value={stats.completed}  icon="✅" />
              <StatsCard 
                title="Online Drivers" 
                value={collectors.filter(c => c.currentStatus === 'online').length} 
                change={`${collectors.filter(c => c.currentStatus === 'leave').length} On Leave`} 
                icon="🚚" 
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", marginBottom: "32px" }}>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Bin Fill Status</h3>
                <div style={{ height: "250px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Weekly Collections (kg)</h3>
                <div style={{ height: "250px", width: "100%" }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={weeklyStats}>
                       <defs>
                         <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                       <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#71717a'}} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a'}} />
                       <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
                       <Area type="monotone" dataKey="General" stackId="1" stroke="#10b981" fill="#10b981" />
                       <Area type="monotone" dataKey="Recycling" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                       <Area type="monotone" dataKey="Organic" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                       <Area type="monotone" dataKey="Metal" stackId="1" stroke="#94a3b8" fill="#94a3b8" />
                     </AreaChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        );

      case "requests":
        return (
          <div style={cardStyle}>
             <h3 style={cardTitleStyle}>All Incoming Requests</h3>
             <div style={{ overflowX: "auto" }}>
               <table style={{ width: "100%", borderCollapse: "collapse" }}>
                 <thead>
                   <tr style={{ color: "#71717a", fontSize: "12px", textAlign: "left", borderBottom: "1px solid #27272a", textTransform: "uppercase" }}>
                     <th style={{ padding: "12px" }}>User</th>
                     <th style={{ padding: "12px" }}>Waste</th>
                     <th style={{ padding: "12px" }}>Location</th>
                     <th style={{ padding: "12px" }}>Status</th>
                     <th style={{ padding: "12px" }}>Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {requests.map(req => (
                     <tr key={req._id} style={{ borderBottom: "1px solid #27272a" }}>
                       <td style={{ padding: "16px", color: "white", fontWeight: "500" }}>{req.userId?.name || 'Unknown'}</td>
                       <td style={{ padding: "16px", color: "#a1a1aa" }}>{req.wasteType} <span style={{fontSize:'11px'}}>({req.amount})</span></td>
                       <td style={{ padding: "16px", color: "#a1a1aa" }}>{req.location}</td>
                       <td style={{ padding: "16px" }}>
                          <span style={{ 
                            padding: "4px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: "600",
                            backgroundColor: req.status === 'Pending' ? "rgba(251, 191, 36, 0.1)" : req.status === 'Completed' ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)",
                            color: req.status === 'Pending' ? "#fbbf24" : req.status === 'Completed' ? "#10b981" : "#3b82f6",
                            border: `1px solid ${req.status === 'Pending' ? "rgba(251, 191, 36, 0.2)" : req.status === 'Completed' ? "rgba(16, 185, 129, 0.2)" : "rgba(59, 130, 246, 0.2)"}`
                          }}>
                            {req.status.toUpperCase()}
                          </span>
                       </td>
                       <td style={{ padding: "16px" }}>
                         {req.status === 'Pending' ? (
                           <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                             <select style={selectStyle} onChange={(e) => setSelectedCollectors({...selectedCollectors, [req._id]: e.target.value})}>
                               <option value="">Select Driver</option>
                               {collectors.map(c => (
                                 <option 
                                    key={c._id} 
                                    value={c._id} 
                                    disabled={c.currentStatus !== 'online'}
                                 >
                                    {c.name} {c.currentStatus === 'leave' ? '(On Leave)' : c.currentStatus === 'offline' ? '(Offline)' : ''}
                                 </option>
                               ))}
                             </select>
                             <button onClick={() => handleAssign(req._id)} style={btnPrimary}>Assign</button>
                             <button onClick={() => handleReject(req._id)} style={btnDanger}><Trash2 size={14}/></button>
                           </div>
                         ) : (
                           <span style={{ color: "#52525b", fontSize: "12px" }}>
                             {req.status === 'Rejected' ? 'Rejected' : `Driver: ${req.assignedCollectorId?.name || 'Assigned'}`}
                           </span>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        );

      case "collectors":
        return (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{...cardTitleStyle, margin: 0}}>Collector Fleet</h3>
                <button onClick={fetchCollectors} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "1px solid #3f3f46", color: "#a1a1aa", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                    <RefreshCw size={14} /> Refresh Status
                </button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
               {collectors.map(c => {
                 const statusColor = getStatusColor(c.currentStatus);
                 return (
                    <div key={c._id} style={{ backgroundColor: "#27272a", padding: "24px", borderRadius: "12px", border: "1px solid #3f3f46", textAlign: "center", position: "relative", overflow: "hidden" }}>
                        
                        {/* Status Dot */}
                        <div style={{ 
                            position: "absolute", top: "12px", right: "12px", 
                            width: "10px", height: "10px", borderRadius: "50%", 
                            backgroundColor: statusColor,
                            boxShadow: c.currentStatus === 'online' ? `0 0 8px ${statusColor}` : "none"
                        }} />

                        <div style={{ width: "60px", height: "60px", backgroundColor: "#3f3f46", borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Truck size={28} color="#a1a1aa" />
                        </div>
                        
                        <h4 style={{ color: "white", margin: "0 0 4px", fontSize: "16px" }}>{c.name}</h4>
                        <p style={{ color: "#a1a1aa", fontSize: "12px", margin: "0 0 16px 0" }}>{c.email}</p>
                        
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                            <div style={{ 
                                display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", 
                                backgroundColor: `${statusColor}20`, // 20% opacity
                                borderRadius: "8px", fontSize: "12px", fontWeight: "600", 
                                color: statusColor 
                            }}>
                                {c.currentStatus === 'online' && <UserCheck size={14} />}
                                {c.currentStatus === 'offline' && <UserX size={14} />}
                                {c.currentStatus === 'leave' && <CalendarOff size={14} />}
                                
                                {c.currentStatus === 'online' ? "Online" : c.currentStatus === 'leave' ? "On Leave" : "Offline"}
                            </div>
                            
                            {/* SHOW RETURN DATE IF ON LEAVE */}
                            {c.currentStatus === 'leave' && c.returnDate && (
                                <p style={{ color: "#f59e0b", fontSize: "11px", margin: 0 }}>
                                    Returns: {new Date(c.returnDate).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                 );
               })}
               {collectors.length === 0 && <p style={{color: "#71717a"}}>No collectors found.</p>}
            </div>
          </div>
        );

      case "analytics":
        return (
          <div style={{ display: "grid", gap: "24px" }}>
             <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Detailed Analytics</h3>
                <p style={{ color: "#a1a1aa", marginBottom: "20px" }}>Waste collection trends over the last 30 days.</p>
                <div style={{ height: "300px", width: "100%" }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={weeklyStats}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                       <XAxis dataKey="day" tick={{fill: '#71717a'}} axisLine={false} tickLine={false} />
                       <YAxis tick={{fill: '#71717a'}} axisLine={false} tickLine={false} />
                       <Tooltip cursor={{fill: '#27272a'}} contentStyle={{ backgroundColor: '#18181b', border: 'none' }} />
                       <Legend />
                       <Bar dataKey="General" fill="#10B981" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="Recycling" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="Organic" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="Metal" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        );

      case "routes":
        return (
          <div style={{ ...cardStyle, textAlign: "center", padding: "60px" }}>
             <Map size={48} color="#3f3f46" style={{ marginBottom: "16px" }} />
             <h3 style={{ color: "white" }}>Route Optimization</h3>
             <p style={{ color: "#a1a1aa" }}>Live GPS tracking and route planning module coming soon.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0f1115", color: "#e5e7eb", fontFamily: "'Inter', sans-serif" }}>
      
      {/* SIDEBAR */}
      <aside style={{ 
        width: "260px", backgroundColor: "#0f1115", borderRight: "1px solid #27272a", 
        display: "flex", flexDirection: "column", padding: "20px", position: "fixed", 
        height: "100vh", boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px", paddingLeft: "10px" }}>
          <div style={{ width: "32px", height: "32px", backgroundColor: "#10b981", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>E</div>
          <span style={{ fontSize: "20px", fontWeight: "700", color: "white" }}>EcoCollect</span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          <NavItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeView === "overview"} onClick={() => setActiveView("overview")} />
          <NavItem icon={<Trash2 size={20} />} label="Requests" active={activeView === "requests"} onClick={() => setActiveView("requests")} />
          <NavItem icon={<Users size={20} />} label="Collectors" active={activeView === "collectors"} onClick={() => setActiveView("collectors")} />
          <NavItem icon={<Map size={20} />} label="Routes" active={activeView === "routes"} onClick={() => setActiveView("routes")} />
          <NavItem icon={<BarChart3 size={20} />} label="Analytics" active={activeView === "analytics"} onClick={() => setActiveView("analytics")} />
        </nav>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", backgroundColor: "#18181b", borderRadius: "12px", marginTop: "auto" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#3f3f46" }}></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "14px", fontWeight: "600", color: "white", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {adminName}
            </p>
            <p style={{ fontSize: "12px", color: "#a1a1aa", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {adminEmail}
            </p>
          </div>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Settings size={16} /></button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: "32px", marginLeft: "260px", boxSizing: "border-box" }}>
        
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "white", margin: 0, textTransform: "capitalize" }}>{activeView}</h1>
            <p style={{ color: "#a1a1aa", fontSize: "14px", marginTop: "4px" }}>Manage your waste management system</p>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
             <button onClick={fetchAllData} style={headerButtonStyle}><RefreshCw size={18} /> Refresh Data</button>
             <button style={headerButtonStyle}><Bell size={18} /></button>
          </div>
        </header>

        {renderContent()}

      </main>
    </div>
  );
};

// --- STYLES & COMPONENTS ---
const NavItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} style={{ 
    display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "8px", cursor: "pointer", 
    backgroundColor: active ? "#10b981" : "transparent", 
    color: active ? "white" : "#a1a1aa", 
    fontWeight: active ? "600" : "500",
    transition: "all 0.2s"
  }}>
    {icon} <span>{label}</span>
  </div>
);

const StatsCard = ({ title, value, change, icon }) => (
  <div style={{ backgroundColor: "#18181b", padding: "20px", borderRadius: "12px", border: "1px solid #27272a", position: "relative" }}>
     <div style={{ position: "absolute", top: "20px", right: "20px", backgroundColor: "rgba(255,255,255,0.05)", padding: "8px", borderRadius: "8px" }}>{icon}</div>
     <p style={{ color: "#a1a1aa", fontSize: "14px", margin: "0 0 8px 0" }}>{title}</p>
     <h2 style={{ color: "white", fontSize: "28px", fontWeight: "700", margin: 0 }}>{value}</h2>
     <p style={{ color: "#10b981", fontSize: "12px", marginTop: "8px" }}>{change}</p>
  </div>
);

const headerButtonStyle = { display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#18181b", color: "#e5e7eb", border: "1px solid #27272a", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "500" };
const cardStyle = { backgroundColor: "#18181b", borderRadius: "12px", border: "1px solid #27272a", padding: "24px" };
const cardTitleStyle = { color: "white", fontSize: "16px", fontWeight: "600", margin: "0 0 24px 0" };
const selectStyle = { backgroundColor: "#27272a", border: "1px solid #3f3f46", color: "white", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", outline: "none" };
const btnPrimary = { backgroundColor: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "500" };
const btnDanger = { backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.5)", padding: "6px 8px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" };

export default AdminDashboard;