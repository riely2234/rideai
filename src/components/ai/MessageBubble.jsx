import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
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

export default function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    
    return (
        <div className="flex gap-4">
            {!isUser && (
                <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-xl blur-sm opacity-75" />
                    <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-bold">R</span>
                    </div>
                </div>
            )}
            {isUser && <div className="w-8 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
                {isUser && (
                    <div className="text-lg font-normal text-slate-200 mb-2">You</div>
                )}
                {message.content && (
                    <div className={cn(
                        isUser ? "text-slate-200" : "text-slate-300"
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
                                            <div className="relative group/code my-4">
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover/code:opacity-40 blur transition duration-300" />
                                                <div className="relative">
                                                    <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-t-xl border-b border-purple-500/20">
                                                        <span className="text-xs font-mono text-purple-400">{match[1]}</span>
                                                        <Button
                                                            size="sm"
                                                            className="h-7 px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-medium transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                                                toast.success('✓ Copied to clipboard!');
                                                            }}
                                                        >
                                                            <Copy className="h-3 w-3 mr-1.5" />
                                                            Copy
                                                        </Button>
                                                    </div>
                                                    <pre className="bg-slate-900 text-slate-100 rounded-b-xl p-4 overflow-x-auto border-x border-b border-purple-500/10">
                                                        <code className={className} {...props}>{children}</code>
                                                    </pre>
                                                </div>
                                            </div>
                                        ) : (
                                            <code className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 text-sm font-mono border border-purple-500/20">
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
}
