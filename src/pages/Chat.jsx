import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import ConversationList from '../components/chat/ConversationList';

export default function Chat() {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!activeConversation) return;

        const unsubscribe = base44.agents.subscribeToConversation(activeConversation.id, (data) => {
            setMessages(data.messages || []);
        });

        return () => unsubscribe();
    }, [activeConversation?.id]);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const convs = await base44.agents.listConversations({ agent_name: 'assistant' });
            setConversations(convs || []);
            
            if (convs && convs.length > 0) {
                loadConversation(convs[0].id);
            } else {
                await createNewConversation();
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            toast.error('Agent not available. Please check agent configuration.');
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const loadConversation = async (id) => {
        try {
            const conv = await base44.agents.getConversation(id);
            setActiveConversation(conv);
            setMessages(conv.messages || []);
        } catch (error) {
            toast.error('Failed to load conversation');
        }
    };

    const createNewConversation = async () => {
        try {
            const conv = await base44.agents.createConversation({
                agent_name: 'assistant',
                metadata: { name: 'New Chat' }
            });
            setConversations(prev => [conv, ...prev]);
            setActiveConversation(conv);
            setMessages([]);
        } catch (error) {
            toast.error('Failed to create conversation');
        }
    };

    const deleteConversation = async (id) => {
        try {
            await base44.agents.deleteConversation(id);
            setConversations(prev => prev.filter(c => c.id !== id));
            
            if (activeConversation?.id === id) {
                const remaining = conversations.filter(c => c.id !== id);
                if (remaining.length > 0) {
                    loadConversation(remaining[0].id);
                } else {
                    await createNewConversation();
                }
            }
            toast.success('Chat deleted');
        } catch (error) {
            toast.error('Failed to delete conversation');
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Sidebar */}
            <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
                <ConversationList
                    conversations={conversations}
                    activeId={activeConversation?.id}
                    onSelect={loadConversation}
                    onCreate={createNewConversation}
                    onDelete={deleteConversation}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">AI Assistant</h1>
                            <p className="text-xs text-slate-500">Writing, Coding & Planning Helper</p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.length === 0 && (
                            <div className="text-center py-20">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <Sparkles className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-semibold text-slate-900 mb-2">How can I help you today?</h2>
                                <p className="text-slate-500">Ask me anything about writing, coding, or planning</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8 max-w-2xl mx-auto">
                                    {[
                                        { title: "Write", desc: "Draft emails, articles, or creative content" },
                                        { title: "Code", desc: "Debug issues or write code snippets" },
                                        { title: "Plan", desc: "Organize projects and break down tasks" }
                                    ].map((item, i) => (
                                        <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                                            <h3 className="font-medium text-slate-900 mb-1">{item.title}</h3>
                                            <p className="text-xs text-slate-500">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {messages.map((message, i) => (
                            <MessageBubble key={i} message={message} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input */}
                <ChatInput
                    conversation={activeConversation}
                    onMessageSent={() => {}}
                />
            </div>
        </div>
    );
}
