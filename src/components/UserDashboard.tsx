import React, { useState, useTransition, useRef, useEffect } from 'react';
import { User, SmmService, Order, Transaction, Ticket, TicketReply, Notification, Category } from '../types';
import { CATEGORIES, SERVICES } from '../data/servicesData';
import { ShoppingBag, ChevronRight, FileText, Send, HelpCircle, History, MessageSquare, Tag, AlertCircle, Info, Landmark, Check, Bell, BellOff, ArrowUpRight, DollarSign, Users, Award, Download, Camera, Upload, Trash2, User as UserIcon, Share2, QrCode, Copy, ExternalLink, X } from 'lucide-react';

interface UserDashboardProps {
  currentUser: User;
  orders: Order[];
  transactions: Transaction[];
  tickets: Ticket[];
  notifications: Notification[];
  onUpdateUser: (updatedUser: User) => void;
  onAddOrder: (order: Order) => void;
  onAddTransaction: (txn: Transaction) => void;
  onAddTicket: (ticket: Ticket) => void;
  onReplyTicket: (ticketId: number, reply: TicketReply) => void;
  onAddNotification: (notif: Notification) => void;
  onClearNotifications: () => void;
  onNavigateTab?: (tabId: 'simulator' | 'checkout' | 'api' | 'cron' | 'admin' | 'exporter') => void;
}

export default function UserDashboard({
  currentUser,
  orders,
  transactions,
  tickets,
  notifications,
  onUpdateUser,
  onAddOrder,
  onAddTransaction,
  onAddTicket,
  onReplyTicket,
  onAddNotification,
  onClearNotifications,
  onNavigateTab
}: UserDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'order' | 'history' | 'deposits' | 'tickets' | 'referrals'>('order');
  const [, startTransition] = useTransition();

  const balanceThreshold = currentUser.autoDepositThreshold !== undefined ? currentUser.autoDepositThreshold : 5.0;
  const setBalanceThreshold = (val: number) => {
    onUpdateUser({
      ...currentUser,
      autoDepositThreshold: val
    });
  };

  // Avatar webcam, drag and drop, and upload states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Stop camera tracks helper
  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  // Safe camera stream unmount cleanup
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  // Activate webcam stream
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Webcam camera API is not supported in this browser environment context (or is nested behind iframe protocols).");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 320, facingMode: 'user' },
        audio: false
      });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.error("Error playing video stream:", err);
        });
      }
    } catch (err: any) {
      console.error("Error accessing camera stream:", err);
      setCameraError("Access to the camera device was denied. Check system privacy options or upload picture manually.");
    }
  };

  // Canvas frame snapping grabber
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 320;
        canvas.height = 320;
        
        const videoWidth = video.videoWidth || 320;
        const videoHeight = video.videoHeight || 320;
        const size = Math.min(videoWidth, videoHeight);
        const sourceX = (videoWidth - size) / 2;
        const sourceY = (videoHeight - size) / 2;
        
        context.drawImage(video, sourceX, sourceY, size, size, 0, 0, 320, 320);
        
        try {
          const base64Data = canvas.toDataURL('image/jpeg', 0.85);
          onUpdateUser({
            ...currentUser,
            avatar: base64Data
          });
          
          onAddNotification({
            id: Math.random().toString(),
            userId: currentUser.id,
            text: `Profile workspace avatar captured and saved successfully over live stream feed.`,
            type: 'success',
            read: false,
            createdAt: new Date().toISOString()
          });
          
          stopCamera();
        } catch (e) {
          console.error("Failed to convert video frame context:", e);
          setCameraError("Canvas execution failed. Please select a local picture file.");
        }
      }
    }
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAvatarFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAvatarFile(file);
  };

  const processAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Invalid file type. Please select a valid profile image file (PNG/JPG/GIF).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Selected image is too large. Keep your profile upload below 2MB boundary limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      onUpdateUser({
        ...currentUser,
        avatar: base64Data
      });

      onAddNotification({
        id: Math.random().toString(),
        userId: currentUser.id,
        text: `Uploaded a custom avatar image to workspace active profile.`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString()
      });
    };
    reader.onerror = () => {
      alert("Error occurred while processing files. Please retry.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    onUpdateUser({
      ...currentUser,
      avatar: undefined
    });

    onAddNotification({
      id: Math.random().toString(),
      userId: currentUser.id,
      text: `Removed custom workspace profile avatar.`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    });
  };

  // Campaign Form state
  const [selectedCategory, setSelectedCategory] = useState<string>('instagram');
  const [selectedServiceId, setSelectedServiceId] = useState<number>(1);
  const [orderLink, setOrderLink] = useState<string>('');
  const [orderQty, setOrderQty] = useState<string>('1000');
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponFeedback, setCouponFeedback] = useState<string>('');

  // S Ticket creation state
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketCategory, setTicketCategory] = useState<string>('order');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState<string>('');

  // Share SMM Campaign QR Code States
  interface ShareState {
    id: number;
    link: string;
    serviceName: string;
    quantity: number;
    status: string;
  }
  const [sharingCampaign, setSharingCampaign] = useState<ShareState | null>(null);
  const [qrColor, setQrColor] = useState<string>('0f172a'); // default dark slate
  const [qrSize, setQrSize] = useState<number>(200);
  const [additionalNote, setAdditionalNote] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedQrLink, setCopiedQrLink] = useState(false);

  // Auto populate copy note template custom details
  useEffect(() => {
    if (sharingCampaign) {
      setAdditionalNote(
        `📌 CLIENT SMM DISPATCH CAMPAIGN #${sharingCampaign.id}\n` +
        `• Target Link: ${sharingCampaign.link}\n` +
        `• SMM Service: ${sharingCampaign.serviceName}\n` +
        `• Bulk Qty: ${sharingCampaign.quantity.toLocaleString()} units\n` +
        `• Order Status: ${sharingCampaign.status.toUpperCase()}\n` +
        `⚡ Real-time deliverability queue is fully active.`
      );
    }
  }, [sharingCampaign]);

  // Filtered services
  const filteredServices = SERVICES.filter(s => s.categoryId === selectedCategory);
  const activeService = SERVICES.find(s => s.id === selectedServiceId) || SERVICES[0];

  // Live order charge
  const baseQty = parseInt(orderQty) || 0;
  const rawCost = (activeService.ratePer1000 / 1000) * baseQty;
  const finalCost = rawCost * (1 - appliedDiscount);

  // Export campaign history to Excel/CSV format
  const handleExportToExcel = () => {
    const userOrders = orders.filter(o => o.userId === currentUser.id).reverse();
    if (userOrders.length === 0) {
      alert("No campaign history to export.");
      return;
    }

    // Define CSV headers
    const headers = ["Order ID", "SMM Service Name", "Service Category", "Target Link", "Quantity", "Paid Charge (USD)", "Status", "Created Date"];

    // Helper to escape values for CSV
    const escapeCsv = (val: string | number) => {
      const text = String(val === null || val === undefined ? "" : val);
      if (text.includes(",") || text.includes('"') || text.includes("\n") || text.includes("\r")) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    // Construct CSV content
    const csvRows = [
      headers.join(","),
      ...userOrders.map(order => [
        `#${order.id}`,
        order.serviceName,
        order.categoryName || "",
        order.link,
        order.quantity,
        order.charge.toFixed(4),
        order.status,
        new Date(order.createdAt).toISOString()
      ].map(escapeCsv).join(","))
    ];

    const csvContent = csvRows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SMM_Campaign_History_${currentUser.username}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Manage Coupons
  const handleApplyCoupon = () => {
    const codeNormalized = couponCode.toUpperCase().trim();
    if (codeNormalized === 'SMM20' || codeNormalized === 'KHQR20') {
      setAppliedDiscount(0.20);
      setCouponFeedback('Coupon applied: 20% discount activated!');
    } else if (codeNormalized === 'SMM10') {
      setAppliedDiscount(0.10);
      setCouponFeedback('Coupon applied: 10% discount activated!');
    } else if (codeNormalized === '') {
      setAppliedDiscount(0);
      setCouponFeedback('');
    } else {
      setAppliedDiscount(0);
      setCouponFeedback('Invalid coupon code entered');
    }
  };

  // Submit SMM Campaign Order
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderLink.startsWith('http://') && !orderLink.startsWith('https://')) {
      alert("Invalid campaign link. Please specify a fully verified URL path.");
      return;
    }

    if (baseQty < activeService.minOrder || baseQty > activeService.maxOrder) {
      alert(`Invalid quantity. Order limits are: min ${activeService.minOrder}, max ${activeService.maxOrder}.`);
      return;
    }

    if (currentUser.balance < finalCost) {
      alert("Insufficient account balance. Please navigate to 'Deposit Funds' first.");
      return;
    }

    // Deduct user balance
    const updated = {
      ...currentUser,
      balance: currentUser.balance - finalCost
    };
    onUpdateUser(updated);

    // Save order
    const nextOrderId = orders.length + 1;
    const newOrder: Order = {
      id: nextOrderId,
      userId: currentUser.id,
      username: currentUser.username,
      serviceId: activeService.id,
      serviceName: activeService.name,
      categoryName: CATEGORIES.find(c => c.id === activeService.categoryId)?.name || 'Engagement',
      link: orderLink,
      quantity: baseQty,
      charge: finalCost,
      startCounter: 0,
      remains: baseQty,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    onAddOrder(newOrder);

    // Add transaction ledger entry
    const newTxn: Transaction = {
      id: "SMM_CH_" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      userId: currentUser.id,
      username: currentUser.username,
      type: 'order_charge',
      amount: -finalCost,
      currency: 'USD',
      gateway: 'Account Wallet Balance',
      status: 'success',
      remarks: `Placed Order #${nextOrderId} - ${activeService.name}`,
      createdAt: new Date().toISOString()
    };
    onAddTransaction(newTxn);

    // Add notification
    const newNotif: Notification = {
      id: Math.random().toString(),
      userId: currentUser.id,
      text: `Successfully created Order #${nextOrderId}! Subtracted -$${finalCost.toFixed(4)} from balance.`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString()
    };
    onAddNotification(newNotif);

    // Alert
    alert(`Order Created successfully! SMM Campaign #${nextOrderId} placed into execution queue.`);
    
    // Reset inputs
    setOrderLink('');
    setCouponCode('');
    setAppliedDiscount(0);
    setCouponFeedback('');
  };

  // Submit Ticket Creation
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      alert("Please fill in the support topic subject and details message.");
      return;
    }

    const nextId = tickets.length + 1;
    const newTicket: Ticket = {
      id: nextId,
      userId: currentUser.id,
      username: currentUser.username,
      subject: ticketSubject.trim(),
      message: ticketMessage.trim(),
      category: ticketCategory,
      priority: ticketPriority,
      status: 'open',
      replies: [],
      createdAt: new Date().toISOString()
    };
    onAddTicket(newTicket);

    // Alert
    alert(`Support desk ticket #${nextId} created! Support engineers will review your inquiry shortly.`);
    setTicketSubject('');
    setTicketMessage('');

    // Trigger Automated Admin Reply Simulator (after 2 seconds)
    setTimeout(() => {
      const autoReply: TicketReply = {
        id: Math.random(),
        sender: 'support',
        message: `Hello ${currentUser.username}, thank you for reaching out to Cambodia SMM Pro support. We have received your query regarding your '${ticketCategory}' inquiry. Our financial and technical ops teams are looking into this, and we will update your ticket logs within the next 30 minutes. Let us know if there is anything else we can assist with in the meantime!`,
        createdAt: new Date().toISOString()
      };
      onReplyTicket(nextId, autoReply);

      // Log notification
      onAddNotification({
        id: Math.random().toString(),
        userId: currentUser.id,
        text: `Support Desk replied to ticket #${nextId}: "${ticketSubject.substring(0, 20)}..."`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString()
      });
    }, 2000);
  };

  // Reply message interaction
  const handleSubmitReply = (e: React.FormEvent, ticketId: number) => {
    e.preventDefault();
    if (!ticketReplyText.trim()) return;

    const userReply: TicketReply = {
      id: Math.random(),
      sender: 'user',
      message: ticketReplyText.trim(),
      createdAt: new Date().toISOString()
    };
    onReplyTicket(ticketId, userReply);
    setTicketReplyText('');

    // Simulated follow-up reply from support admin
    setTimeout(() => {
      const followUpReply: TicketReply = {
        id: Math.random(),
        sender: 'support',
        message: `Understood, thank you. Adding these details directly into your SMM engineering log queue. We will solve this shortly!`,
        createdAt: new Date().toISOString()
      };
      onReplyTicket(ticketId, followUpReply);
    }, 2000);
  };

  return (
    <div className="space-y-6" id="user-dashboard-root">
      
      {/* SMM User Stat Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Metric 1 */}
        <div className={`bg-[#0a0f1d] border p-5 rounded-2xl shadow-sm flex flex-col justify-between gap-3 transition-colors ${
          currentUser.balance < balanceThreshold ? 'border-red-500/50 bg-red-950/5' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between w-full">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Available SMM Balance</span>
              <span className={`text-2xl font-black font-mono select-all transition-colors ${
                currentUser.balance < balanceThreshold ? 'text-red-500 animate-pulse' : 'text-emerald-400'
              }`}>
                ${currentUser.balance.toFixed(4)}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                ~ ៛ {(currentUser.balance * 4100).toLocaleString()} KHR
              </span>
            </div>
            <div className={`p-3 rounded-xl w-11 h-11 flex items-center justify-center transition-colors ${
              currentUser.balance < balanceThreshold ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {currentUser.balance < balanceThreshold ? <AlertCircle className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[10px]">
            <span className="text-slate-400 font-medium font-sans">Alert Threshold (USD):</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-mono">$</span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={balanceThreshold}
                onChange={(e) => setBalanceThreshold(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center text-[10px] font-mono text-white focus:outline-none focus:border-red-550/50 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#0a0f1d] border border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">SMM Campaigns Run</span>
            <span className="text-2xl font-black text-blue-400 font-mono">
              {orders.filter(o => o.userId === currentUser.id).length}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Active queues synchronized
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-11 h-11 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0a0f1d] border border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Referrals Earnings</span>
            <span className="text-2xl font-black text-indigo-400 font-mono">
              ${currentUser.referralEarnings.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              Count: {currentUser.referralsCount} users referred
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-11 h-11 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Real-time Critically Low Balance Warning Banner */}
      {currentUser.balance < balanceThreshold && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl self-start sm:self-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-400 flex items-center gap-1.5 font-sans">
                Critically Low Balance Warning
              </p>
              <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                Your available balance (<strong className="text-red-450 font-mono">${currentUser.balance.toFixed(4)}</strong>) is below your set threshold of <strong className="text-slate-200 font-mono">${balanceThreshold.toFixed(2)}</strong>. Please top up funds to avoid SMM campaign disruption.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onNavigateTab) {
                onNavigateTab('checkout');
              } else {
                startTransition(() => { setActiveSubTab('deposits'); });
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl transition-all cursor-pointer border-none shadow-[0_4px_12px_rgba(239,68,68,0.2)] whitespace-nowrap"
          >
            <Landmark className="w-3.5 h-3.5" />
            Deposit via KHQR
          </button>
        </div>
      )}

      {/* Sub tabs nav bar */}
      <div className="border-b border-slate-800 flex flex-wrap gap-2 text-xs pb-px">
        {[
          { id: 'order', name: 'New SMM Campaign', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
          { id: 'history', name: 'Campaign History', icon: <History className="w-3.5 h-3.5" /> },
          { id: 'deposits', name: 'Ledger Deposits', icon: <Landmark className="w-3.5 h-3.5" /> },
          { id: 'tickets', name: 'Support Tickets Desk', icon: <MessageSquare className="w-3.5 h-3.5" /> },
          { id: 'referrals', name: 'Rewards / Affiliate Program', icon: <Award className="w-3.5 h-3.5" /> }
        ].map(sub => (
          <button
            key={sub.id}
            onClick={() => startTransition(() => { setActiveSubTab(sub.id as any); })}
            className={`px-4 py-2.5 rounded-t-xl flex items-center gap-2 font-medium transition-colors cursor-pointer ${
              activeSubTab === sub.id
                ? 'bg-slate-900 text-white border-t border-x border-slate-800 border-b-2 border-b-blue-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/10'
            }`}
          >
            {sub.icon}
            {sub.name}
          </button>
        ))}
      </div>

      {/* S Subtab displays */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Campaign Order placement OR Ticket detail list */}
        <div className="xl:col-span-8 space-y-5">
          
          {activeSubTab === 'order' && (
            <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6">
              <h3 className="font-semibold text-white text-sm mb-4">Place SMM Engagement Campaign</h3>
              
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                
                {/* Visual Category row widgets selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Campaign Social Channel
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {CATEGORIES.map(cat => {
                      const selected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            // Set first service matching this cat
                            const serviceMatched = SERVICES.find(s => s.categoryId === cat.id);
                            if (serviceMatched) setSelectedServiceId(serviceMatched.id);
                          }}
                          className={`px-3 py-2 border rounded-xl font-semibold text-center text-xs transition-colors cursor-pointer ${
                            selected
                              ? 'border-blue-500 bg-blue-600/10 text-blue-400'
                              : 'border-slate-800 text-slate-400 bg-slate-950/40 hover:bg-slate-800/20 hover:text-slate-200'
                          }`}
                        >
                          {cat.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Service Dropdowns */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Select Specific SMM Service
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer"
                  >
                    {filteredServices.map(s => (
                      <option key={s.id} value={s.id} className="bg-[#0a0f1d]">
                        [{s.id}] {s.name} — ${s.ratePer1000.toFixed(2)} / 1K units
                      </option>
                    ))}
                  </select>
                </div>

                {/* Core Campaign parameters description Box */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between font-mono text-[10px] text-slate-500">
                    <span>SMC Min Limit: <strong className="text-slate-300">{activeService.minOrder}</strong></span>
                    <span>SMC Max Limit: <strong className="text-slate-300">{activeService.maxOrder.toLocaleString()}</strong></span>
                    <span>API Service Ref: <strong className="text-slate-300">#{activeService.providerServiceId}</strong></span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{activeService.description}</p>
                </div>

                {/* Campaign Link Input */}
                <div>
                  <label htmlFor="order-link-field" className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Campaign Target URL (Post/Page/Group Link)
                  </label>
                  <input
                    id="order-link-field"
                    type="url"
                    required
                    value={orderLink}
                    onChange={(e) => setOrderLink(e.target.value)}
                    placeholder="https://instagram.com/myusername/p/Cxy8Z18xZ2/"
                    className="w-full px-3 py-2.5 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* Campaign quantity Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="order-qty-field" className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Campaign Volume (Units)
                    </label>
                    <input
                      id="order-qty-field"
                      type="number"
                      required
                      min={activeService.minOrder}
                      max={activeService.maxOrder}
                      value={orderQty}
                      onChange={(e) => setOrderQty(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  {/* Coupon System */}
                  <div>
                    <label htmlFor="coupon-code-field" className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Apply Promo Ticket (Try <span className="font-bold text-blue-400">SMM20</span>)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="coupon-code-field"
                        type="text"
                        placeholder="SUMMER24"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-700"
                      >
                        Apply
                      </button>
                    </div>
                    {couponFeedback && (
                      <span className={`text-[10px] block mt-1 font-semibold ${
                        appliedDiscount > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {couponFeedback}
                      </span>
                    )}
                  </div>
                </div>

                {/* Order final summary Charge box */}
                <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-4 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-400">Total Campaign Charge:</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-blue-400 font-mono">${finalCost.toFixed(4)}</span>
                      {appliedDiscount > 0 && (
                        <span className="text-xs font-mono text-slate-500 line-through">${rawCost.toFixed(4)}</span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all hover:shadow-[0_4px_12px_rgba(37,99,235,0.3)] flex items-center gap-1.5"
                  >
                    Place Campaign Order
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSubTab === 'history' && (
            <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="font-semibold text-white text-sm">SMM Campaigns Executing Queues</h3>
                <button
                  onClick={handleExportToExcel}
                  disabled={orders.filter(o => o.userId === currentUser.id).length === 0}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  Export to Excel
                </button>
              </div>
              
              <div className="overflow-x-auto select-all">
                <table className="w-full text-xs text-left text-slate-350 whitespace-nowrap">
                  <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950/60">
                    <tr className="border-b border-slate-800">
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Svc Category</th>
                      <th className="px-4 py-3">URL Link Connection</th>
                      <th className="px-4 py-3">Campaign Vol</th>
                      <th className="px-4 py-3">Paid Fee</th>
                      <th className="px-4 py-3">Status Sync</th>
                      <th className="px-4 py-3">Created Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {orders.filter(o => o.userId === currentUser.id).reverse().map(order => (
                      <tr key={order.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-blue-400">#{order.id}</td>
                        <td className="px-4 py-3 font-semibold text-slate-200">{order.serviceName.substring(0, 30)}...</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-400 max-w-[150px] truncate">{order.link}</td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-300">{order.quantity.toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-blue-400">${order.charge.toFixed(4)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase text-center border ${
                            order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            order.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            order.status === 'canceled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSharingCampaign({
                              id: order.id,
                              link: order.link,
                              serviceName: order.serviceName,
                              quantity: order.quantity,
                              status: order.status
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 hover:border-transparent text-[10px] font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                          >
                            <Share2 className="w-3 h-3" />
                            Share QR
                          </button>
                        </td>
                      </tr>
                    ))}

                    {orders.filter(o => o.userId === currentUser.id).length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">
                          No SMM campaigns run yet inside this active session.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'deposits' && (
            <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6">
              <h3 className="font-semibold text-white text-sm mb-4">Financial Ledger Deposits Logs</h3>
              
              <div className="overflow-x-auto select-all">
                <table className="w-full text-xs text-left text-slate-350 whitespace-nowrap animate-fade-in">
                  <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950/60">
                    <tr className="border-b border-slate-800">
                      <th className="px-4 py-3">Invoice ID</th>
                      <th className="px-4 py-3">Gateway Network</th>
                      <th className="px-4 py-3">Deposited USD</th>
                      <th className="px-4 py-3">Bank Reference</th>
                      <th className="px-4 py-3">Process Status</th>
                      <th className="px-4 py-3">Received Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {transactions.filter(t => t.userId === currentUser.id && t.type === 'deposit').reverse().map(txn => (
                      <tr key={txn.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-200">{txn.id}</td>
                        <td className="px-4 py-3 font-semibold text-blue-400">{txn.gateway}</td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-400">+${txn.amount.toFixed(4)}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{txn.referenceCode || 'WEB_PEND_API'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {txn.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">{new Date(txn.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}

                    {transactions.filter(t => t.userId === currentUser.id && t.type === 'deposit').length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          No KHQR billing statements recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'tickets' && (
            <div className="space-y-6">
              
              {/* Ticket list index */}
              {activeTicketId === null ? (
                <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <h3 className="font-semibold text-white text-sm">Active Support Operations</h3>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Help Desk system</span>
                  </div>

                  <div className="space-y-3">
                    {tickets.filter(t => t.userId === currentUser.id).reverse().map(ticket => (
                      <div
                        key={ticket.id}
                        onClick={() => startTransition(() => { setActiveTicketId(ticket.id); })}
                        className="p-4 rounded-xl border border-slate-800 hover:border-blue-500/25 hover:bg-slate-900/30 cursor-pointer transition-all flex justify-between items-center text-slate-250"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs">#{ticket.id} — {ticket.subject}</span>
                            <span className="text-[9px] font-semibold bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 uppercase">
                              {ticket.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 max-w-[500px] truncate">{ticket.message}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase text-center border ${
                            ticket.status === 'answered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            ticket.status === 'closed' ? 'bg-slate-900 text-slate-500 border border-slate-800' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse'
                          }`}>
                            {ticket.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    ))}

                    {tickets.filter(t => t.userId === currentUser.id).length === 0 && (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        No support tickets opened. Use configuration tool below.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Ticket Interactive Details expanding thread */
                (() => {
                  const tMatched = tickets.find(t => t.id === activeTicketId);
                  if (!tMatched) return null;

                  return (
                    <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 space-y-5 animate-fade-in">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <div>
                          <button
                            onClick={() => startTransition(() => { setActiveTicketId(null); })}
                            className="text-blue-400 text-xs font-semibold mb-1 hover:underline block cursor-pointer"
                          >
                            ← Back to active listings
                          </button>
                          <h4 className="font-bold text-white text-sm">
                            #{tMatched.id} — {tMatched.subject}
                          </h4>
                          <span className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-wider">
                            Topic category: {tMatched.category}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          tMatched.status === 'answered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#eab308]/10 text-amber-400 border-yellow-500/20'
                        }`}>
                          {tMatched.status}
                        </span>
                      </div>

                      {/* Chat messages box standard */}
                      <div className="space-y-4 max-h-[290px] overflow-y-auto p-4 bg-slate-950/60 rounded-xl border border-slate-800 scrollbar-thin scrollbar-thumb-slate-800">
                        {/* Initial User Message */}
                        <div className="flex flex-col items-start space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{tMatched.username} (Author)</span>
                          <div className="bg-slate-900 border border-slate-800 text-slate-200 p-3 rounded-2xl rounded-tl-none text-xs max-w-lg shadow-sm">
                            {tMatched.message}
                          </div>
                        </div>

                        {/* Thread Replies */}
                        {tMatched.replies.map((rep) => {
                          const isSupport = rep.sender === 'support';
                          return (
                            <div key={rep.id} className={`flex flex-col space-y-1 ${isSupport ? 'items-end' : 'items-start'}`}>
                              <span className="text-[10px] text-slate-500 font-bold uppercase">
                                {isSupport ? '🛡️ SMM Ops Engine' : `${tMatched.username}`}
                              </span>
                              <div className={`p-3 rounded-2xl text-xs max-w-lg shadow-sm border ${
                                isSupport
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-tr-none'
                                  : 'bg-slate-900 border-slate-800 text-slate-200 rounded-tl-none'
                              }`}>
                                {rep.message}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Write reply editor */}
                      <form onSubmit={(e) => handleSubmitReply(e, tMatched.id)} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write reply details here..."
                          value={ticketReplyText}
                          onChange={(e) => setTicketReplyText(e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                        >
                          Send reply
                        </button>
                      </form>
                    </div>
                  );
                })()
              )}

              {/* Opened tickets ticket creator form */}
              <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6">
                <h3 className="font-semibold text-white text-sm mb-4">Open Help Desk Support Ticket</h3>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="ticket-subject" className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Subject Title Topic
                      </label>
                      <input
                        id="ticket-subject"
                        type="text"
                        required
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="Delayed IG Orders completion / Double settlements"
                        className="w-full px-3 py-2 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="ticket-category" className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Topic Category
                      </label>
                      <select
                        id="ticket-category"
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                      >
                        <option value="order" className="bg-[#0a0f1d]">Order Inquiry</option>
                        <option value="payment" className="bg-[#0a0f1d]">Payment Issue</option>
                        <option value="api" className="bg-[#0a0f1d]">SMM REST API Integration</option>
                        <option value="other" className="bg-[#0a0f1d]">Other Generic Topic</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ticket-message" className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Detailed message description
                    </label>
                    <textarea
                      id="ticket-message"
                      rows={3}
                      required
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Input transaction hashes, order IDs, or description details..."
                      className="w-full px-3 py-2 border border-slate-800 rounded-xl text-xs text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(37,99,235,0.2)] border-none"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Ticket Request
                  </button>
                </form>
              </div>

            </div>
          )}

          {activeSubTab === 'referrals' && (
            <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 space-y-6">
              <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-white text-base">Make 10% Lifetime Affiliate Rewards</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Refer other digital agencies or media workers and receive an instant 10% credit from all of their KHQR deposit completions directly to your SMM balance wallet!
                </p>
              </div>

              {/* Referral dashboard metrics info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-slate-800 py-6">
                <div className="text-center space-y-1">
                  <span className="text-slate-400 text-xs font-semibold uppercase block">Total Signups Referred</span>
                  <span className="text-2xl font-black text-white block font-mono">{currentUser.referralsCount}</span>
                </div>
                <div className="text-center space-y-1">
                  <span className="text-slate-400 text-xs font-semibold uppercase block">Affiliate Wallet Earned</span>
                  <span className="text-2xl font-black text-emerald-400 block font-mono">${currentUser.referralEarnings.toFixed(2)}</span>
                </div>
              </div>

              {/* Affiliate copy links */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Your Developer Affiliate SMM URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://your-smm-domain.com/register?ref=SMM_${currentUser.username.toUpperCase()}`}
                    className="flex-1 px-4 py-2 border border-slate-800 rounded-xl text-xs text-slate-400 bg-slate-950 font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://your-smm-domain.com/register?ref=SMM_${currentUser.username.toUpperCase()}`);
                      alert("Referral link copied!");
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* System activity logs & Notifications Center (Right side panel) */}
        <div className="xl:col-span-4 space-y-5">
          
          {/* Active Profile Avatar & Camera Controller */}
          <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-blue-500" />
                SMM Workspace Account Profile
              </h4>
              <span className="text-[10px] uppercase font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold">
                {currentUser.role.toUpperCase()}
              </span>
            </div>

            {/* Profile Avatar Center View */}
            <div className="flex flex-col items-center py-2 space-y-3">
              <div className="relative group">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={`${currentUser.username} profile`}
                    className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black font-sans border-2 border-slate-700 shadow-[0_0_15px_rgba(59,130,246,0.15)] select-none">
                    {currentUser.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
                
                {currentUser.avatar && (
                  <button
                    onClick={handleRemoveAvatar}
                    title="Remove Profile Picture"
                    className="absolute -bottom-1 -right-1 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full transition-transform cursor-pointer border border-slate-900 group-hover:scale-110 shadow-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-center">
                <h5 className="text-white font-bold text-sm tracking-tight">{currentUser.username}</h5>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{currentUser.email}</p>
              </div>
            </div>

            {/* Drag and Drop Upload / Camera Area */}
            {!isCameraOpen ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                  dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <p className="text-[10px] text-slate-300 font-medium font-sans">
                    Drag profile photo here or
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
                    <label 
                      htmlFor="avatar-file-input"
                      className="flex-1 py-1.5 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-lg text-[10px] font-semibold cursor-pointer transition-colors text-center font-sans"
                    >
                      Browse File
                    </label>
                    <input 
                      type="file" 
                      id="avatar-file-input" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden" 
                    />

                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex-1 py-1.5 px-2 bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                    >
                      <Camera className="w-3 h-3" />
                      Take Photo
                    </button>
                  </div>
                  
                  <p className="text-[8px] text-slate-500 font-mono">
                    PNG, JPG or GIF up to 2MB Max
                  </p>
                </div>
              </div>
            ) : (
              // Webcam stream preview and click section
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-3">
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black max-w-[240px] mx-auto border border-slate-800">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover transform -scale-x-100" 
                  />
                  {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-center p-3">
                      <p className="text-[10px] text-red-400 leading-normal font-sans font-medium">
                        {cameraError}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!!cameraError}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Snap Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer font-sans"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
            
            {/* Native hidden canvas needed to convert stream tracks into high resolution frame snaps */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* KHQR Auto-Deposit Trigger & Prefill Automation */}
          <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-emerald-400" />
                KHQR Auto-Deposit Automation
              </h4>
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                currentUser.autoDepositEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500'
              }`}>
                {currentUser.autoDepositEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Preloads the KHQR deposit checkout form automatically with custom limits when your SMM wallet balance drops below the threshold.
            </p>

            <div className="space-y-3.5 pt-1">
              {/* Toggle switch */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-350 font-medium font-sans">Enable Low-Balance Auto-Trigger:</span>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateUser({
                      ...currentUser,
                      autoDepositEnabled: !currentUser.autoDepositEnabled
                    });
                    
                    onAddNotification({
                      id: Math.random().toString(),
                      userId: currentUser.id,
                      text: `Auto-deposit trigger has been ${!currentUser.autoDepositEnabled ? 'enabled' : 'disabled'}!`,
                      type: 'info',
                      read: false,
                      createdAt: new Date().toISOString()
                    });
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    currentUser.autoDepositEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      currentUser.autoDepositEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Threshold control */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-350 font-medium font-sans">Low-Balance Trigger (USD):</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-mono text-xs">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={currentUser.autoDepositThreshold !== undefined ? currentUser.autoDepositThreshold : 5.0}
                    onChange={(e) => {
                      const val = Math.max(1, parseFloat(e.target.value) || 0);
                      onUpdateUser({
                        ...currentUser,
                        autoDepositThreshold: val
                      });
                    }}
                    className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                  />
                </div>
              </div>

              {/* Prefill Amount control */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-350 font-medium font-sans">Pre-fill Deposit Amount (USD):</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-mono text-xs">$</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={currentUser.autoDepositAmount !== undefined ? currentUser.autoDepositAmount : 15.0}
                    onChange={(e) => {
                      const val = Math.max(1, parseFloat(e.target.value) || 0);
                      onUpdateUser({
                        ...currentUser,
                        autoDepositAmount: val
                      });
                    }}
                    className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                  />
                </div>
              </div>

              {/* Sandbox Simulator Tip */}
              <div className="bg-[#181105] border border-amber-500/10 rounded-xl p-3 text-[10px] leading-relaxed text-slate-400">
                <span className="text-amber-400 font-semibold block mb-1">💡 Sandbox Simulator Tip</span>
                Place a high volume order or edit the Low-Balance Trigger above your current wallet balance (<strong className="text-white">${currentUser.balance.toFixed(2)}</strong>) to immediately fire a low balance warning and pre-fill the checkout!
              </div>
            </div>
          </div>

          <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-blue-500 animate-bounce" />
                Alert Notifications ({notifications.filter(n => !n.read).length})
              </h4>
              <button
                onClick={onClearNotifications}
                className="text-slate-500 hover:text-rose-400 text-[10px] uppercase font-bold tracking-wider hover:underline cursor-pointer"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-2.5 max-h-[190px] overflow-y-auto">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border text-[11px] leading-relaxed relative overflow-hidden transition-all ${
                    notif.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    notif.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-slate-900 border-slate-800 text-slate-350'
                  }`}
                >
                  <span className="block pr-4 font-semibold">{notif.text}</span>
                  <span className="text-[9px] font-mono text-slate-500 block mt-1.5">
                    {new Date(notif.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-[11px] flex flex-col items-center justify-center">
                  <BellOff className="w-6 h-6 shrink-0 opacity-40 mb-1.5" />
                  No new operational notifications.
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0a0f1d] text-slate-300 rounded-2xl p-5 space-y-3.5 border border-slate-800 shadow-xl">
            <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-emerald-400" />
              Cambodia Settlement Rates
            </h4>
            <div className="space-y-2 text-[10px] leading-relaxed text-slate-400 divide-y divide-slate-800">
              <div className="flex justify-between py-1.5 border-none">
                <span>Core USD Bank ledger:</span>
                <span className="font-mono text-slate-200">1.00 USD</span>
              </div>
              <div className="flex justify-between py-1.5 border-slate-800">
                <span>Exchange settlement:</span>
                <span className="font-mono text-slate-200">1 USD = 4,100 KHR</span>
              </div>
              <div className="flex justify-between py-1.5 border-slate-800">
                <span>Webhook Push delay:</span>
                <span className="font-mono text-emerald-400 font-bold">&lt; 3 Seconds</span>
              </div>
            </div>
            <div className="bg-[#020617] p-2.5 border border-slate-850 rounded-lg text-[9px] text-slate-500 font-mono leading-normal">
              Acquirers: ABA Bank, ACLEDA Bank, Bakong Core, Wing Cambodia, TrueMoney Corp.
            </div>
          </div>

        </div>

      </div>

      {/* Dynamic SMM QR Code Campaign Share Modal Backdrop */}
      {sharingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" id="share-campaign-modal">
          <div className="bg-[#0b1329] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800">
            
            {/* Left Box: QR Image Generator View */}
            <div className="p-6 flex flex-col items-center justify-between space-y-4 bg-[#0a0f1d] md:w-[45%] text-center">
              <div className="w-full flex justify-between items-center md:hidden">
                <h3 className="text-white text-xs font-bold uppercase tracking-wide font-sans">Share Campaign Link</h3>
                <button 
                  type="button"
                  onClick={() => setSharingCampaign(null)}
                  className="p-1 px-1.5 bg-slate-850 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full font-bold uppercase">
                  Order #{sharingCampaign.id} QR
                </span>
                <p className="text-slate-405 text-[11px] leading-relaxed">
                  Scan to preview target Post or Profile instantly
                </p>
              </div>

              {/* Dynamic Image QR Code powered by free qrserver API without keys */}
              <div className="p-3 bg-white rounded-xl shadow-md flex items-center justify-center border border-slate-200 aspect-square w-48 h-48 relative group">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(sharingCampaign.link)}&color=${qrColor}&bgcolor=ffffff`}
                  alt="SMM Campaign QR Code" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Real-time QR Color customizations picker */}
              <div className="space-y-1.5 w-full">
                <label className="block text-[10px] text-slate-400 font-semibold font-sans">
                  Configure QR Color theme:
                </label>
                <div className="flex gap-1.5 justify-center">
                  {[
                    { id: '0f172a', name: 'Dark Slate', bg: 'bg-slate-900 border-slate-700' },
                    { id: '1d4ed8', name: 'Ocean Blue', bg: 'bg-blue-600 border-blue-400' },
                    { id: '047857', name: 'Forest Emerald', bg: 'bg-emerald-600 border-emerald-400' },
                    { id: '701a75', name: 'Royal Purple', bg: 'bg-purple-600 border-purple-400' },
                    { id: 'be123c', name: 'Cherry Red', bg: 'bg-rose-600 border-rose-400' },
                  ].map(colorOpt => (
                    <button
                      key={colorOpt.id}
                      type="button"
                      onClick={() => setQrColor(colorOpt.id)}
                      title={colorOpt.name}
                      className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer hover:scale-110 ${colorOpt.bg} ${
                        qrColor === colorOpt.id ? 'scale-110 ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0a0f1d]' : 'ring-0'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Action buttons inside Left Section */}
              <div className="w-full flex gap-2">
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(sharingCampaign.link)}&color=${qrColor}&bgcolor=ffffff`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 text-center text-slate-350 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-705 rounded-lg text-[10px] font-semibold transition-colors flex items-center justify-center gap-1.5 font-sans"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Original
                </a>
              </div>
            </div>

            {/* Right Box: Sharing channels and copy actions */}
            <div className="p-6 md:w-[55%] flex flex-col justify-between space-y-4">
              <div className="hidden md:flex justify-between items-center">
                <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <QrCode className="w-4 h-4 text-blue-400" />
                  SMM CAMPAIGN SHARING CENTER
                </h3>
                <button 
                  type="button"
                  onClick={() => setSharingCampaign(null)}
                  className="p-1 px-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer border border-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Core summary specs text fields */}
              <div className="space-y-3.5 text-left">
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1 font-sans">Target Link Connection:</span>
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      readOnly 
                      value={sharingCampaign.link}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 font-mono select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(sharingCampaign.link);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      title="Copy URL Link Connection"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase font-sans">Dynamic Copywriter Handover Notes:</span>
                    {copiedNote && (
                      <span className="text-[9px] text-emerald-400 font-bold font-sans animate-pulse">Copied!</span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-blue-500/50 resize-none font-medium leading-normal"
                    placeholder="Specify target specifications for influencers/agency contacts..."
                  />
                  <div className="mt-1 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(additionalNote);
                        setCopiedNote(true);
                        setTimeout(() => setCopiedNote(false), 2000);
                      }}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md border-none font-sans"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Complete Note & Target Specifications
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1 font-sans">Direct Custom QR Image Endpoint URL:</span>
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      readOnly 
                      value={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(sharingCampaign.link)}&color=${qrColor}&bgcolor=ffffff`}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] text-slate-500 font-mono select-all focus:outline-none truncate"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(sharingCampaign.link)}&color=${qrColor}&bgcolor=ffffff`);
                        setCopiedQrLink(true);
                        setTimeout(() => setCopiedQrLink(false), 2000);
                      }}
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      title="Copy QR API Connection URL"
                    >
                      {copiedQrLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Close footer help label */}
              <div className="pt-2 border-t border-slate-800/70 text-[9px] text-slate-500 text-center md:text-left font-mono">
                💡 Useful for pasting in Slack, Telegram, WhatsApp or emailing to influencers to kickstart video reviews or content posts.
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
