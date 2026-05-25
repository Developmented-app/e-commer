import { useState, useTransition, useEffect, useRef } from 'react';
import { User, SmmService, Order, Transaction, Ticket, TicketReply, Notification } from './types';
import { SERVICES } from './data/servicesData';
import { PHP_CODEBASE } from './data/phpCodebase';
import PHPCodeExplorer from './components/PHPCodeExplorer';
import KHQRDeposit from './components/KHQRDeposit';
import APISandbox from './components/APISandbox';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import CronSimulator from './components/CronSimulator';
import {
  ShoppingBag,
  History,
  Landmark,
  Terminal,
  Settings,
  Database,
  Code,
  Shield,
  Coins,
  BarChart,
  RefreshCw,
  Users,
  Award,
  Menu,
  LogOut,
  Globe,
  Bell,
  CheckCircle2,
  Lock,
  MessageSquare
} from 'lucide-react';

// Language Localization Dictionaries
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    appTitle: "Cambodia SMM Panel - PHP MVC & KHQR",
    availableBalance: "Available Balance",
    smmCampaigns: "SMM Campaigns Run",
    referralEarned: "Referrals Earned",
    quickOrder: "New SMM Campaign",
    campaignHistory: "Campaign History",
    ledgerDeposits: "Ledger Deposits",
    supportDesk: "Support Tickets Desk",
    affiliateProgram: "Rewards / Affiliate Program",
    apiSandbox: "Developer Rest API",
    autoCron: "SMM Sync Cronjob",
    adminDesk: "Admin Control Desk",
    phpExporter: "PHP Code Exporter",
    logout: "Exit Session",
    languageLabel: "Language / ភាសា",
    currentUserLabel: "Active Profile",
    notificationTitle: "Alert Notifications",
    settlementBanks: "KHQR Banks"
  },
  km: {
    appTitle: "ប្រព័ន្ធគ្រប់គ្រង SMM កម្ពុជា - PHP MVC & KHQR",
    availableBalance: "សមតុល្យគណនី",
    smmCampaigns: "យុទ្ធនាការបានដំណើរការ",
    referralEarned: "ប្រាក់ចំណូលណែនាំ",
    quickOrder: "យុទ្ធនាការ SMM ថ្មី",
    campaignHistory: "ប្រវត្តិយុទ្ធនាការ",
    ledgerDeposits: "របាយការណ៍ដាក់ប្រាក់",
    supportDesk: "ផ្នែកគាំទ្រអតិថិជន",
    affiliateProgram: "កម្មវិធីណែនាំសមាជិក",
    apiSandbox: "Rest API របស់យុទ្ធនាការ",
    autoCron: "ម៉ាស៊ីនស្វ័យប្រវត្តិ (Cron)",
    adminDesk: "ផ្ទាំងអ្នកគ្រប់គ្រង (Admin)",
    phpExporter: "ប្រភពកូដ PHP MVC & SQL",
    logout: "ចាកចេញពីគណនី",
    languageLabel: "ភាសា / Language",
    currentUserLabel: "គណនីបច្ចុប្បន្ន",
    notificationTitle: "ការជូនដំណឹងផ្សេងៗ",
    settlementBanks: "ធនាគារ KHQR"
  }
};

// INITIAL SEED MOCK STATE DATABASES
const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: "admin_pro",
    email: "admin@smm-panel.kh",
    balance: 50000.0000,
    currency: 'USD',
    role: 'admin',
    apikey: "smm_api_key_88029abf99e8cbdf43f76921aba2d1eb2f90",
    status: 'active',
    referralsCount: 14,
    referralEarnings: 245.80,
    registeredAt: "2026-01-10T12:00:00Z",
    autoDepositEnabled: false,
    autoDepositThreshold: 5.0,
    autoDepositAmount: 15.0
  },
  {
    id: 2,
    username: "client_agency",
    email: "agency_kh@smm-panel.kh",
    balance: 264.5000,
    currency: 'USD',
    role: 'user',
    apikey: "smm_api_key_3f76921aba2d1eb2f9011293c830c2cde71b",
    status: 'active',
    referralsCount: 8,
    referralEarnings: 64.20,
    registeredAt: "2026-03-24T09:15:30Z",
    autoDepositEnabled: true,
    autoDepositThreshold: 10.0,
    autoDepositAmount: 25.0
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 1,
    userId: 2,
    username: "client_agency",
    serviceId: 1,
    serviceName: "Instagram Real Followers [Speed 10K/Day] - Non-Drop 30D Refill",
    categoryName: "Instagram Core Services",
    link: "https://instagram.com/p/Cxy8Z18xZ2/",
    quantity: 5000,
    charge: 9.25,
    startCounter: 1200,
    remains: 0,
    status: 'completed',
    createdAt: "2026-05-24T14:20:00Z"
  },
  {
    id: 2,
    userId: 2,
    username: "client_agency",
    serviceId: 4,
    serviceName: "TikTok High Quality Views [Start: Instant] [Super Fast 5M/Day]",
    categoryName: "TikTok Engagement Booster",
    link: "https://tiktok.com/@growth_agency/video/1928372",
    quantity: 10000,
    charge: 0.80,
    startCounter: 540,
    remains: 4500,
    status: 'processing',
    createdAt: "2026-05-25T11:45:00Z"
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "SMM_IN_65F3A9",
    userId: 2,
    username: "client_agency",
    type: 'deposit',
    amount: 150.00,
    currency: 'USD',
    gateway: "KHQR (ABA Bank)",
    status: 'success',
    remarks: "Dynamic KHQR direct settlement checkout",
    referenceCode: "REF_BK_9921820X",
    createdAt: "2026-05-23T10:30:00Z"
  },
  {
    id: "SMM_CH_003A4B",
    userId: 2,
    username: "client_agency",
    type: 'order_charge',
    amount: -9.25,
    currency: 'USD',
    gateway: "Account Wallet Balance",
    status: 'success',
    remarks: "Placed Order #1 - Instagram Followers Campaign",
    createdAt: "2026-05-24T14:20:00Z"
  }
];

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 1,
    userId: 2,
    username: "client_agency",
    subject: "Refund queries for failing TikTok Views SMM sync",
    message: "Placed TikTok campaigns #4 yesterday but statistics remain stagnant. Can custom support desk refund order balance?",
    category: "order",
    priority: "high",
    status: "answered",
    replies: [
      {
        id: 101,
        sender: "support",
        message: "Hello Client! We apologize for partner API lag spikes. Automated cron monitors fail points, status checking loops will cancel and refund credit automatically inside 10 minutes.",
        createdAt: "2026-05-25T01:10:00Z"
      }
    ],
    createdAt: "2026-05-25T00:45:00Z"
  }
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    userId: 2,
    text: "Dynamic settlement rate successfully loaded: $1 USD = 4,100 KHR via Acquirer.",
    type: "info",
    read: false,
    createdAt: "2026-05-25T14:00:00Z"
  }
];

export default function App() {
  const [, startTransition] = useTransition();
  const [lang, setLang] = useState<'en' | 'km'>('en');
  const [activeTab, setActiveTab] = useState<'simulator' | 'checkout' | 'api' | 'cron' | 'admin' | 'exporter'>('simulator');

  // DATABASE STATES
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[1]); // Login as client_agency initially for standard simulator
  const [services, setServices] = useState<SmmService[]>(SERVICES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const t = TRANSLATIONS[lang];

  // Subtle pulse animation state trigger for balance changes (deposit feedback)
  const [shouldPulse, setShouldPulse] = useState(false);
  const [prefilledDepositAmount, setPrefilledDepositAmount] = useState<string>('');
  const prevBalanceRef = useRef<number>(currentUser.balance);

  useEffect(() => {
    if (prevBalanceRef.current !== currentUser.balance) {
      setShouldPulse(true);
      const timer = setTimeout(() => {
        setShouldPulse(false);
      }, 1000);

      // Check if balance dropped below the auto-deposit trigger threshold
      const isBalanceDropping = currentUser.balance < prevBalanceRef.current;
      if (isBalanceDropping && currentUser.autoDepositEnabled) {
        const threshold = currentUser.autoDepositThreshold || 5.0;
        if (currentUser.balance < threshold && prevBalanceRef.current >= threshold) {
          const prefillAmt = currentUser.autoDepositAmount || 15.0;
          setPrefilledDepositAmount(prefillAmt.toString());

          handleUpdateUser({
            ...currentUser,
            balance: currentUser.balance // pass same balance but triggers update if needed
          });

          handleAddNotification({
            id: 'auto_deposit_trigger_' + Math.random().toString(),
            userId: currentUser.id,
            text: `⚠️ LOW BALANCE TRIGGER ACTIVE: Balance is $${currentUser.balance.toFixed(4)} (below your $${threshold.toFixed(2)} trigger threshold). KHQR Deposit preloaded to $${prefillAmt.toFixed(2)}. Click 'Available Balance' to proceed!`,
            type: 'warning',
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      }

      prevBalanceRef.current = currentUser.balance;
      return () => clearTimeout(timer);
    }
  }, [currentUser.balance, currentUser.autoDepositEnabled, currentUser.autoDepositThreshold, currentUser.autoDepositAmount]);

  // Helper: Synchronize user profile updates inside the list
  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleUpdateUsersList = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    const refreshed = updatedUsers.find(u => u.id === currentUser.id);
    if (refreshed) setCurrentUser(refreshed);
  };

  const handleUpdateServicesList = (updatedServices: SmmService[]) => {
    setServices(updatedServices);
  };

  const handleUpdateOrdersList = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
  };

  const handleAddOrder = (newOrder: Order) => {
    setOrders(prev => [...prev, newOrder]);
  };

  const handleAddTransaction = (newTxn: Transaction) => {
    setTransactions(prev => [...prev, newTxn]);
  };

  const handleAddTicket = (newTicket: Ticket) => {
    setTickets(prev => [...prev, newTicket]);
  };

  const handleReplyTicket = (ticketId: number, autoReply: TicketReply) => {
    setTickets(prev => prev.map(tick => {
      if (tick.id === ticketId) {
        return {
          ...tick,
          status: 'answered',
          replies: [...tick.replies, autoReply]
        };
      }
      return tick;
    }));
  };

  const handleAddNotification = (newNotif: Notification) => {
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Swapping Accounts profile (Simulates authentic Auth systems)
  const handleSwapProfile = (userId: number) => {
    const matched = users.find(u => u.id === userId);
    if (matched) {
      setCurrentUser(matched);
      handleAddNotification({
        id: Math.random().toString(),
        userId: matched.id,
        text: `Logged into session workspace as profile: ${matched.username.toUpperCase()}`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  };

  // Admin Force settle pending invoice
  const handleForceSettlePayment = (invoiceId: string) => {
    // Manually complete a pending transaction
    const depositAmount = 15.00; // Mock fixed checking test amount
    
    const refreshedUser = {
      ...currentUser,
      balance: currentUser.balance + depositAmount
    };
    handleUpdateUser(refreshedUser);

    handleAddTransaction({
      id: invoiceId,
      userId: currentUser.id,
      username: currentUser.username,
      type: 'deposit',
      amount: depositAmount,
      currency: 'USD',
      gateway: "KHQR (Direct ABA Force Approval)",
      status: 'success',
      remarks: `Dynamic manual operator override settlement`,
      referenceCode: "FORCE_ACQ_" + Math.random().toString(36).substring(2, 6).toUpperCase(),
      createdAt: new Date().toISOString()
    });

    handleAddNotification({
      id: Math.random().toString(),
      userId: currentUser.id,
      text: `Approved payment receipts: $15.00 credited via AdminOverride force settlement!`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div id="main-panel-application fill" className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans">
      
      {/* Top Navigation Headers */}
      <header className="bg-[#0a0f1d] border-b border-slate-800 sticky top-0 z-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Logo Text banner */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center justify-center">
            <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div>
            <h1 className="text-white font-bold tracking-tight text-base select-none">
              SMM<span className="text-blue-500 font-black">PRO</span> <span className="text-slate-400 text-xs font-medium ml-1">Cambodia</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-mono">
              PHP 8.2 MVC &bull; MY SQL &bull; DYNAMIC KHQR
            </p>
          </div>
        </div>

        {/* Global Controls Section: Language / User Switching */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Active Profile Swap Dropdown widget */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={`${currentUser.username} avatar`}
                className="w-4 h-4 rounded-full object-cover border border-blue-500 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            )}
            <span className="text-slate-400 font-medium">{t.currentUserLabel}:</span>
            <select
              value={currentUser.id}
              onChange={(e) => handleSwapProfile(parseInt(e.target.value))}
              className="bg-transparent border-none text-white font-bold focus:outline-none focus:ring-0 text-xs py-0 cursor-pointer dark:bg-slate-950"
            >
              {users.map(u => (
                <option key={u.id} value={u.id} className="bg-[#0a0f1d] text-white">
                  {u.username.toUpperCase()} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Lang Swapper */}
          <button
            onClick={() => setLang(prev => prev === 'en' ? 'km' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-800 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold">{lang === 'en' ? 'ភាសាខ្មែរ' : 'English'}</span>
          </button>
        </div>
      </header>

      {/* Main Framework Contents View grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar panel */}
        <nav className="w-full md:w-64 shrink-0 flex flex-col bg-[#0a0f1d] border border-slate-800 p-4 rounded-2xl shadow-sm h-fit gap-1.5 space-y-1">
          <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-500 select-none">
            SYSTEM CONTROL
          </div>

          {[
            { id: 'simulator', name: t.quickOrder, icon: <ShoppingBag className="w-4 h-4" /> },
            { id: 'checkout', name: t.availableBalance, icon: <Landmark className="w-4 h-4 text-emerald-400" /> },
            { id: 'api', name: t.apiSandbox, icon: <Terminal className="w-4 h-4" /> },
            { id: 'cron', name: t.autoCron, icon: <RefreshCw className="w-4 h-4" /> },
            { id: 'admin', name: t.adminDesk, icon: <Shield className="w-4 h-4 text-rose-400" /> },
          ].map(it => (
            <button
              key={it.id}
              onClick={() => startTransition(() => { setActiveTab(it.id as any); })}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all duration-200 cursor-pointer ${
                activeTab === it.id
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {it.icon}
              {it.name}
            </button>
          ))}

          {/* PHP Code Exporter separates block */}
          <div className="w-full border-t border-slate-800 my-2 pt-2" />
          <div className="px-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 select-none">
            DEVELOPER ACCESS
          </div>

          <button
            onClick={() => startTransition(() => { setActiveTab('exporter'); })}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all duration-200 cursor-pointer ${
              activeTab === 'exporter'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Code className="w-4 h-4 text-blue-400" />
            {t.phpExporter}
          </button>

          {/* Balance widget inside navigation bar exactly like Design HTML */}
          <div className="mt-6 p-1">
            <div className={`bg-gradient-to-br from-indigo-950/40 to-blue-950/40 border rounded-2xl p-4 transition-all duration-300 ${
              shouldPulse
                ? 'border-emerald-500/50 bg-[#0d1e2e]/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.03]'
                : 'border-indigo-500/20 shadow-none scale-100'
            }`}>
              <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider mb-1">
                {t.availableBalance}
              </p>
              <p className={`text-2xl font-black font-mono transition-all duration-300 ${
                shouldPulse ? 'text-emerald-400 scale-105' : 'text-white scale-100'
              }`}>
                ${currentUser.balance.toFixed(2)}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-400 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                KHQR AUTO DEPOSIT ACTIVE
              </div>
            </div>
          </div>
        </nav>

        {/* Dynamic Display Panels (Right Column) */}
        <main className="flex-1 min-w-0">
          
          {activeTab === 'simulator' && (
            <UserDashboard
              currentUser={currentUser}
              orders={orders}
              transactions={transactions}
              tickets={tickets}
              notifications={notifications}
              onUpdateUser={handleUpdateUser}
              onAddOrder={handleAddOrder}
              onAddTransaction={handleAddTransaction}
              onAddTicket={handleAddTicket}
              onReplyTicket={handleReplyTicket}
              onAddNotification={handleAddNotification}
              onClearNotifications={handleClearNotifications}
              onNavigateTab={(tabId) => setActiveTab(tabId)}
            />
          )}

          {activeTab === 'checkout' && (
            <KHQRDeposit
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              onAddTransaction={handleAddTransaction}
              onAddNotification={handleAddNotification}
              prefilledDepositAmount={prefilledDepositAmount}
              onClearPrefill={() => setPrefilledDepositAmount('')}
            />
          )}

          {activeTab === 'api' && (
            <APISandbox
              currentUser={currentUser}
              services={services}
              orders={orders}
              onUpdateUser={handleUpdateUser}
              onAddOrder={handleAddOrder}
            />
          )}

          {activeTab === 'cron' && (
            <CronSimulator
              orders={orders}
              users={users}
              onUpdateOrders={handleUpdateOrdersList}
              onUpdateUsers={handleUpdateUsersList}
              onAddTransaction={handleAddTransaction}
              onAddNotification={handleAddNotification}
            />
          )}

          {activeTab === 'admin' && (
            <AdminDashboard
              currentUser={currentUser}
              users={users}
              services={services}
              orders={orders}
              transactions={transactions}
              tickets={tickets}
              onUpdateUsers={handleUpdateUsersList}
              onUpdateServices={handleUpdateServicesList}
              onAddTransaction={handleAddTransaction}
              onAddNotification={handleAddNotification}
              onForceSettlePayment={handleForceSettlePayment}
            />
          )}

          {activeTab === 'exporter' && (
            <PHPCodeExplorer />
          )}

        </main>
      </div>

      {/* Persistent global footer credits banner */}
      <footer className="bg-[#0a0f1d] border-t border-slate-800 py-6 text-center text-[10px] text-slate-500 font-mono mt-auto select-none">
        Cambodia SMM Pro &bull; Designed in modern Immersive UI React Simulators &bull; Rendering raw PHP 8+ MVC structures
      </footer>
    </div>
  );
}
