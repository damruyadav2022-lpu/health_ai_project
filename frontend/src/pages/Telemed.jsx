import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, Activity, 
  Brain, Shield, Scan, Target, Fingerprint, Waves, Wifi,
  PhoneCall, StopCircle, ClipboardList, Copy, Key, User, Lock, Phone
} from 'lucide-react';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Peer } from 'peerjs';
import api from '../api/client';

export default function Telemed() {
  const [stream, setStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [callStatus, setCallStatus] = useState('offline'); // offline, connecting, active
  const [isListening, setIsListening] = useState(false);
  const [captions, setCaptions] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [vitalSim, setVitalSim] = useState({ hr: 75, temp: 98.6, spo2: 99 });
  const notesEndRef = useRef(null);

  // WebRTC & AI State
  const [peerId, setPeerId] = useState('');
  const [myPhone, setMyPhone] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
  const [peerInstance, setPeerInstance] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState({ 
    risk: 'PENDING', 
    pain: 'MONITORING', 
    mood: 'STABLE',
    symptoms: [],
    recentNotes: [] 
  });
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const recognitionRef = useRef(null);
  const ringtoneRef = useRef(null);

  // 1. WhatsApp-style Auto-Registration & Media Initialization
  useEffect(() => {
    let peer;
    const initApp = async () => {
      let mySavedNum = sessionStorage.getItem('clinical_phone');
      if (!mySavedNum) {
        mySavedNum = Math.floor(1000 + Math.random() * 9000).toString();
        sessionStorage.setItem('clinical_phone', mySavedNum);
      }
      setMyPhone(mySavedNum);

      // Global STUN/TURN Array for Enterprise Connectivity
      peer = new Peer(mySavedNum, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' }
          ],
          iceCandidatePoolSize: 10
        }
      });

      peer.on('open', (id) => {
        setPeerId(id);
        setIsRegistered(true);
        setPeerInstance(peer);
      });

      peer.on('call', (call) => setIncomingCall(call));
      
      peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
           const newNum = Math.floor(1000 + Math.random() * 9000).toString();
           sessionStorage.setItem('clinical_phone', newNum);
           window.location.reload();
        }
      });

      try {
        const str = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(str);
        if (videoRef.current) videoRef.current.srcObject = str;
      } catch (err) {
        toast.error('Clinical handshake requires Camera/Mic.');
      }
    };
    
    initApp();

    return () => {
      if (peer) peer.destroy();
    };
  }, []);

  const playRingtone = (isOutbound = false) => {
    const url = isOutbound 
      ? 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' 
      : 'https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3';
    
    if (ringtoneRef.current) ringtoneRef.current.pause();
    ringtoneRef.current = new Audio(url);
    ringtoneRef.current.loop = true;
    ringtoneRef.current.play().catch(e => console.log("Audio block."));
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current = null;
    }
  };

  useEffect(() => {
     if (incomingCall) {
        playRingtone(false);
        if (Notification.permission === 'granted') {
           new Notification('Neural Link Request', { body: `Protocol invitation from Node #${incomingCall.peer}` });
        } else {
           Notification.requestPermission();
        }
     }
  }, [incomingCall]);

  const acceptCall = () => {
    if (!incomingCall) return;
    stopRingtone();
    incomingCall.answer(stream);
    incomingCall.on('stream', (userVideoStream) => {
      setRemoteStream(userVideoStream);
      setCallStatus('active');
      setIncomingCall(null);
    });
  };

  const declineCall = () => {
    stopRingtone();
    incomingCall?.close();
    setIncomingCall(null);
  };

  const startCall = () => {
    if (!remotePeerIdValue.trim()) { toast.error('Specify Target Node ID.'); return; }
    if (!peerInstance || !stream) { toast.error('Neural Core warming up...'); return; }
    
    setCallStatus('connecting');
    playRingtone(true);
    const call = peerInstance.call(remotePeerIdValue.trim(), stream);
    
    call.on('stream', (userVideoStream) => {
      stopRingtone();
      setRemoteStream(userVideoStream);
      setCallStatus('active');
      toast.success('Neural Tunnel Established.', { icon: '🔗' });
    });
    
    call.on('error', () => {
      stopRingtone();
      setCallStatus('offline');
      toast.error('Target Node not reachable in this sector.');
    });
  };

  const endCall = () => {
    stopRingtone();
    if (callStatus === 'active') {
       peerInstance?.destroy(); 
       window.location.reload(); 
    }
    setCallStatus('offline');
    setRemoteStream(null);
  };

  useEffect(() => {
    const vitalInterval = setInterval(() => {
      if (callStatus === 'active') {
        setVitalSim(prev => ({
          hr: 72 + Math.floor(Math.random() * 8),
          temp: 98.6 + (Math.random() * 0.4),
          spo2: 99
        }));
      }
    }, 2000);
    return () => clearInterval(vitalInterval);
  }, [callStatus]);

  useEffect(() => {
    if (callStatus === 'active' && !isListening) {
      startDictation();
    } else if (callStatus !== 'active' && isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [callStatus]);

  const startDictation = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          const text = e.results[i][0].transcript;
          setCaptions(text);
          setTranscript(prev => [...prev.slice(-4), text]);
          runLiveAiAnalysis(text);
          notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
          setCaptions(e.results[i][0].transcript);
        }
      }
    };
    rec.onend = () => { if (callStatus === 'active') try { rec.start(); } catch(e){} };
    recognitionRef.current = rec;
    try { rec.start(); setIsListening(true); } catch(e) {}
  };

  const runLiveAiAnalysis = async (text) => {
    try {
      const res = await api.post('/chat/extract-soap', { message: text, speaker: 'Patient' });
      if (res.data && res.data.analytics) {
         setAiAnalysis(prev => ({
            ...prev,
            risk: res.data.analytics.risk_level || 'Safe',
            mood: res.data.analytics.sentiment || 'Stable',
            symptoms: [...new Set([...prev.symptoms, ...Object.keys(res.data.analytics.symptom_confidence || {})])]
         }));
      }
    } catch (e) {}
  };

  return (
    <Layout title="DR. AI | Virtual Consult">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-100px)] p-6 space-y-6 flex flex-col">
        
        {/* DR. AI BRANDED HEADER */}
        <div className="glass-clinical rounded-3xl p-5 border border-white/10 bg-black/40 flex items-center justify-between shadow-[0_0_50px_rgba(34,211,238,0.1)] relative z-10 shrink-0">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                 <Shield className="text-cyan-400 animate-pulse" size={24} />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-1">DR. AI VIRTUAL CONSULT</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${callStatus === 'active' ? 'bg-cyan-500 animate-pulse' : 'bg-cyan-500/30'}`} />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{callStatus === 'active' ? 'Neural Link Active' : 'Secure Clinical Node'}</p>
                </div>
              </div>
           </div>
           
           <div className="flex gap-6 items-center">
              {callStatus === 'offline' ? (
                <div className="flex items-center gap-6 animate-in fade-in zoom-in-95">
                    <div className="flex flex-col items-center bg-indigo-500/5 border border-indigo-500/20 rounded-2xl px-5 py-2">
                       <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-0.5 flex items-center gap-1.5">
                          <Brain size={10} /> My Node ID
                       </span>
                       <span className="text-xl font-mono font-black text-white tracking-widest">{myPhone}</span>
                    </div>

                    <div className="flex items-center gap-3">
                       <div className="relative flex items-center bg-black/40 border border-white/10 rounded-full px-5 h-14 w-80 group focus-within:border-cyan-500/50 transition-all shadow-inner">
                          <Target size={18} className="text-cyan-400 mr-3" />
                          <input 
                            type="text" 
                            placeholder="Enter Target Node ID..." 
                            value={remotePeerIdValue}
                            onChange={e => setRemotePeerIdValue(e.target.value)}
                            className="bg-transparent text-lg font-mono text-white placeholder-slate-700 focus:outline-none flex-1 tracking-widest"
                          />
                       </div>
                       <button onClick={startCall} className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all active:scale-90 group"><Wifi size={24} className="group-hover:animate-ping" /></button>
                    </div>
                </div>
              ) : (
                <button onClick={endCall} className="w-14 h-14 rounded-full bg-red-600/20 border border-red-500/50 hover:bg-red-600 text-red-500 hover:text-white flex items-center justify-center shadow-xl transition-all active:scale-95"><PhoneOff size={22}/></button>
              )}
           </div>
        </div>

        {/* DR. AI VIDEO GRID AREA */}
        <div className="flex-1 relative rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#030509] shadow-inner flex items-center justify-center isolate">
           
           {/* SYMPHONY CALL OVERLAY */}
           <AnimatePresence>
             {incomingCall && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-[#030509] flex flex-col items-center justify-between py-24">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)]" />
                  <div className="text-center relative z-10">
                    <div className="w-32 h-32 rounded-full bg-indigo-500/10 border-2 border-cyan-500/50 mb-6 mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.2)]"><Brain size={64} className="text-cyan-400 animate-pulse" /></div>
                    <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-[0.3em]">Protocol Invitation</h2>
                    <p className="text-xl text-cyan-400 font-mono tracking-[0.5em]">NODE ID: {incomingCall.peer}</p>
                  </div>
                  <div className="flex gap-16 relative z-10">
                     <button onClick={declineCall} className="w-20 h-20 rounded-full bg-red-600/20 border border-red-600/50 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-2xl"><PhoneOff size={32}/></button>
                     <button onClick={acceptCall} className="w-20 h-20 rounded-full bg-cyan-600/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 hover:bg-cyan-600 hover:text-white transition-all shadow-[0_0_50px_rgba(34,211,238,0.3)] animate-pulse"><Video size={32}/></button>
                  </div>
                  <div className="relative z-10 flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]"><Shield size={12} /> Neural Secure Protocol Active</div>
               </motion.div>
             )}
           </AnimatePresence>

           <video ref={videoRef} autoPlay playsInline muted className={`transition-all duration-1000 object-cover ${remoteStream ? 'absolute bottom-8 right-8 w-48 h-64 rounded-2xl border-2 border-cyan-500/30 z-30 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'absolute inset-0 w-full h-full'}`} />
           <video autoPlay playsInline ref={(ref) => { if (ref && remoteStream) ref.srcObject = remoteStream; }} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${remoteStream ? 'opacity-100' : 'opacity-0'}`} />

           {/* SYMPHONY HUD ANALYTICS */}
           {callStatus === 'active' && (
             <>
               <div className="absolute top-8 left-8 z-20 space-y-4">
                  <div className="p-4 bg-black/40 backdrop-blur-md border border-indigo-500/30 rounded-2xl text-center">
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Pulse Sync</p>
                     <p className="text-3xl font-black text-white font-mono">{vitalSim.hr}</p>
                  </div>
                  <div className="p-4 bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-2xl text-center">
                     <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Neural Risk</p>
                     <p className="text-lg font-black text-white">{aiAnalysis.risk}</p>
                  </div>
               </div>

               <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 w-80 space-y-4">
                  <div className="p-5 bg-black/60 backdrop-blur-md border border-indigo-500/20 rounded-3xl h-64 flex flex-col">
                     <div className="flex items-center gap-2 text-indigo-400 border-b border-white/5 pb-3 mb-3">
                        <ClipboardList size={14}/> <span className="text-[10px] font-black uppercase text-white">Live Neural Scribe</span>
                     </div>
                     <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                        {transcript.map((t, i) => <p key={i} className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl leading-relaxed">"{t}"</p>)}
                        <div ref={notesEndRef} />
                     </div>
                  </div>
               </div>

               <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4 text-center">
                  {captions && <p className="px-6 py-4 rounded-3xl bg-black/80 text-white text-lg font-bold shadow-2xl border border-white/10 backdrop-blur-xl">"{captions}"</p>}
               </div>
             </>
           )}

           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-black/60 backdrop-blur-xl p-3 rounded-3xl border border-white/10">
              <button onClick={() => setIsMicOn(!isMicOn)} className={`w-12 h-12 flex items-center justify-center rounded-2xl ${isMicOn ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}><Mic size={18}/></button>
              <button onClick={() => setIsVideoOn(!isVideoOn)} className={`w-12 h-12 flex items-center justify-center rounded-2xl ${isVideoOn ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}><Video size={18}/></button>
              <button onClick={() => { navigator.clipboard.writeText(myPhone); toast.success('Node ID Copied'); }} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 transition-all hover:bg-cyan-600/40"><Copy size={16}/></button>
           </div>
        </div>
      </div>
    </Layout>
  );
}
