import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Code, ArrowUp, Loader2, Copy, CheckCircle2, AlertCircle, ChevronRight, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { toast } from "sonner";

const FunctionDisplay = ({ toolCall }) => {
    const [expanded, setExpanded] = useState(false);
    const name = toolCall?.name || 'Function';
    const status = toolCall?.status || 'pending';
    const results = toolCall?.results;
    
    const parsedResults = (() => {
        if (!results) return null;
        try {
            return typeof results === 'string' ? JSON.parse(results) : results;
        } catch {
            return results;
        }
    })();
    
    const isError = results && (
        (typeof results === 'string' && /error|failed/i.test(results)) ||
        (parsedResults?.success === false)
    );
    
    const statusConfig = {
        pending: { icon: Clock, color: 'text-slate-400', text: 'Pending' },
        running: { icon: Loader2, color: 'text-slate-500', text: 'Running...', spin: true },
        in_progress: { icon: Loader2, color: 'text-slate-500', text: 'Running...', spin: true },
        completed: isError ? 
            { icon: AlertCircle, color: 'text-red-500', text: 'Failed' } : 
            { icon: CheckCircle2, color: 'text-green-600', text: 'Success' },
        success: { icon: CheckCircle2, color: 'text-green-600', text: 'Success' },
        failed: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' },
        error: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' }
    }[status] || { icon: Clock, color: 'text-slate-500', text: '' };
    
    const Icon = statusConfig.icon;
    const formattedName = name.split('.').reverse().join(' ').toLowerCase();
    
    return (
        <div className="mt-2 text-xs">
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                    "hover:bg-slate-50",
                    expanded ? "bg-slate-50 border-slate-300" : "bg-white border-slate-200"
                )}
            >
                <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
                <span className="text-slate-700">{formattedName}</span>
                {statusConfig.text && (
                    <span className={cn("text-slate-500", isError && "text-red-600")}>
                        • {statusConfig.text}
                    </span>
                )}
                {!statusConfig.spin && (toolCall.arguments_string || results) && (
                    <ChevronRight className={cn("h-3 w-3 text-slate-400 transition-transform ml-auto", 
                        expanded && "rotate-90")} />
                )}
            </button>
            
            {expanded && !statusConfig.spin && (
                <div className="mt-1.5 ml-3 pl-3 border-l-2 border-slate-200 space-y-2">
                    {toolCall.arguments_string && (
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Parameters:</div>
                            <pre className="bg-slate-50 rounded-md p-2 text-xs text-slate-600 whitespace-pre-wrap">
                                {(() => {
                                    try {
                                        return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2);
                                    } catch {
                                        return toolCall.arguments_string;
                                    }
                                })()}
                            </pre>
                        </div>
                    )}
                    {parsedResults && (
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Result:</div>
                            <pre className="bg-slate-50 rounded-md p-2 text-xs text-slate-600 whitespace-pre-wrap max-h-48 overflow-auto">
                                {typeof parsedResults === 'object' ? 
                                    JSON.stringify(parsedResults, null, 2) : parsedResults}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    
    return (
        <div className={cn("flex gap-5 mb-8", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <div className="relative flex-shrink-0 mt-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-2xl blur-lg opacity-50" />
                    <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 flex items-center justify-center shadow-2xl ring-2 ring-purple-500/30">
                        <span className="text-white text-lg font-bold drop-shadow-lg">R</span>
                    </div>
                </div>
            )}
            <div className={cn("flex-1 min-w-0 max-w-4xl", isUser && "flex flex-col items-end")}>
                {message.content && (
                    <div className={cn(
                        "rounded-3xl px-6 py-5 shadow-2xl backdrop-blur-sm transition-all",
                        isUser 
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/30 max-w-3xl ring-1 ring-purple-500/20" 
                            : "bg-[#1a1a1c]/80 text-slate-100 border border-white/5 shadow-black/20"
                    )}>
                        {isUser ? (
                            <p className="text-base leading-relaxed">{message.content}</p>
                        ) : (
                            <ReactMarkdown 
                                className="text-base prose prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                                components={{
                                    code: ({ inline, className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <div className="relative group/code my-5">
                                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl opacity-30 group-hover/code:opacity-50 blur-md transition-all duration-500" />
                                                <div className="relative ring-1 ring-purple-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20">
                                                    <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-purple-500/30">
                                                        <span className="text-xs font-mono text-purple-400 uppercase tracking-wider font-semibold">{match[1]}</span>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-semibold transition-all hover:scale-105 shadow-lg shadow-purple-500/40 ring-1 ring-purple-400/30"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                                                toast.success('✨ Copied to clipboard!');
                                                            }}
                                                        >
                                                            <Copy className="h-3.5 w-3.5 mr-1.5" />
                                                            Copy
                                                        </Button>
                                                    </div>
                                                    <pre className="bg-slate-950 text-slate-100 p-5 overflow-x-auto">
                                                        <code className={className} {...props}>{children}</code>
                                                    </pre>
                                                </div>
                                            </div>
                                        ) : (
                                            <code className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-sm font-mono border border-purple-400/30 shadow-sm">
                                                {children}
                                            </code>
                                        );
                                    },
                                    a: ({ children, ...props }) => (
                                        <a {...props} className="text-blue-400 hover:text-blue-300 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
                                    ),
                                    p: ({ children }) => <p className="my-2 leading-7">{children}</p>,
                                    ul: ({ children }) => <ul className="my-2 ml-5 list-disc space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="my-2 ml-5 list-decimal space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="leading-7">{children}</li>,
                                    h1: ({ children }) => <h1 className="text-xl font-medium my-3">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-lg font-medium my-3">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-base font-medium my-2">{children}</h3>,
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        )}
                    </div>
                )}
                
                {message.tool_calls?.length > 0 && (
                    <div className="space-y-1">
                        {message.tool_calls.map((toolCall, idx) => (
                            <FunctionDisplay key={idx} toolCall={toolCall} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ChatInput = ({ onSend, isLoading }) => {
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
        <form onSubmit={handleSubmit} className="relative group">
            <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className="min-h-[70px] max-h-[200px] resize-none pr-28 py-5 px-6 rounded-3xl bg-[#1a1a1c] border border-white/10 hover:border-white/20 focus:border-purple-500/40 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/20 shadow-2xl transition-all duration-200 text-[15px]"
                disabled={isLoading}
                rows={1}
            />
            <div className="absolute right-4 bottom-4 flex items-center gap-2">
                <Button 
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all"
                >
                    <Code className="h-4 w-4" />
                </Button>
                <Button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 shadow-xl shadow-purple-500/30 transition-all hover:scale-105 disabled:hover:scale-100"
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                        <ArrowUp className="h-5 w-5 text-white" />
                    )}
                </Button>
            </div>
        </form>
    );
};

export default function DiscordBotAI() {
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState('discord_bot_helper');
    const [bootComplete, setBootComplete] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [conversations, setConversations] = useState([]);
    const messagesEndRef = useRef(null);

    const agents = [
        { id: 'discord_bot_helper', name: 'Discord Bot', icon: '🤖', color: 'from-purple-500 to-blue-500' },
        { id: 'python_expert', name: 'Python Expert', icon: '🐍', color: 'from-blue-500 to-cyan-500' },
        { id: 'code_assistant', name: 'Code Assistant', icon: '💻', color: 'from-green-500 to-emerald-500' },
        { id: 'unrestricted_dev', name: 'Unrestricted', icon: '🔓', color: 'from-red-500 to-orange-500' }
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const timer = setTimeout(() => setBootComplete(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const loadConversations = async () => {
            try {
                const convs = await base44.agents.listConversations({ agent_name: selectedAgent });
                setConversations(convs || []);
            } catch (error) {
                console.error('Failed to load conversations:', error);
            }
        };
        loadConversations();
    }, [selectedAgent, conversation]);

    useEffect(() => {
        const initConversation = async () => {
            try {
                const conv = await base44.agents.createConversation({
                    agent_name: selectedAgent,
                    metadata: {
                        name: `${agents.find(a => a.id === selectedAgent)?.name || 'AI'} Session`
                    }
                });
                setConversation(conv);
                setMessages([]);
            } catch (error) {
                console.error('Failed to create conversation:', error);
                setConversation({ id: 'temp', messages: [] });
            }
        };
        initConversation();
    }, [selectedAgent]);

    useEffect(() => {
        if (!conversation || conversation.id === 'temp') return;

        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
            setMessages(data.messages || []);
            const lastMessage = data.messages?.[data.messages.length - 1];
            if (lastMessage?.role === 'assistant') {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [conversation]);

    const handleSend = async (message) => {
        if (!conversation || !message.trim() || conversation.id === 'temp') return;
        
        setIsLoading(true);
        
        try {
            await base44.agents.addMessage(conversation, {
                role: 'user',
                content: message
            });
        } catch (error) {
            console.error('Error sending message:', error);
            setIsLoading(false);
            toast.error('Failed to send message');
        }
    };

    const handleNewChat = async () => {
        try {
            const conv = await base44.agents.createConversation({
                agent_name: selectedAgent,
                metadata: {
                    name: `${agents.find(a => a.id === selectedAgent)?.name || 'AI'} Session`
                }
            });
            setConversation(conv);
            setMessages([]);
        } catch (error) {
            console.error('Failed to create new conversation:', error);
            setConversation({ id: `temp-${Date.now()}`, messages: [] });
            setMessages([]);
        }
    };

    if (!bootComplete) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="h-20 w-20 rounded-full border-4 border-purple-500/20 animate-ping absolute inset-0" />
                        <div className="h-20 w-20 rounded-full border-4 border-t-purple-500 border-r-blue-500 border-b-pink-500 border-l-purple-500 animate-spin" />
                    </div>
                    <div className="mt-8 space-y-2">
                        <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent mb-2">RIDE AI</div>
                        <div className="text-slate-500 text-xs font-mono">Initializing Neural Network...</div>
                        <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse delay-200" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f10] flex relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
            </div>

            {/* Sidebar */}
            <div className={cn(
                "flex-shrink-0 bg-[#1a1a1c]/80 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300 relative",
                sidebarOpen ? "w-72" : "w-0"
            )}>
                {sidebarOpen && (
                    <div className="flex flex-col h-full">
                        {/* Sidebar Header */}
                        <div className="p-5 border-b border-white/5">
                            <button
                                onClick={handleNewChat}
                                className="group w-full flex items-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-500/20 hover:border-purple-500/30 transition-all text-slate-200 font-semibold text-sm shadow-lg hover:shadow-purple-500/20"
                            >
                                <MessageSquare className="h-4 w-4 text-purple-400" />
                                New chat
                            </button>
                        </div>

                        {/* Agent Selector */}
                        <div className="p-5 border-b border-white/5">
                            <div className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest">AI Models</div>
                            <div className="space-y-1.5">
                                {agents.map((agent) => (
                                    <button
                                        key={agent.id}
                                        onClick={() => setSelectedAgent(agent.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                            selectedAgent === agent.id
                                                ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10"
                                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                        )}
                                    >
                                        <span className="text-lg">{agent.icon}</span>
                                        <span className="flex-1 text-left">{agent.name}</span>
                                        {selectedAgent === agent.id && (
                                            <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-5">
                                <div className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest">Recent Chats</div>
                                <div className="space-y-1">
                                    {conversations.slice(0, 10).map((conv) => (
                                        <button
                                            key={conv.id}
                                            onClick={() => setConversation(conv)}
                                            className={cn(
                                                "w-full text-left px-4 py-3 rounded-xl text-sm transition-all line-clamp-1 font-medium",
                                                conversation?.id === conv.id
                                                    ? "bg-white/10 text-white shadow-lg"
                                                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                            )}
                                        >
                                            {conv.metadata?.name || 'Untitled Chat'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Settings */}
                        <div className="p-5 border-t border-white/5">
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all font-medium">
                                <Code className="h-4 w-4" />
                                Settings
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen relative">
                {/* Top Bar */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0f0f10]/80 backdrop-blur-xl">
                    <div className="flex items-center gap-5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-xl transition-all"
                        >
                            <MessageSquare className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity" />
                                <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 flex items-center justify-center shadow-2xl ring-2 ring-purple-500/20">
                                    <span className="text-white font-bold text-lg">R</span>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent tracking-tight">RIDE AI</h1>
                                <p className="text-[10px] text-slate-500 font-medium">Powered by Advanced AI</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-500/20">
                            PRO
                        </div>
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-xl ring-2 ring-purple-500/20 cursor-pointer hover:scale-105 transition-transform">
                            U
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center px-8">
                            <div className="text-center max-w-4xl w-full">
                                <div className="mb-20">
                                    <div className="flex items-center justify-center gap-3 mb-8">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur-2xl opacity-30" />
                                            <span className="relative text-5xl">✨</span>
                                        </div>
                                        <h2 className="text-6xl font-semibold text-slate-100 tracking-tight">
                                            Hi there
                                        </h2>
                                    </div>
                                    <p className="text-5xl font-light text-slate-400 tracking-tight">
                                        Where should we start?
                                    </p>
                                </div>

                                {/* Suggestions */}
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    {[
                                        { text: "✍️ Create a Discord bot", icon: "🤖" },
                                        { text: "🐍 Write Python code", icon: "💻" },
                                        { text: "🚀 Build an automation", icon: "⚡" },
                                        { text: "💡 Get coding help", icon: "📚" }
                                    ].map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(suggestion.text.split(' ').slice(1).join(' '))}
                                            className="group px-7 py-4 rounded-2xl bg-[#1a1a1c]/80 hover:bg-[#222224] border border-white/5 hover:border-purple-500/30 transition-all duration-300 text-sm text-slate-200 font-medium shadow-lg hover:shadow-purple-500/10 hover:scale-105"
                                        >
                                            <span className="block text-lg mb-1">{suggestion.icon}</span>
                                            {suggestion.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="px-6 py-8">
                            <div className="max-w-4xl mx-auto space-y-8 pb-32">
                                {messages.map((msg, idx) => (
                                    <MessageBubble key={idx} message={msg} />
                                ))}
                                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                                    <div className="flex gap-4">
                                        <div className="relative flex-shrink-0">
                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-xl blur-sm opacity-75" />
                                            <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 flex items-center justify-center shadow-lg">
                                                <span className="text-white text-sm font-bold">R</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input - Fixed at bottom */}
                <div className="border-t border-white/5 bg-[#0f0f10]/80 backdrop-blur-xl px-8 py-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative">
                            <ChatInput onSend={handleSend} isLoading={isLoading} />
                            <div className="flex items-center justify-between mt-4 text-xs text-slate-500 font-medium">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                                    <span>Powered by {agents.find(a => a.id === selectedAgent)?.name}</span>
                                </div>
                                <span className="text-slate-600">Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-slate-500 text-[10px] font-mono">Enter</kbd> to send</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
