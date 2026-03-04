'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Mic, X, Loader2, Volume2, MessageCircle, Phone, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Skype-style Web Voice Assistant Widget
 */
export function VoiceAssistantWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [errorStatus, setErrorStatus] = useState<string | null>(null);
    const [micLevel, setMicLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number | null>(null);

    // Initialize Audio for playback
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.onended = () => setIsPlaying(false);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    const startRecording = async () => {
        try {
            setErrorStatus(null);
            setMicLevel(0);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup Visualizer
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 256;
            source.connect(analyzer);
            analyzerRef.current = analyzer;

            const updateStats = () => {
                const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                analyzer.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                setMicLevel(average);
                animFrameRef.current = requestAnimationFrame(updateStats);
            };
            updateStats();

            // Select the best supported mime type
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/ogg;codecs=opus';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                setIsRecording(false);
                setIsProcessing(true);
                sendToBackend();
                // Stop all tracks to release mic
                stream.getTracks().forEach(track => track.stop());
                audioContext.close();
            };

            // Start with a small timeslice for safety
            mediaRecorder.start(100);
            setIsRecording(true);
            setTranscription('');
            setAiResponse('');
        } catch (err: any) {
            console.error('Error starting mic:', err);
            setErrorStatus('Microphone Access Denied');
            setIsRecording(false);
            setIsProcessing(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const sendToBackend = async () => {
        // Combine chunks with the recorder's mime type
        const recordedType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedType });

        console.log(`[Voice] Finished recording: ${audioBlob.size} bytes. Type: ${recordedType}`);

        if (audioBlob.size < 500) {
            setErrorStatus('Audio too short. Hold and speak.');
            setIsProcessing(false);
            return;
        }

        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
            const res = await fetch('/api/voice/assistant', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Server Error' }));
                throw new Error(errData.error || 'Failed to process voice');
            }

            const userText = decodeURIComponent(res.headers.get('X-User-Text') || '');
            const aiText = decodeURIComponent(res.headers.get('X-AI-Text') || '');
            setTranscription(userText);
            setAiResponse(aiText);

            // Play the response audio
            const audioData = await res.blob();
            const audioUrl = URL.createObjectURL(audioData);
            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.load();

                // Browsers require a promise catch for programmatic play
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                }).catch(err => {
                    console.error("Playback blocked or failed:", err);
                    setErrorStatus('Audio Playback Blocked');
                });
            }
        } catch (err: any) {
            console.error('Processing error:', err);
            setErrorStatus(err.message || 'AI Error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.85, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 30, scale: 0.85, filter: 'blur(10px)' }}
                        className="mb-6 w-[340px] bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        {/* Skype-style Top Bar */}
                        <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#00AFF0] animate-pulse" />
                                <span className="text-sm font-semibold text-white tracking-tight">Nova Voice Call</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                                >
                                    <Minimize2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Calling Interface */}
                        <div className="p-8 flex flex-col items-center justify-center min-h-[260px]">
                            <div className="relative mb-10">
                                {/* Skype Ripple Rings */}
                                {(isRecording || isPlaying || isProcessing) && (
                                    <>
                                        {[1, 2, 3].map((i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ scale: 0.8, opacity: 0.5 }}
                                                animate={{ scale: 2.2, opacity: 0 }}
                                                transition={{
                                                    duration: 2.5,
                                                    repeat: Infinity,
                                                    delay: i * 0.6,
                                                    ease: "easeOut"
                                                }}
                                                className="absolute inset-0 rounded-full border-2 border-[#00AFF0]"
                                            />
                                        ))}
                                    </>
                                )}

                                {/* Central Avatar/Control */}
                                <div className="relative z-10">
                                    <motion.button
                                        onMouseDown={startRecording}
                                        onMouseUp={stopRecording}
                                        onTouchStart={startRecording}
                                        onTouchEnd={stopRecording}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        animate={isRecording ? { scale: 1 + (micLevel / 100) } : {}}
                                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${isRecording
                                                ? 'bg-red-500 shadow-red-500/30'
                                                : isProcessing
                                                    ? 'bg-[#00AFF0]'
                                                    : 'bg-[#00AFF0] shadow-[#00AFF0]/30'
                                            }`}
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                                        ) : isRecording ? (
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3].map(i => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ height: [12, 28, 12] }}
                                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                                        className="w-1.5 bg-white rounded-full"
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <Mic className="w-10 h-10 text-white" />
                                        )}
                                    </motion.button>
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-white">
                                    {isRecording ? 'Listening...' : isProcessing ? 'Connecting...' : isPlaying ? 'Nova Speaking' : 'Nova Assistant'}
                                </h3>
                                {errorStatus ? (
                                    <p className="text-xs text-red-400 font-bold uppercase animate-pulse">
                                        {errorStatus}
                                    </p>
                                ) : (
                                    <p className="text-sm text-white/40 font-medium">
                                        {isRecording ? 'Release to end' : 'Hold to talk'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Message Transcription (Dark style) */}
                        <AnimatePresence>
                            {(transcription || aiResponse) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="px-6 pb-8 border-t border-white/5 bg-black/20"
                                >
                                    <div className="pt-6 space-y-4">
                                        {transcription && (
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">You</span>
                                                <p className="text-sm text-white/80 leading-relaxed font-medium transition-all">
                                                    {transcription}
                                                </p>
                                            </div>
                                        )}
                                        {aiResponse && (
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="text-[10px] font-bold text-[#00AFF0] uppercase tracking-wider font-sans">Nova</span>
                                                <p className="text-sm text-[#00AFF0] leading-relaxed font-semibold">
                                                    {aiResponse}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Trigger Button (Skype Orb) */}
            <motion.button
                layoutId="skype-orb"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full shadow-[0_8px_32px_-8px_rgba(0,175,240,0.5)] flex items-center justify-center relative border-4 border-background transition-colors duration-500 overflow-hidden ${isOpen ? 'bg-[#ff3b30]' : 'bg-[#00AFF0]'
                    }`}
            >
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />

                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            exit={{ rotate: 90, scale: 0 }}
                        >
                            <PhoneOff className="w-7 h-7 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            exit={{ rotate: -90, scale: 0 }}
                            className="relative"
                        >
                            <Phone className="w-7 h-7 text-white fill-current" />
                            {/* Unread indicator */}
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-[#00AFF0] rounded-full" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
