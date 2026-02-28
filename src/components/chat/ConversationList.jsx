import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

export default function ConversationList({ conversations, activeId, onSelect, onCreate, onDelete }) {
    return (
        <div className="h-full flex flex-col bg-slate-50 border-r border-slate-200">
            <div className="p-4 border-b border-slate-200">
                <Button
                    onClick={onCreate}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        className={cn(
                            "group relative p-3 rounded-xl cursor-pointer transition-all",
                            activeId === conv.id 
                                ? "bg-white shadow-sm border border-slate-200" 
                                : "hover:bg-white/50"
                        )}
                        onClick={() => onSelect(conv.id)}
                    >
                        <div className="flex items-start gap-3">
                            <MessageSquare className={cn(
                                "h-4 w-4 mt-0.5 flex-shrink-0",
                                activeId === conv.id ? "text-blue-600" : "text-slate-400"
                            )} />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900 truncate">
                                    {conv.metadata?.name || 'New Conversation'}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {format(new Date(conv.created_date), 'MMM d, h:mm a')}
                                </div>
                            </div>
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(conv.id);
                                    }}
                                >
                                    <Trash2 className="h-3 w-3 text-slate-400 hover:text-red-500" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
                
                {conversations.length === 0 && (
                    <div className="text-center py-12 px-4">
                        <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No conversations yet</p>
                        <p className="text-xs text-slate-400 mt-1">Start a new chat to begin</p>
                    </div>
                )}
            </div>
        </div>
    );
}
