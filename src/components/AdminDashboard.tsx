import React, { useState, useTransition } from 'react';
import { User, SmmService, Order, Transaction, Ticket, Notification } from '../types';
import { CATEGORIES } from '../data/servicesData';
import { Users, Shield, Wrench, Coins, Award, Layers, Bell, Eye, EyeOff, AlertTriangle, FileSpreadsheet, PlusCircle, Check, DollarSign, Ban, RefreshCw, BarChart } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  users: User[];
  services: SmmService[];
  orders: Order[];
  transactions: Transaction[];
  tickets: Ticket[];
  onUpdateUsers: (updatedUsers: User[]) => void;
  onUpdateServices: (updatedServices: SmmService[]) => void;
  onAddTransaction: (txn: Transaction) => void;
  onAddNotification: (notif: Notification) => void;
  onForceSettlePayment: (invoiceId: string) => void;
}

export default function AdminDashboard({
  currentUser,
  users,
  services,
  orders,
  transactions,
  tickets,
  onUpdateUsers,
  onUpdateServices,
  onAddTransaction,
  onAddNotification,
  onForceSettlePayment
}: AdminDashboardProps) {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'users' | 'services' | 'payments' | 'charts' | 'ledger'>('users');
  const [, startTransition] = useTransition();

  // Balance control state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [balanceAction, setBalanceAction] = useState<'add' | 'deduct' | 'set'>('add');
  const [balanceAmount, setBalanceAmount] = useState<string>('50.00');

  // Service configuration state
  const [newSvcName, setNewSvcName] = useState<string>('');
  const [newSvcCatId, setNewSvcCatId] = useState<string>('instagram');
  const [newSvcRate, setNewSvcRate] = useState<string>('1.50');
  const [newSvcMin, setNewSvcMin] = useState<string>('100');
  const [newSvcMax, setNewSvcMax] = useState<string>('10000');
  const [newSvcDesc, setNewSvcDesc] = useState<string>('');

  // Settle Payment
  const [forceSettleId, setForceSettleId] = useState<string>('');

  // Handle Ban/Unban Account
  const handleToggleUserBan = (userId: number) => {
    if (userId === currentUser.id) {
      alert("Error: You cannot restrict or ban your own administrative profile.");
      return;
    }

    const updated = users.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'banned' ? 'active' : 'banned';
        
        // Log notification to user
        onAddNotification({
          id: Math.random().toString(),
          userId: u.id,
          text: `Your account status has been changed to: ${nextStatus.toUpperCase()} by Administrator.`,
          type: nextStatus === 'active' ? 'info' : 'warning',
          read: false,
          createdAt: new Date().toISOString()
        });

        alert(`User Account ${u.username} status updated to: ${nextStatus.toUpperCase()}`);
        return { ...u, status: nextStatus as any };
      }
      return u;
    });

    onUpdateUsers(updated);
  };

  // Process manual ledger asset credit Adjustments
  const handleAdjustBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId === null) return;

    const numAmt = parseFloat(balanceAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    const targetUser = users.find(u => u.id === selectedUserId);
    if (!targetUser) return;

    let finalBalance = targetUser.balance;
    let remarks = "";

    if (balanceAction === 'add') {
      finalBalance += numAmt;
      remarks = `Administrative balance adjustment: Added +$${numAmt.toFixed(4)}`;
    } else if (balanceAction === 'deduct') {
      finalBalance = Math.max(0, finalBalance - numAmt);
      remarks = `Administrative balance adjustment: Deducted -$${numAmt.toFixed(4)}`;
    } else {
      finalBalance = numAmt;
      remarks = `Administrative balance adjustment: Set balance to $${numAmt.toFixed(4)}`;
    }

    // Update state
    const updated = users.map(u => {
      if (u.id === selectedUserId) {
        return { ...u, balance: finalBalance };
      }
      return u;
    });
    onUpdateUsers(updated);

    // Save transaction ledger log
    onAddTransaction({
      id: "SMM_AD_" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      userId: targetUser.id,
      username: targetUser.username,
      type: balanceAction === 'add' ? 'deposit' : 'order_charge',
      amount: balanceAction === 'add' ? numAmt : -numAmt,
      currency: 'USD',
      gateway: 'Manual Adjustment Desk',
      status: 'success',
      remarks: remarks,
      createdAt: new Date().toISOString()
    });

    // Notify targeted user
    onAddNotification({
      id: Math.random().toString(),
      userId: targetUser.id,
      text: remarks,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    });

    alert(`Successfully processed. New balance for ${targetUser.username}: $${finalBalance.toFixed(4)}`);
    setSelectedUserId(null);
    setBalanceAmount('50.00');
  };

  // Add customized SMM Service
  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSvcName.trim()) {
      alert("Service name cannot be empty.");
      return;
    }

    const nextId = services.length + 1;
    const newService: SmmService = {
      id: nextId,
      categoryId: newSvcCatId,
      name: newSvcName.trim(),
      ratePer1000: parseFloat(newSvcRate) || 1.50,
      minOrder: parseInt(newSvcMin) || 100,
      maxOrder: parseInt(newSvcMax) || 10000,
      description: newSvcDesc.trim() || 'High quality delivery custom service added by administrator panel.',
      provider: 'Manual Admin Desk',
      providerServiceId: 0
    };

    onUpdateServices([...services, newService]);

    alert(`Custom SMM Service ID #${nextId} created and enabled for user checkout.`);
    setNewSvcName('');
    setNewSvcDesc('');
  };

  // Force Settle manual bank receipts
  const handleForceSettle = (invoiceId: string) => {
    if (!invoiceId) return;
    onForceSettlePayment(invoiceId);
    alert(`Payment with Invoice ID ${invoiceId} was forced to settle. Users SMM balance loaded!`);
  };

  return (
    <div className="space-y-6" id="admin-dashboard-wrap">
      
      {/* Alert banner */}
      <div className="bg-[#0f172a]/60 p-4 border border-slate-800 rounded-2xl text-xs flex items-center gap-3">
        <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
        <div className="flex-1">
          <strong className="text-white block font-semibold mb-0.5">Active Administrative Operator</strong>
          <span className="text-slate-400">You are logged in as admin. You have access to ban accounts, edit ledger balances, create custom SMM campaigns, and check platform sales analytics.</span>
        </div>
      </div>

      {/* Subnav tab selectors */}
      <div className="border-b border-slate-800 flex flex-wrap gap-2 text-xs">
        {[
          { id: 'users', name: 'User Directory', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'services', name: 'SMM Services Registry', icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'payments', name: 'Pending Settlements', icon: <Coins className="w-3.5 h-3.5" /> },
          { id: 'charts', name: 'Platform Analytics', icon: <BarChart className="w-3.5 h-3.5" /> },
          { id: 'ledger', name: 'System Ledgers Logs', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => startTransition(() => { setActiveAdminSubTab(tab.id as any); })}
            className={`px-4 py-2.5 rounded-t-xl flex items-center gap-2 font-medium transition-colors cursor-pointer ${
              activeAdminSubTab === tab.id
                ? 'bg-[#0a0f1d] text-white border-t border-x border-slate-800 border-b-2 border-b-rose-500'
                : 'text-slate-400 hover:text-slate-250 hover:bg-slate-800/10'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Side Content boxes */}
        <div className="xl:col-span-8 space-y-6">
          
          {activeAdminSubTab === 'users' && (
            <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 overflow-hidden animate-fade-in text-slate-300">
              <h3 className="font-semibold text-white text-sm mb-4">SMM Panel User Directory</h3>
              
              <div className="overflow-x-auto select-all">
                <table className="w-full text-xs text-left text-slate-400 whitespace-nowrap">
                  <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950/40">
                    <tr className="border-b border-slate-800/80">
                      <th className="px-4 py-3">UID No</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">SMM Balance USD</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Control Panels</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-500">#{u.id}</td>
                        <td className="px-4 py-3 font-semibold text-white">{u.username}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-rose-400">${u.balance.toFixed(4)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => setSelectedUserId(u.id)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded font-semibold text-[10px] text-slate-300 transition-colors cursor-pointer"
                          >
                            Edit Balance
                          </button>
                          <button
                            onClick={() => handleToggleUserBan(u.id)}
                            disabled={u.id === currentUser.id}
                            className={`px-2.5 py-1 rounded font-bold text-[10px] transition-colors cursor-pointer border-none ${
                              u.status === 'banned'
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                            }`}
                          >
                            {u.status === 'banned' ? 'Activate' : 'Ban'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeAdminSubTab === 'services' && (
            <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 overflow-hidden animate-fade-in text-slate-300">
              <h3 className="font-semibold text-white text-sm mb-4">SMM Services Management</h3>
              
              <div className="overflow-x-auto select-all">
                <table className="w-full text-xs text-left text-slate-400 whitespace-nowrap">
                  <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950/40">
                    <tr className="border-b border-slate-800/80">
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Channel Category</th>
                      <th className="px-4 py-3">Service Name Description</th>
                      <th className="px-4 py-3">Rate/1K USD</th>
                      <th className="px-4 py-3">Limits (Min-Max)</th>
                      <th className="px-4 py-3">Provider Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {services.map(s => (
                      <tr key={s.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-slate-500">#{s.id}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-300">
                            {s.categoryId.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-white max-w-[200px] truncate" title={s.name}>
                          {s.name}
                        </td>
                        <td className="px-4 py-3 font-mono font-black text-rose-400">${s.ratePer1000.toFixed(3)}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{s.minOrder} — {s.maxOrder.toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono text-slate-500 text-[10px]">{s.provider}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeAdminSubTab === 'payments' && (
            <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 overflow-hidden block text-slate-300">
              <h3 className="font-semibold text-white text-sm mb-2">Pending Bank Settlement Requests</h3>
              
              <p className="text-slate-400 text-xs mb-4">
                These represent pending dynamic KHQR generation. In isolated test cases where bank webhook callbacks fail, administrative desks can check balances and force approval.
              </p>

              <div className="overflow-x-auto select-all">
                <table className="w-full text-xs text-left text-slate-400 whitespace-nowrap">
                  <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950/40">
                    <tr className="border-b border-slate-800/80">
                      <th className="px-4 py-3">Invoice ID</th>
                      <th className="px-4 py-3">Target User</th>
                      <th className="px-4 py-3">Acquirer Bank</th>
                      <th className="px-4 py-3">Billing Fee</th>
                      <th className="px-4 py-3">Callback State</th>
                      <th className="px-4 py-3">Emergency Force</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {transactions.filter(t => t.type === 'deposit' && t.status === 'success').map(t => (
                      <tr key={t.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-slate-500">{t.id}</td>
                        <td className="px-4 py-3 text-white font-semibold">{t.username}</td>
                        <td className="px-4 py-3 font-mono text-slate-400 font-bold">{t.gateway}</td>
                        <td className="px-4 py-3 font-mono text-emerald-400 font-bold">+${t.amount.toFixed(4)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400">
                            SETTLED
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">Auto check pass</td>
                      </tr>
                    ))}

                    {/* Pending settlements generator simulator */}
                    {forceSettleId && (
                      <tr className="bg-yellow-500/5">
                        <td className="px-4 py-3 font-mono text-yellow-500 p-3">#{forceSettleId}</td>
                        <td className="px-4 py-3 text-yellow-100 font-medium">User Admin Test</td>
                        <td className="px-4 py-3 font-semibold text-yellow-200">ABA Network</td>
                        <td className="px-4 py-3 font-mono font-bold text-yellow-300">$15.00</td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold text-yellow-400 animate-pulse bg-yellow-500/10">
                            PENDING
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { handleForceSettle(forceSettleId); setForceSettleId(''); }}
                            className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold text-[9px] cursor-pointer"
                          >
                            FORCE APPROVE
                          </button>
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td colSpan={6} className="text-center py-4 text-slate-500 text-[11px]">
                        Admins can test forces using the KHQR generator.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}          {activeAdminSubTab === 'charts' && (
            <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 space-y-6 animate-fade-in block text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-semibold text-white text-sm">Platform Core Sales Analytics</h3>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-black px-2 py-0.5 rounded uppercase">
                  Live stats distributions
                </span>
              </div>

              {/* GORGEOUS SVG CHART DESIGN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual Category S Volume Distribution custom SVG */}
                <div className="border border-slate-800 p-4 rounded-xl space-y-4">
                  <h4 className="text-xs font-semibold text-slate-350">Social Channel Volume Distribution</h4>
                  
                  <div className="relative aspect-video flex items-end justify-between px-2 pt-6">
                    {/* SVG Bars representing Categories relative usage */}
                    <div className="flex flex-col items-center flex-1 space-y-1">
                      <div className="w-8 bg-indigo-500 rounded-t-md relative h-28" title="Instagram: 52%">
                        <span className="absolute -top-5 left-1 font-mono text-[9px] font-bold text-indigo-400">52%</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Insta</span>
                    </div>

                    <div className="flex flex-col items-center flex-1 space-y-1">
                      <div className="w-8 bg-rose-500 rounded-t-md relative h-20" title="TikTok: 35%">
                        <span className="absolute -top-5 left-1 font-mono text-[9px] font-bold text-rose-400">35%</span>
                      </div>
                      <span className="text-[10px] text-slate-400">TikTok</span>
                    </div>

                    <div className="flex flex-col items-center flex-1 space-y-1">
                      <div className="w-8 bg-sky-500 rounded-t-md relative h-12" title="Facebook: 18%">
                        <span className="absolute -top-5 left-1 font-mono text-[9px] font-bold text-sky-450">18%</span>
                      </div>
                      <span className="text-[10px] text-slate-400">FB</span>
                    </div>

                    <div className="flex flex-col items-center flex-1 space-y-1">
                      <div className="w-8 bg-violet-500 rounded-t-md relative h-8" title="YouTube: 12%">
                        <span className="absolute -top-5 left-1 font-mono text-[9px] font-bold text-violet-400">12%</span>
                      </div>
                      <span className="text-[10px] text-slate-400">YT</span>
                    </div>

                    <div className="flex flex-col items-center flex-1 space-y-1">
                      <div className="w-8 bg-teal-500 rounded-t-md relative h-6" title="Telegram: 8%">
                        <span className="absolute -top-5 left-1 font-mono text-[9px] font-bold text-teal-400">8%</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Tele</span>
                    </div>
                  </div>
                </div>

                {/* SVG Revenue growth path chart */}
                <div className="border border-slate-800 p-4 rounded-xl space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-350 mb-1 font-sans">Financial Settlement Health</h4>
                    <p className="text-[10px] text-slate-450">Successful deposits vs. API charge trends in past quarters.</p>
                  </div>

                  <div className="relative h-28 border-b border-l border-slate-850 flex items-end">
                    {/* SVG Line path vector */}
                    <svg className="absolute inset-0 w-full h-full text-rose-500" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path
                        d="M 5,90 Q 25,60 50,45 T 95,15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        className="opacity-90"
                      />
                      {/* Grid guideline paths */}
                      <line x1="0" y1="30" x2="100" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="0" y1="60" x2="100" y2="60" stroke="#1e293b" strokeDasharray="3 3" />
                    </svg>
                    <span className="absolute top-1 right-2 text-[9px] font-mono text-emerald-450 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded animate-pulse">
                      +145% GROWTH
                    </span>
                  </div>

                  <div className="flex justify-between font-mono text-[9px] text-slate-500">
                    <span>Q1: 1.2K</span>
                    <span>Q2: 2.8K</span>
                    <span>Q3: 4.5K</span>
                    <span>Q4: 8.9K</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeAdminSubTab === 'ledger' && (
            <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 overflow-hidden animate-fade-in block text-slate-300">
              <h3 className="font-semibold text-white text-sm mb-4">Chronological SMM Financial LEDGER</h3>
              <div className="overflow-x-auto select-all">
                <table className="w-full text-xs text-left text-slate-400 whitespace-nowrap">
                  <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950/40">
                    <tr className="border-b border-slate-800/80">
                      <th className="px-4 py-3">Txn code ID</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Amount Charged</th>
                      <th className="px-4 py-3">Adjustment Remarks</th>
                      <th className="px-4 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {transactions.slice().reverse().map(txn => (
                      <tr key={txn.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-500">{txn.id}</td>
                        <td className="px-4 py-3 text-white font-semibold">{txn.username}</td>
                        <td className="px-4 py-3 uppercase text-[10px] font-mono text-slate-400">{txn.type}</td>
                        <td className={`px-4 py-3 font-mono font-bold ${
                          txn.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {txn.amount > 0 ? '+' : ''}${txn.amount.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate" title={txn.remarks}>{txn.remarks}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{new Date(txn.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right Side Control Forms widgets */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* User Balance Adjustment Form modal widget */}
          {selectedUserId !== null && (
            <div className="bg-[#0a0f1d] rounded-2xl p-5 border border-slate-800 space-y-4 animate-fade-in block">
              <h4 className="font-bold text-white text-xs flex items-center justify-between">
                <span>Adjust User SMM Balance</span>
                <button onClick={() => setSelectedUserId(null)} className="text-slate-400 hover:text-rose-450 text-xs font-bold font-mono bg-transparent border-none cursor-pointer">
                  ✕ Close
                </button>
              </h4>
              
              <p className="text-[11px] text-slate-400 leading-normal">
                Modifying ledger balance for user: <strong className="text-rose-450">{users.find(u => u.id === selectedUserId)?.username}</strong>. This updates balance instantly.
              </p>

              <form onSubmit={handleAdjustBalance} className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceAction('add')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold uppercase cursor-pointer border-none ${
                      balanceAction === 'add' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    ADD
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAction('deduct')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold uppercase cursor-pointer border-none ${
                      balanceAction === 'deduct' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    DEDUCT
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAction('set')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold uppercase cursor-pointer border-none ${
                      balanceAction === 'set' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    SET
                  </button>
                </div>

                <div>
                  <label htmlFor="adjust-amount" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Amount Adjustment (USD)
                  </label>
                  <input
                    id="adjust-amount"
                    type="number"
                    step="0.0001"
                    required
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border-none"
                >
                  Adjust Ledger Accounts Balance
                </button>
              </form>
            </div>
          )}

          {/* SMM customized service builder form */}
          <div className="bg-[#0a0f1d] rounded-2xl p-5 border border-slate-800 space-y-4">
            <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              Add Customized SMM Service
            </h4>

            <form onSubmit={handleAddCustomService} className="space-y-3">
              <div>
                <label htmlFor="custom-svc-name" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Social service name
                </label>
                <input
                  id="custom-svc-name"
                  type="text"
                  required
                  value={newSvcName}
                  onChange={(e) => setNewSvcName(e.target.value)}
                  placeholder="Instagram Real View Package — Automated"
                  className="w-full px-3 py-1.5 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="custom-svc-category" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Category channel
                  </label>
                  <select
                    id="custom-svc-category"
                    value={newSvcCatId}
                    onChange={(e) => setNewSvcCatId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-rose-500 font-bold"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="custom-svc-rate" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Rate per 1000 ($)
                  </label>
                  <input
                    id="custom-svc-rate"
                    type="number"
                    step="0.01"
                    required
                    value={newSvcRate}
                    onChange={(e) => setNewSvcRate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="custom-svc-description" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Service detailed description
                </label>
                <textarea
                  id="custom-svc-description"
                  rows={2}
                  value={newSvcDesc}
                  onChange={(e) => setNewSvcDesc(e.target.value)}
                  placeholder="Instant speed, high quality profiles description details..."
                  className="w-full px-3 py-1.5 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer border-none shadow-[0_4px_12px_rgba(79,70,229,0.2)]"
              >
                Create SMM Service
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
