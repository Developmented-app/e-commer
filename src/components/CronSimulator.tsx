import { useState } from 'react';
import { Terminal, RefreshCw, Send, AlertTriangle, ArrowRight, Play, CheckCircle2, Info } from 'lucide-react';
import { Order, User, Transaction, Notification } from '../types';

interface CronSimulatorProps {
  orders: Order[];
  users: User[];
  onUpdateOrders: (updatedOrders: Order[]) => void;
  onUpdateUsers: (updatedUsers: User[]) => void;
  onAddTransaction: (txn: Transaction) => void;
  onAddNotification: (notif: Notification) => void;
}

export default function CronSimulator({
  orders,
  users,
  onUpdateOrders,
  onUpdateUsers,
  onAddTransaction,
  onAddNotification
}: CronSimulatorProps) {
  const [cronLogs, setCronLogs] = useState<string[]>([]);
  const [running, setRunning] = useState<boolean>(false);
  const [telegramFeed, setTelegramFeed] = useState<string[]>([]);

  const handleRunCron = () => {
    setRunning(true);
    const logTime = () => `[${new Date().toLocaleTimeString()}]`;
    
    setCronLogs([
      `${logTime()} Core Automated Sync Engine initialized...`,
      `${logTime()} Reading DB state: SELECT * FROM orders WHERE status IN ('pending', 'processing')`
    ]);

    setTimeout(() => {
      // Find active orders
      const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
      
      if (activeOrders.length === 0) {
        setCronLogs(prev => [
          ...prev,
          `${logTime()} Sync complete: 0 active orders found.`,
          `${logTime()} Sync process exited safely.`
        ]);
        setRunning(false);
        return;
      }

      setCronLogs(prev => [
        ...prev,
        `${logTime()} Detected ${activeOrders.length} active campaigns. Allocating cron threads...`
      ]);

      // Iterate orders and transition states
      const updatedOrders = orders.map(order => {
        if (order.status === 'pending') {
          // Transition to processing
          setCronLogs(prev => [
            ...prev,
            `${logTime()} [PROV_SYNC] Syncing Order #${order.id} with partner provider. Start counter set to 410. Status updated to: PROCESSING`
          ]);
          return { ...order, status: 'processing' as const, startCounter: 410, remains: Math.round(order.quantity * 0.7) };
        } else if (order.status === 'processing') {
          // Randomly complete or cancel with refund
          const randOutcome = Math.random() > 0.35 ? 'completed' : 'canceled';

          if (randOutcome === 'completed') {
            setCronLogs(prev => [
              ...prev,
              `${logTime()} [DELIVERY] Progress check Order #${order.id} verified 100% delivered. Status updated to: COMPLETED`
            ]);
            return { ...order, status: 'completed' as const, remains: 0 };
          } else {
            // Cancel and initiate refund flow!
            setCronLogs(prev => [
              ...prev,
              `${logTime()} [WARNING] Partners API returned order cancellation for Order #${order.id}. Initiating automatic refund state logs...`,
              `${logTime()} [REFUND] Crediting +$${order.charge.toFixed(4)} back to user id ${order.userId} (username: ${order.username}).`,
              `${logTime()} [LEDGER] Written transaction refund registry block in transactions db.`
            ]);

            // Add transaction ledger
            setTimeout(() => {
              onAddTransaction({
                id: "SMM_RF_" + Math.random().toString(36).substring(2, 8).toUpperCase(),
                userId: order.userId,
                username: order.username,
                type: 'order_refund',
                amount: order.charge,
                currency: 'USD',
                gateway: 'System Automated Auto Refund',
                status: 'success',
                remarks: `SMM Partner Cancellation automatic refund - Order #${order.id}`,
                createdAt: new Date().toISOString()
              });

              // Add user credit back
              const trgUser = users.find(u => u.id === order.userId);
              if (trgUser) {
                const refreshedUsers = users.map(u => {
                  if (u.id === trgUser.id) {
                    return { ...u, balance: u.balance + order.charge };
                  }
                  return u;
                });
                onUpdateUsers(refreshedUsers);
              }

              // In-app alert
              onAddNotification({
                id: Math.random().toString(),
                userId: order.userId,
                text: `Refund for Cancelled Order #${order.id} processed: +$${order.charge.toFixed(4)} credited to available balance.`,
                type: 'warning',
                read: false,
                createdAt: new Date().toISOString()
              });
            }, 100);

            // Trigger simulated Telegram channel dispatch alert
            const rawTeleText = `⚠️ *SMM Cancellation Refund*\n\n`
                              + `👤 *User ID:* ${order.userId}\n`
                              + `📦 *Order Ref:* #${order.id}\n`
                              + `💵 *Canceled Charge:* $${order.charge.toFixed(4)} USD\n`
                              + `🏦 *Status:* Automatically Refunded`;
            setTelegramFeed(prev => [rawTeleText, ...prev]);

            return { ...order, status: 'canceled' as const, remains: order.quantity };
          }
        }
        return order;
      });

      onUpdateOrders(updatedOrders);

      setCronLogs(prev => [
        ...prev,
        `${logTime()} Synchronized partner updates successfully. Exiting thread.`,
        `${logTime()} All automation schedules finalized.`
      ]);
      setRunning(false);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="cron-simulator-container">
      
      {/* Visual Execution Control Box */}
      <div className="xl:col-span-7 bg-[#0a0f1d] rounded-2xl p-6 border border-slate-800 flex flex-col justify-between text-slate-300">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base font-sans">Automation Cronjob Simulator</h3>
              <p className="text-xs text-slate-450">Run background checks updating order stats and automated refunds.</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            SMM Panel webapps require shell cronjobs executing every 5 minutes in background partitions. This script sweeps orders having status <span className="font-mono bg-slate-900 px-1 py-0.5 rounded text-[10px] text-slate-300">pending</span> or <span className="font-mono bg-slate-900 px-1 py-0.5 rounded text-[10px] text-slate-300">processing</span>, connects with simulated Provider APIs, alters states, and enforces auto-credits refunds on cancellations.
          </p>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 flex items-start gap-2.5 text-xs text-slate-400 leading-normal">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Simulation Mechanics:</strong> Placing an SMM Order as a client will initially leave it pending. Click <strong>&quot;Run Synchronization&quot;</strong> here to transition it into Processing, and subsequently into Complete or Canceled (with instant balance credit refunds!).
            </span>
          </div>
        </div>

        <button
          onClick={handleRunCron}
          disabled={running}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 mt-6 border-none shadow-[0_4px_12px_rgba(79,70,229,0.2)]"
        >
          {running ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Executing Automated Threads...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Run 5-Min SMM Automation Sync
            </>
          )}
        </button>
      </div>

      {/* Real-time terminal output logs */}
      <div className="xl:col-span-5 space-y-5">
        
        {/* CLI Logs Box */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-56">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono select-none text-slate-400">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>CRON SMM Automation Logs</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] leading-relaxed text-slate-300 space-y-1 bg-slate-950/80 scrollbar-thin scrollbar-thumb-zinc-800">
            {cronLogs.map((log, index) => (
              <div key={index} className="truncate select-all">
                {log.includes('WARNING') ? (
                  <span className="text-yellow-450">{log}</span>
                ) : log.includes('REFUND') || log.includes('COMPLETED') ? (
                  <span className="text-emerald-400">{log}</span>
                ) : (
                  <span className="text-slate-400">{log}</span>
                )}
              </div>
            ))}
            {cronLogs.length === 0 && (
              <div className="text-center py-12 text-slate-500 select-none">
                ~ Awaiting interactive execution trigger ~
              </div>
            )}
          </div>
        </div>

        {/* Telegram dispatcher mock logs */}
        <div className="bg-[#229ED9]/10 rounded-2xl p-4 border border-[#229ED9]/20 flex flex-col justify-between h-44">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#229ED9] mb-2">
            <Send className="w-4 h-4" />
            <span>Simulated Telegram Channel Alert Logs</span>
          </div>
          
          <div className="flex-1 overflow-y-auto font-mono text-[9px] text-slate-300 bg-slate-950/40 p-2.5 rounded-lg leading-normal border border-[#229ED9]/10 scrollbar-thin space-y-2">
            {telegramFeed.length > 0 ? (
              telegramFeed.map((feed, i) => (
                <div key={i} className="whitespace-pre-wrap select-all">
                  {feed}
                  <div className="w-full border-t border-slate-800 my-1" />
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-slate-500 flex items-center justify-center select-none">
                No alert channels broadcasted.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
