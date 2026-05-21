import Link from "next/link";
import { 
  Users, UserCheck, CheckCircle2, XCircle, Flame, 
  QrCode, ClipboardList, ShieldAlert, Award, FileSpreadsheet
} from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { title: "Total Volunteers", count: "128", icon: Users, color: "text-ydc-blue bg-ydc-blue/10" },
    { title: "Pending Approvals", count: "14", icon: UserCheck, color: "text-ydc-green bg-ydc-green/10" },
    { title: "Streak Verifications", count: "8", icon: Flame, color: "text-orange-500 bg-orange-500/10" },
    { title: "Active Events", count: "2", icon: ClipboardList, color: "text-ydc-red bg-ydc-red/10" }
  ];

  const pendingApprovals = [
    { id: 1, name: "Zubair Ahmad", email: "zubair@example.com", division: "Bahawalpur", date: "May 20, 2026" },
    { id: 2, name: "Hamza Saleem", email: "hamza@example.com", division: "D.G. Khan", date: "May 20, 2026" },
    { id: 3, name: "Kamran Khan", email: "kamran@example.com", division: "Multan", date: "May 19, 2026" }
  ];

  const streakSubmissions = [
    { id: 1, name: "Usman Ghani", description: "Blood donation drive assistance at Civil Hospital", image: "blood_donation.jpg", date: "May 20, 2026" },
    { id: 2, name: "Bilal Tariq", description: "Planted 3 new saplings in our sector park", image: "plant_drive.jpg", date: "May 20, 2026" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <span className="absolute top-0 w-2 h-2 rounded-full bg-ydc-red"></span>
              <span className="absolute bottom-0 left-0 w-2 h-2 rounded-full bg-ydc-blue"></span>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-ydc-green"></span>
            </div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              YDC Admin
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-ydc-red/20 border border-ydc-red/35 text-ydc-red uppercase">Portal</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/admin/scan" 
              className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-ydc-blue to-ydc-blue-dark text-white hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-ydc-blue/15"
            >
              <QrCode size={16} />
              Scan QR Attendance
            </Link>
            <Link 
              href="/auth/login" 
              className="text-xs font-semibold px-3 py-1.5 border border-slate-800 rounded-lg hover:bg-slate-900 transition-colors"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-white">{stat.count}</h3>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Section 1: Pending Volunteer Approvals */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <UserCheck size={20} className="text-ydc-green" />
              Pending Volunteer Approvals
            </h3>

            <div className="space-y-4">
              {pendingApprovals.map((user) => (
                <div key={user.id} className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-200 text-sm">{user.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 mt-1 uppercase">
                      {user.division} Division
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="p-2 rounded-lg bg-ydc-green/10 border border-ydc-green/20 text-ydc-green hover:bg-ydc-green hover:text-white transition-all cursor-pointer">
                      <CheckCircle2 size={16} />
                    </button>
                    <button className="p-2 rounded-lg bg-ydc-red/10 border border-ydc-red/20 text-ydc-red hover:bg-ydc-red hover:text-white transition-all cursor-pointer">
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Streak Verification Logs */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Flame size={20} className="text-orange-500" />
              Daily Goodness Streak Verifications
            </h3>

            <div className="space-y-4">
              {streakSubmissions.map((log) => (
                <div key={log.id} className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-sm">{log.name}</span>
                      <span className="text-[10px] text-slate-400">{log.date}</span>
                    </div>
                    <p className="text-xs text-slate-300 italic">"{log.description}"</p>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ydc-blue mt-1">
                      <FileSpreadsheet size={12} />
                      Proof File: {log.image}
                    </span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <button className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-ydc-green/10 border border-ydc-green/20 text-ydc-green hover:bg-ydc-green hover:text-white text-xs font-bold transition-all cursor-pointer">
                      Approve & Credit
                    </button>
                    <button className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-ydc-red hover:bg-ydc-red/10 hover:border-ydc-red/20 transition-all cursor-pointer">
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Info banner */}
        <div className="rounded-2xl bg-ydc-red/5 border border-ydc-red/10 p-4 flex gap-3">
          <ShieldAlert className="text-ydc-red shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-slate-200">Administrative Safeguards</h4>
            <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
              Any audit logs or streak approvals executed on this dashboard trigger write records to the PostgreSQL ledger. Ledger edits are permanent and cryptographic checkpoints verify ledger state.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
