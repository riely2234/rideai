import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Loader2 } from 'lucide-react';

export default function ChatInput({ onSend, isLoading }) {
    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSend(input);
            setInput('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a prompt here"
                className="min-h-[56px] max-h-[200px] resize-none pr-12 rounded-3xl bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 shadow-lg backdrop-blur-xl"
                disabled={isLoading}
                rows={1}
            />
            <Button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                size="icon"
                className="absolute right-2 bottom-2 h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
            >
                {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                    <ArrowUp className="h-5 w-5 text-white" />
                )}
            </Button>
        </form>
    );
}
