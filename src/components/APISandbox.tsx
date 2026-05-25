import { useState } from 'react';
import { Terminal, Key, Copy, Check, Play, RefreshCw, Layers, HelpCircle, ArrowRight, Code } from 'lucide-react';
import { User, SmmService, Order } from '../types';

interface APISandboxProps {
  currentUser: User;
  services: SmmService[];
  orders: Order[];
  onUpdateUser: (updatedUser: User) => void;
  onAddOrder: (newOrder: Order) => void;
}

export default function APISandbox({
  currentUser,
  services,
  orders,
  onUpdateUser,
  onAddOrder
}: APISandboxProps) {
  const [apiKey, setApiKey] = useState<string>(currentUser.apikey);
  const [copiedKey, setCopiedKey] = useState(false);
  const [apiAction, setApiAction] = useState<'services' | 'balance' | 'add' | 'status'>('balance');

  // Input states for sandbox
  const [selectedServiceId, setSelectedServiceId] = useState<number>(services[0]?.id || 1);
  const [targetLink, setTargetLink] = useState<string>('https://instagram.com/p/Cxy8Z18xZ2/');
  const [targetQuantity, setTargetQuantity] = useState<number>(1000);
  const [statusOrderId, setStatusOrderId] = useState<string>('1');

  // Request/Response execution console states
  const [apiResponse, setApiResponse] = useState<any>({
    username: currentUser.username,
    balance: currentUser.balance.toFixed(4),
    currency: "USD"
  });
  const [apiHttpStatus, setApiHttpStatus] = useState<number>(200);
  const [apiHttpStatusText, setApiHttpStatusText] = useState<string>('200 OK');
  const [apiLoading, setApiLoading] = useState<boolean>(false);

  // Copy API Key
  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Reset API Key simulation
  const handleResetKey = () => {
    const rawRandom = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const nextKey = `smm_api_key_${rawRandom}`;
    setApiKey(nextKey);
    onUpdateUser({ ...currentUser, apikey: nextKey });
  };

  // Execute Sandbox Request
  const handleRunRequest = () => {
    setApiLoading(true);
    setTimeout(() => {
      setApiLoading(false);

      if (apiAction === 'balance') {
        setApiHttpStatus(200);
        setApiHttpStatusText('200 OK');
        setApiResponse({
          username: currentUser.username,
          balance: currentUser.balance.toFixed(4),
          currency: "USD"
        });
      } else if (apiAction === 'services') {
        setApiHttpStatus(200);
        setApiHttpStatusText('200 OK');
        setApiResponse(
          services.map(s => ({
            id: s.id,
            name: s.name,
            rate: s.ratePer1000,
            min: s.minOrder,
            max: s.maxOrder,
            description: s.description,
            category: s.categoryId
          }))
        );
      } else if (apiAction === 'status') {
        const trgId = parseInt(statusOrderId);
        const matched = orders.find(o => o.id === trgId);

        if (!matched) {
          setApiHttpStatus(404);
          setApiHttpStatusText('404 Not Found');
          setApiResponse({
            error: "Order matching requested tracking ID was not found or belongs to another workspace."
          });
        } else {
          setApiHttpStatus(200);
          setApiHttpStatusText('200 OK');
          setApiResponse({
            id: matched.id,
            status: matched.status,
            start_count: matched.startCounter,
            remains: matched.remains,
            charge: matched.charge.toFixed(4),
            link: matched.link,
            quantity: matched.quantity
          });
        }
      } else if (apiAction === 'add') {
        // Find service
        const svc = services.find(s => s.id === selectedServiceId);
        if (!svc) {
          setApiHttpStatus(400);
          setApiHttpStatusText('400 Bad Request');
          setApiResponse({ error: "Invalid SMM Service Selected ID." });
          return;
        }

        if (targetQuantity < svc.minOrder || targetQuantity > svc.maxOrder) {
          setApiHttpStatus(420);
          setApiHttpStatusText('420 Unprocessable Content');
          setApiResponse({
            error: `Order volume validation failed. Volume boundary is min: ${svc.minOrder}, max: ${svc.maxOrder}.`
          });
          return;
        }

        const cost = (svc.ratePer1000 / 1000) * targetQuantity;
        if (currentUser.balance < cost) {
          setApiHttpStatus(402);
          setApiHttpStatusText('402 Payment Required');
          setApiResponse({
            error: `Developer credit is insufficient. Required charge: $${cost.toFixed(4)}, current wallet: $${currentUser.balance.toFixed(4)}.`
          });
          return;
        }

        // Subtract balance and add order
        const updated = {
          ...currentUser,
          balance: currentUser.balance - cost
        };
        onUpdateUser(updated);

        const nextOrdId = orders.length + 1;
        const newOrd: Order = {
          id: nextOrdId,
          userId: currentUser.id,
          username: currentUser.username,
          serviceId: svc.id,
          serviceName: svc.name,
          categoryName: svc.categoryId,
          link: targetLink,
          quantity: targetQuantity,
          charge: cost,
          startCounter: 0,
          remains: targetQuantity,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        onAddOrder(newOrd);

        setApiHttpStatus(200);
        setApiHttpStatusText('200 OK');
        setApiResponse({
          status: "success",
          order: nextOrdId,
          charge: cost.toFixed(4),
          currency: "USD",
          link: targetLink,
          remains: targetQuantity
        });
      }
    }, 500);
  };

  // Dynamic CLI code assembler
  const getCurlCmd = () => {
    const base = `curl -X POST "https://your-smm-domain.com/api" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "${apiAction}"`;

    if (apiAction === 'add') {
      return base + `,
    "service": ${selectedServiceId},
    "link": "${targetLink}",
    "quantity": ${targetQuantity}
  }'`;
    } else if (apiAction === 'status') {
      return base + `,
    "order": ${statusOrderId}
  }'`;
    }

    return base + `\n  }'`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in text-slate-300" id="api-sandbox-wrapper">
      
      {/* Sandbox controller panel */}
      <div className="xl:col-span-7 space-y-6">
        
        {/* API Credentials Card */}
        <div className="bg-[#0a0f1d] rounded-2xl p-6 border border-slate-800">
          <h3 className="text-white font-semibold mb-1 flex items-center gap-2 text-sm">
            <Key className="w-4 h-4 text-indigo-400" />
            Developer Access Credentials
          </h3>
          <p className="text-xs text-slate-500 mb-4">Your rest SMM credentials. Authenticate queries using Bearer values.</p>
          
          <div className="flex gap-2.5">
            <div className="flex-1 px-4 py-2.5 border border-slate-800 bg-slate-950 text-xs font-mono rounded-xl select-all select-none truncate flex items-center justify-between text-slate-400">
              <span className="truncate">{apiKey}</span>
            </div>
            <button
              onClick={handleCopyKey}
              className="px-3 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              title="Copy Key"
            >
              {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleResetKey}
              className="px-3 py-2.5 bg-rose-500/10 border-none hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
              title="Regenerate Token"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Key
            </button>
          </div>
        </div>

        {/* Sandbox Executor */}
        <div className="bg-[#0a0f1d] rounded-2xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
              <Code className="w-4 h-4 text-indigo-400" />
              Interactive API Runner
            </h3>
            <span className="text-[10px] uppercase font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
              HTTP/1.1 Live Simulator
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Endpoints Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">
                API Action Endpoint
              </label>
              <select
                value={apiAction}
                onChange={(e) => setApiAction(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-505 font-medium"
              >
                <option value="balance">balance (Query wallet contents)</option>
                <option value="services">services (Retrieve service directory)</option>
                <option value="add">add (Create new SMM campaign)</option>
                <option value="status">status (Check campaign status)</option>
              </select>
            </div>

            {/* Conditional input params */}
            {apiAction === 'status' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">
                  Check Order ID
                </label>
                <input
                  type="number"
                  placeholder="Order ID"
                  value={statusOrderId}
                  onChange={(e) => setStatusOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-505 font-mono"
                />
              </div>
            )}

            {apiAction === 'add' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">
                    Select Target SMM Service
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-550 font-medium font-sans"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        [{s.id}] {s.name} - ${s.ratePer1000}/K
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800/80 pt-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">
                      Social Link Connection
                    </label>
                    <input
                      type="url"
                      value={targetLink}
                      onChange={(e) => setTargetLink(e.target.value)}
                      placeholder="https://instagram.com/p/xxx"
                      className="w-full px-3 py-2 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-550 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">
                      Campaign Volume (Quantity)
                    </label>
                    <input
                      type="number"
                      value={targetQuantity}
                      onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-550 font-medium"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleRunRequest}
            disabled={apiLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer border-none transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(79,70,229,0.15)]"
          >
            {apiLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Querying REST server logs...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Simulated Command API
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal View Code & API Docs (Right side) */}
      <div className="xl:col-span-5 space-y-6">
        
        {/* Terminal view container */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[480px]">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs font-mono">
            <span className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </span>
            <div className="w-[1px] h-3 bg-slate-800" />
            <span className="text-slate-400 select-none">Developer Console Sandbox</span>
          </div>

          {/* cURL input */}
          <div className="p-4 bg-slate-900/40 border-b border-slate-800 text-[10px] font-mono select-all">
            <span className="text-slate-500 block mb-1 uppercase tracking-wider text-[8px] font-bold">Generated cURL query:</span>
            <pre className="text-slate-300 leading-normal whitespace-pre bg-zinc-950/70 p-2.5 rounded-lg border border-slate-800/60">
              {getCurlCmd()}
            </pre>
          </div>

          {/* API output */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] leading-relaxed select-all scrollbar-thin scrollbar-thumb-slate-800">
            <div className="flex justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-slate-500 uppercase tracking-wider text-[8px] font-bold">Response Parameters:</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold select-none ${
                apiHttpStatus === 200
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {apiHttpStatusText}
              </span>
            </div>
            
            <pre className="text-indigo-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/50">{JSON.stringify(apiResponse, null, 2)}</pre>
          </div>
        </div>

        {/* Short Docs card */}
        <div className="bg-[#0a0f1d] rounded-2xl p-5 border border-slate-800">
          <h4 className="font-semibold text-white text-xs flex items-center gap-1.5 mb-2">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            Quick API Implementation Guideline
          </h4>
          <p className="text-[11px] text-slate-400 leading-normal mb-3">
            In your actual workspace programs, integrate this SMM Panel API to automates placing of orders from third party services. Review endpoints guidelines in detail inside the <span className="font-mono text-indigo-400 text-[10px]">INSTALLATION_GUIDE</span> folder tree.
          </p>
          <div className="text-[10px] font-mono text-slate-550 flex items-center justify-between border-t border-slate-800 pt-3">
            <span>Server response limit: 60/min</span>
            <span className="flex items-center gap-1 text-indigo-450 font-bold">
              Full docs inside codebase
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
