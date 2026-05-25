import React, { useState, useEffect, useRef } from 'react';
import { QrCode, ArrowRight, RotateCw, AlertCircle, Info, CheckCircle2, Wallet, Coins, Landmark, Terminal, Bell } from 'lucide-react';
import { User, Transaction, Notification } from '../types';

interface KHQRDepositProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  onAddTransaction: (txn: Transaction) => void;
  onAddNotification: (notif: Notification) => void;
  prefilledDepositAmount?: string;
  onClearPrefill?: () => void;
}

export default function KHQRDeposit({
  currentUser,
  onUpdateUser,
  onAddTransaction,
  onAddNotification,
  prefilledDepositAmount,
  onClearPrefill
}: KHQRDepositProps) {
  // Input form state
  const [amount, setAmount] = useState<string>('15.00');
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [selectedBank, setSelectedBank] = useState<string>('ABA');

  useEffect(() => {
    if (prefilledDepositAmount) {
      setAmount(prefilledDepositAmount);
      if (onClearPrefill) {
        onClearPrefill();
      }
    }
  }, [prefilledDepositAmount, onClearPrefill]);

  // Interactive Payment State
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [khqrString, setKhqrString] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [pollingTime, setPollingTime] = useState<number>(180); // 3 mins countdown
  const [pollingLogs, setPollingLogs] = useState<string[]>([]);
  const [checkingIndicator, setCheckingIndicator] = useState<boolean>(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Bank Info mapping
  const bankDetails: Record<string, { name: string; color: string; bgColor: string; border: string }> = {
    ABA: { name: 'ABA Bank', color: 'text-sky-600', bgColor: 'bg-sky-50 dark:bg-sky-950/20', border: 'border-sky-200 dark:border-sky-900/50' },
    ACLEDA: { name: 'ACLEDA ToanChet', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900/50' },
    Wing: { name: 'Wing Money', color: 'text-lime-600', bgColor: 'bg-lime-50 dark:bg-lime-950/20', border: 'border-lime-200 dark:border-lime-900/50' },
    Bakong: { name: 'Bakong Core Net', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-900/50' },
    TrueMoney: { name: 'TrueMoney Wallet', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-900/50' }
  };

  const handleGenerateQR = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      alert("Minimum deposit is $1.00 or 4,000 KHR");
      return;
    }

    const mockInvoiceId = "SMM_" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Simulate complex NBC standard EMVCo KHQR String compilation
    const mid = "MERCH_" + selectedBank.toUpperCase() + "_SMM";
    const bankAccount = currency === 'USD' ? '001293881' : '001293882';
    const mcc = "5411";
    const currCode = currency === 'USD' ? '840' : '116';
    
    // Fake constructed KHQR string matching generator
    const fakeString = `00020101021229380011${mid}0103ABA0209${bankAccount}5204${mcc}5303${currCode}5405${numAmount.toFixed(2)}5802KH5912KHMERSMMSRV6010PhnomPenh62180108${mockInvoiceId}0506DEPOSIT6304D1B9`;

    setInvoiceId(mockInvoiceId);
    setKhqrString(fakeString);
    setPaymentStatus('pending');
    setPollingTime(180);
    setPollingLogs([
      `[${new Date().toLocaleTimeString()}] Dynamic KHQR invoice compiled successfully.`,
      `[${new Date().toLocaleTimeString()}] Registered pending deposit refer: ${mockInvoiceId} inside memory state.`,
      `[${new Date().toLocaleTimeString()}] Triggered Bakong Open API status syncing loop (Interval: 3000ms).`
    ]);

    // Clear previous polling
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Dynamic Checking loop status every 3s
    pollIntervalRef.current = setInterval(() => {
      setCheckingIndicator(true);
      setTimeout(() => setCheckingIndicator(false), 800);
      setPollingLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Routing check: GET /api/payment/status/${mockInvoiceId} -> [Status Result: PENDING]`
      ]);
    }, 3000);

    countdownIntervalRef.current = setInterval(() => {
      setPollingTime(prev => {
        if (prev <= 1) {
          clearInterval(pollIntervalRef.current!);
          clearInterval(countdownIntervalRef.current!);
          setPaymentStatus('failed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Trigger Mock Bank-Push Payment Webhook Simulation
  const handleSimulatePayment = () => {
    if (!invoiceId || paymentStatus !== 'pending') return;

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    const depositAmount = parseFloat(amount);
    const usdConvertedAmount = currency === 'USD' ? depositAmount : depositAmount / 4100;
    const finalCredit = Math.round(usdConvertedAmount * 10000) / 10000;

    // Simulate Webhook trigger sequence
    setPollingLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 👉 INTERIM EVENT: Triggering simulator bank settlement loop...`,
      `[${new Date().toLocaleTimeString()}] ASYNC POST to https://ais-dev/webhook/khqr with standard payload.`,
      `[${new Date().toLocaleTimeString()}] Authenticating X-KHQR-Signature HMAC-SHA256 headers -> SUCCESS.`,
      `[${new Date().toLocaleTimeString()}] Updating payments table: SET status = 'success' for invoice ${invoiceId}.`,
      `[${new Date().toLocaleTimeString()}] Adding $${finalCredit.toFixed(4)} to user id ${currentUser.id} (username: ${currentUser.username}).`,
      `[${new Date().toLocaleTimeString()}] Broadcaster: Dispatching Telegram Bot channel notifications.`,
      `[${new Date().toLocaleTimeString()}] Webhook process finalized with HTTP Code 200 SUCCESS.`
    ]);

    // Process State updates
    setPaymentStatus('success');

    // Load user credit
    const updatedUser = {
      ...currentUser,
      balance: currentUser.balance + finalCredit
    };
    onUpdateUser(updatedUser);

    // Save transaction ledger record
    const newTxn: Transaction = {
      id: invoiceId,
      userId: currentUser.id,
      username: currentUser.username,
      type: 'deposit',
      amount: finalCredit,
      currency: 'USD',
      gateway: `KHQR (${selectedBank})`,
      status: 'success',
      remarks: `Dynamic KHQR auto credit - Invoice: ${invoiceId}`,
      referenceCode: "REF_BK_" + Math.random().toString().substring(2, 10),
      createdAt: new Date().toISOString()
    };
    onAddTransaction(newTxn);

    // Send visual notification
    const newNotif: Notification = {
      id: Math.random().toString(),
      userId: currentUser.id,
      text: `Charged +$${finalCredit.toFixed(2)} to SMM panel account balance via dynamic KHQR (${selectedBank})!`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString()
    };
    onAddNotification(newNotif);
  };

  const handleCancelPayment = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setPaymentStatus('idle');
    setInvoiceId(null);
    setKhqrString(null);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Format KHR/USD rates display
  const exchangeRateInfo = currency === 'KHR'
    ? `~ $${(parseFloat(amount) / 4100 || 0).toFixed(4)} USD (1 USD = 4,100 KHR)`
    : `~ ៛ ${(parseFloat(amount) * 4100 || 0).toLocaleString()} KHR`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="khqr-deposit-wrapper">
      
      {/* KHQR Checkout Form (Left side) */}
      <div className="xl:col-span-7 bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Fund SMM Balance</h3>
              <p className="text-xs text-slate-400">Scan NBC standard Dynamic KHQR for instantaneous automated settlement.</p>
            </div>
          </div>

          {paymentStatus === 'idle' ? (
            <form onSubmit={handleGenerateQR} className="space-y-5">
              
              {/* Bank selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Billing App Network
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.keys(bankDetails).map(bankKey => {
                    const active = selectedBank === bankKey;
                    const info = bankDetails[bankKey];
                    return (
                      <button
                        key={bankKey}
                        type="button"
                        onClick={() => setSelectedBank(bankKey)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          active
                            ? 'border-rose-500 bg-[#3b0712] text-rose-400 shadow-[0_4px_12px_rgba(244,63,94,0.15)]'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900/30'
                        }`}
                      >
                        <Landmark className={`w-5 h-5 mb-1 ${active ? 'text-rose-500' : 'text-slate-500'}`} />
                        <span className="text-xs font-semibold text-slate-200">{info.name}</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Instant Verify</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Deposit Transaction Currency
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setCurrency('USD'); setAmount(parseFloat(amount) > 100 ? '15.00' : amount); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      currency === 'USD'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-[0_4px_12px_rgba(37,99,235,0.2)]'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900/30'
                    }`}
                  >
                    USD ($) Standard Ledger
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCurrency('KHR'); setAmount('60000'); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      currency === 'KHR'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-[0_4px_12px_rgba(37,99,235,0.2)]'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900/30'
                    }`}
                  >
                    KHR (៛) Cambodian Riel
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label htmlFor="deposit-amount" className="block text-xs font-semibold text-slate-300 mb-2">
                  Deposit Billing Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-medium text-xs">
                    {currency === 'USD' ? '$' : '៛'}
                  </div>
                  <input
                    id="deposit-amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="25.00"
                    className="w-full pl-8 pr-16 py-3 border border-slate-800 rounded-xl text-sm text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 font-bold">
                    {currency}
                  </div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[11px] text-slate-400">{exchangeRateInfo}</span>
                  <span className="text-[11px] text-slate-400 font-semibold text-rose-500">Min: {currency === 'USD' ? '$1.00' : '៛ 4,000'}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
                <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  By compiling, the backend generates an NBC dynamic QR. Status checkers poll every 3 seconds searching Acquirer Ledger banks records until callback webhook settles.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all hover:shadow-[0_4px_12px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2 border-none"
              >
                <QrCode className="w-4 h-4" />
                Generate Dynamic KHQR Image
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              
              {/* Payment Processing details */}
              <div className="flex flex-col items-center justify-center py-4">
                {paymentStatus === 'pending' ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-3">
                      <div className="w-12 h-12 rounded-full border-4 border-rose-950 border-t-rose-500 animate-spin" />
                      <QrCode className="w-5 h-5 text-rose-400 absolute top-3.5 left-3.5" />
                    </div>
                    <h4 className="font-semibold text-white text-sm">Awaiting KHQR scanned payment</h4>
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      Dynamic banking checker listening...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/20">
                      <CheckCircle2 className="w-6 h-6 animate-bounce" />
                    </div>
                    <h4 className="font-semibold text-white text-sm">Payment Confirmed Successfully!</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Invoice <span className="font-mono text-blue-400 font-bold">{invoiceId}</span> fully settled via Acquirer API.
                    </p>
                  </div>
                )}
              </div>

              {/* Details table */}
              <div className="border border-slate-800 rounded-xl divide-y divide-slate-800 bg-slate-950 text-xs text-slate-350">
                <div className="px-4 py-2.5 flex justify-between">
                  <span>Tracking Invoice</span>
                  <span className="font-mono font-medium text-white">{invoiceId}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span>Deposit Amount</span>
                  <span className="font-semibold text-emerald-400">
                    {currency === 'USD' ? '$' : ''}{parseFloat(amount).toLocaleString()} {currency}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span>Settlement Bank</span>
                  <span className="font-semibold text-blue-400">
                    {bankDetails[selectedBank]?.name} Network
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span>Status Sync Code</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      paymentStatus === 'success' ? 'bg-emerald-500' : 'bg-yellow-500'
                    }`} />
                    <span className="uppercase text-slate-350">{paymentStatus}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelPayment}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  {paymentStatus === 'success' ? 'Make Another Deposit' : 'Cancel Billing Checkout'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic checking logs console */}
        {paymentStatus === 'pending' && (
          <div className="mt-6 border-t border-slate-800 pt-5">
            <h4 className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                Live Status Checking Log
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {checkingIndicator ? (
                  <span className="flex items-center gap-1 text-rose-400 font-semibold text-[9px]">
                    <RotateCw className="w-2.5 h-2.5 animate-spin" />
                    POLLING ACTIVE
                  </span>
                ) : (
                  '3s query clock'
                )}
              </span>
            </h4>
            <div className="bg-slate-950 rounded-xl p-3.5 font-mono text-[10px] leading-relaxed text-slate-400 overflow-y-auto h-28 space-y-1 border border-slate-800 select-all">
              {pollingLogs.map((log, index) => (
                <div key={index} className="truncate">
                  {log.includes('success') || log.includes('SUCCESS') ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.includes('👉') ? (
                    <span className="text-white font-medium">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visual Dynamic KHQR Display Box & Simulation Trigger (Right side) */}
      <div className="xl:col-span-5 bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-between min-h-[500px]">
        {paymentStatus === 'idle' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 opacity-70" />
            </div>
            <h4 className="font-semibold text-white text-sm">KHQR Render Engine</h4>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              Upon filling the deposit ticket, a high-fidelity NBC standard Bakong red KHQR layout will compile here, enabling a simulated scan execution.
            </p>
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col items-center justify-center space-y-6">
            
            {/* Visual Red Bakong Card Design */}
            <div className="bg-[#B71C1C] text-white w-full max-w-[290px] rounded-2xl shadow-xl p-4 flex flex-col items-center relative overflow-hidden ring-4 ring-rose-500/20">
              
              {/* Bakong Logo on Top */}
              <div className="w-full flex items-center justify-between mb-2.5 border-b border-white/10 pb-2">
                <span className="text-[10px] tracking-widest font-bold opacity-80">KHQR PAY SYSTEM</span>
                <Landmark className="w-4 h-4 text-white opacity-90" />
              </div>

              <div className="text-center mb-3">
                <h5 className="text-[11px] font-bold tracking-wide uppercase opacity-90 text-red-100">KHMER SMM SERVICES</h5>
                <span className="text-[9px] text-zinc-350">Phnom Penh, Cambodia</span>
              </div>

              {/* Stylized QR Area */}
              <div className="bg-white p-3.5 rounded-xl aspect-square w-48 relative flex items-center justify-center shadow-inner">
                {/* SVG Mocking a true Bakong KHQR pattern */}
                <svg className="w-full h-full text-zinc-950" viewBox="0 0 100 100">
                  {/* Outer boundary qr marks */}
                  <rect x="0" y="0" width="22" height="22" fill="currentColor" rx="2" />
                  <rect x="2" y="2" width="18" height="18" fill="white" rx="1.5" />
                  <rect x="6" y="6" width="10" height="10" fill="currentColor" rx="1" />

                  <rect x="78" y="0" width="22" height="22" fill="currentColor" rx="2" />
                  <rect x="80" y="2" width="18" height="18" fill="white" rx="1.5" />
                  <rect x="84" y="6" width="10" height="10" fill="currentColor" rx="1" />

                  <rect x="0" y="78" width="22" height="22" fill="currentColor" rx="2" />
                  <rect x="2" y="78" width="18" height="18" fill="white" rx="1.5" />
                  <rect x="6" y="84" width="10" height="10" fill="currentColor" rx="1" />

                  {/* Scattered dots */}
                  <rect x="30" y="4" width="6" height="4" fill="currentColor" />
                  <rect x="42" y="0" width="8" height="6" fill="currentColor" />
                  <rect x="58" y="4" width="4" height="8" fill="currentColor" />
                  <rect x="34" y="16" width="12" height="4" fill="currentColor" />
                  <rect x="4" y="30" width="8" height="6" fill="currentColor" />
                  <rect x="20" y="28" width="10" height="4" fill="currentColor" />
                  <rect x="14" y="40" width="6" height="8" fill="currentColor" />
                  <rect x="4" y="64" width="8" height="4" fill="currentColor" />

                  <rect x="78" y="32" width="12" height="6" fill="currentColor" />
                  <rect x="88" y="44" width="8" height="4" fill="currentColor" />
                  <rect x="68" y="52" width="4" height="12" fill="currentColor" />
                  <rect x="78" y="68" width="10" height="6" fill="currentColor" />

                  <rect x="30" y="78" width="14" height="4" fill="currentColor" />
                  <rect x="48" y="82" width="6" height="8" fill="currentColor" />
                  <rect x="34" y="90" width="12" height="4" fill="currentColor" />

                  {/* Complex inner matrix (animated when pending) */}
                  <g className={paymentStatus === 'pending' ? 'animate-pulse' : ''}>
                    <rect x="36" y="32" width="28" height="28" fill="currentColor" />
                    {/* Inner core mask */}
                    <rect x="41" y="41" width="18" height="18" fill="white" rx="2" />
                  </g>
                </svg>

                {/* BAKONG RED EMBLEM IN CENTER */}
                <span className="absolute bg-[#B71C1C] text-white p-1 rounded-md text-[8px] font-black tracking-tighter ring-2 ring-white select-none">
                  KHQR
                </span>
                
                {/* Visual success splash */}
                {paymentStatus === 'success' && (
                  <div className="absolute inset-0 bg-emerald-500/90 text-white flex flex-col items-center justify-center rounded-xl">
                    <CheckCircle2 className="w-10 h-10 mb-1 animate-bounce" />
                    <span className="text-xs font-bold tracking-widest uppercase">PAID</span>
                  </div>
                )}
              </div>

              {/* Pricing breakdown */}
              <div className="text-center mt-3 w-full">
                <span className="text-[10px] text-red-200">ACQUIRING {selectedBank.toUpperCase()} USD SETTLEMENT</span>
                <p className="text-xl font-black mt-0.5 select-all">
                  {currency === 'USD' ? '$' : '៛'} {parseFloat(amount).toLocaleString()}
                </p>
                <div className="text-[9px] font-mono text-white/70 py-1 px-2.5 bg-black/20 rounded-lg mt-1 truncate select-all">
                  REF: {invoiceId}
                </div>
              </div>

              {/* Scanning status banner */}
              <div className="w-full flex items-center justify-center gap-1.5 mt-3 border-t border-white/10 pt-3 text-[10px] text-red-100">
                {paymentStatus === 'pending' ? (
                  <>
                    <RotateCw className="w-3 h-3 animate-spin text-red-200" />
                    <span>Scan code with local Bank App</span>
                    <span className="font-mono bg-black/20 px-1.5 py-0.5 rounded ml-1">{Math.floor(pollingTime / 60)}:{(pollingTime % 60).toString().padStart(2, '0')}</span>
                  </>
                ) : (
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    TRANSACTION SETTLED
                  </span>
                )}
              </div>
            </div>

            {/* Test Payment Trigger Panel */}
            {paymentStatus === 'pending' && (
              <div className="w-full bg-[#181105] border border-amber-500/20 rounded-xl p-4 text-center space-y-3 shadow-inner">
                <div className="flex items-start gap-2 text-left">
                  <Coins className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-semibold text-amber-300">Test Account Integration Simulator</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Cambodia bank systems are isolated. Utilize this triggering dashboard to simulate scan, bank callbacks, and webhook pushes.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
                >
                  Simulate Bank Payment Success
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
