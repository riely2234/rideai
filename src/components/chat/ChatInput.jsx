import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ChatInput({ conversation, onMessageSent, disabled }) {
    const [input, setInput] = useState('');
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    const handleFileSelect = async (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = selectedFiles.map(file => 
                base44.integrations.Core.UploadFile({ file })
            );
            const results = await Promise.all(uploadPromises);
            const uploadedFiles = selectedFiles.map((file, i) => ({
                name: file.name,
                url: results[i].file_url
            }));
            setFiles(prev => [...prev, ...uploadedFiles]);
        } catch (error) {
            toast.error('Failed to upload files');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if ((!input.trim() && files.length === 0) || !conversation) return;

        const messageContent = input.trim();
        const fileUrls = files.map(f => f.url);

        setInput('');
        setFiles([]);
        
        try {
            await base44.agents.addMessage(conversation, {
                role: 'user',
                content: messageContent || '(attached files)',
                ...(fileUrls.length > 0 && { file_urls: fileUrls })
            });
            onMessageSent?.();
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-slate-200 bg-white p-4">
            {files.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {files.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 text-xs">
                            <Paperclip className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-700 max-w-[150px] truncate">{file.name}</span>
                            <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything about writing, coding, or planning..."
                        className="resize-none min-h-[52px] max-h-[200px] pr-12 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        disabled={disabled || uploading}
                        rows={1}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 bottom-2 h-8 w-8 text-slate-400 hover:text-slate-600"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || uploading}
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>
                <Button
                    onClick={handleSend}
                    disabled={disabled || uploading || (!input.trim() && files.length === 0)}
                    className="h-[52px] px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl shadow-sm"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
