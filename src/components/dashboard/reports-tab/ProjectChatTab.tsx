'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Send, Paperclip, Loader2, FileText, User, 
    ImageIcon, Film, Archive, FileSpreadsheet, X 
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getProjectMessages, sendProjectMessage, type ChatMessage } from '@/app/actions/chat';

type Props = {
    projectId: string;
};

export default function ProjectChatTab({ projectId }: Props) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    
    // File handling
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const fetchMessages = useCallback(async () => {
        const data = await getProjectMessages(projectId);
        setMessages(data);
        setIsLoading(false);
        scrollToBottom();
    }, [projectId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        }
        getUser();
        fetchMessages();

        // Real-time subscription
        const channel = supabase
            .channel('project_messages_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'project_messages',
                    filter: `project_id=eq.${projectId}`
                },
                (payload) => {
                    // Re-fetch to get uploader names and document details
                    fetchMessages();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId, fetchMessages]);

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if ((!content.trim() && !selectedFile) || isSending) return;

        setIsSending(true);
        let fileData = undefined;

        if (selectedFile) {
            setIsUploading(true);
            try {
                // 1. Get company ID (shorthand logic)
                const { data: staff } = await supabase.from('staffs').select('company_id').eq('user_id', currentUser?.id).single();
                const { data: company } = await supabase.from('companies').select('id').eq('owner_id', currentUser?.id).single();
                const companyId = company?.id || staff?.company_id;

                if (!companyId) throw new Error('Company not found');

                // 2. Upload to storage
                const timestamp = Date.now();
                const storagePath = `${companyId}/${projectId}/${timestamp}_${selectedFile.name}`;
                const { error: uploadError } = await supabase.storage.from('project-documents').upload(storagePath, selectedFile);
                if (uploadError) throw uploadError;

                fileData = {
                    fileName: selectedFile.name,
                    fileUrl: storagePath,
                    fileType: selectedFile.type,
                    fileSize: selectedFile.size
                };
            } catch (err) {
                console.error('File upload failed:', err);
                alert('File upload failed. Sending message without attachment.');
            } finally {
                setIsUploading(false);
            }
        }

        const res = await sendProjectMessage({
            projectId,
            content: content.trim() || (selectedFile ? `Shared a file: ${selectedFile.name}` : ''),
            file: fileData
        });

        if (res.error) {
            alert(res.error);
        } else {
            setContent('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
        setIsSending(false);
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] gap-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-sm font-medium text-gray-500">Loading conversation...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[70vh] min-h-[500px] bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                            <Send className="w-8 h-8 text-gray-300 transform rotate-12" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900">Start the conversation</h3>
                        <p className="text-xs text-gray-500 max-w-[200px] mt-1">
                            Messages sent here will be visible to everyone on the project team.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.sender_id === currentUser?.id;
                        const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;

                        return (
                            <div key={msg.id} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                                    isMe ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                } ${!showAvatar ? 'opacity-0' : ''}`}>
                                    {msg.sender_name?.charAt(0)}
                                </div>

                                <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : ''}`}>
                                    {showAvatar && (
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                            {isMe ? 'You' : msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                    
                                    <div className={`p-4 rounded-2xl shadow-sm ${
                                        isMe ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                    }`}>
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                            {msg.content}
                                        </p>

                                        {/* Linked Document */}
                                        {msg.document && (
                                            <div className={`mt-3 p-3 rounded-xl flex items-center gap-3 border ${
                                                isMe ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-100'
                                            }`}>
                                                <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-white'}`}>
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-bold truncate ${isMe ? 'text-white' : 'text-gray-900'}`}>
                                                        {msg.document.file_name}
                                                    </p>
                                                    <p className={`text-[10px] ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                                                        Attached File
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="space-y-3">
                    
                    {/* File Preview */}
                    {selectedFile && (
                        <div className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-xl animate-in slide-in-from-bottom-2">
                             <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 border border-gray-100">
                                <FileText className="w-5 h-5" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">{selectedFile.name}</p>
                                <p className="text-[10px] text-gray-500">Ready to upload</p>
                             </div>
                             <button 
                                type="button" 
                                onClick={() => setSelectedFile(null)}
                                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                             >
                                <X className="w-4 h-4" />
                             </button>
                        </div>
                    )}

                    <div className="flex items-end gap-3 bg-white p-2 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-sm">
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shrink-0"
                            title="Attach a file"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                        
                        <textarea
                            rows={1}
                            placeholder="Type a message..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            className="flex-1 bg-transparent border-none outline-none ring-0 focus:ring-0 text-sm py-2.5 px-1 resize-none min-h-[40px] max-h-[120px]"
                        />

                        <button 
                            type="submit"
                            disabled={(!content.trim() && !selectedFile) || isSending}
                            className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-900 transition-all shrink-0"
                        >
                            {isSending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setSelectedFile(file);
                        }}
                    />
                </form>
            </div>
        </div>
    );
}
