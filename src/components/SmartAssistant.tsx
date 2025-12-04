
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface SmartAssistantProps {
    user: UserProfile;
}

interface Message {
    id: string;
    text: string;
    sender: 'USER' | 'BOT';
    timestamp: Date;
}

export const SmartAssistant: React.FC<SmartAssistantProps> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: `Hi ${user.displayName.split(' ')[0]}! I'm your AI ERP Assistant. Ask me about sales, inventory, or tour plans.`, sender: 'BOT', timestamp: new Date() }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'USER', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Real AI processing
        let responseText = "I'm not sure about that yet.";
        const lowerInput = userMsg.text.toLowerCase();

        try {
            if (lowerInput.includes('sales') || lowerInput.includes('target')) {
                const { getSalesTarget } = await import('../services/mockDatabase');
                const { predictSales } = await import('../services/ai/ForecastingService');
                const now = new Date();
                const target = await getSalesTarget(user.uid, now.getMonth(), now.getFullYear());
                const forecast = await predictSales(user.uid, now.getMonth(), now.getFullYear());

                if (target) {
                    const pct = Math.round((target.achievedAmount / target.targetAmount) * 100);
                    responseText = `You've achieved ${pct}% of your target (₹${target.achievedAmount.toLocaleString()}). My forecast suggests you'll reach ₹${forecast.predictedAmount.toLocaleString()} by month-end.`;
                } else {
                    responseText = "I couldn't find a sales target for this month.";
                }
            } else if (lowerInput.includes('leave') || lowerInput.includes('holiday')) {
                const { getLeaves } = await import('../services/mockDatabase');
                const leaves = await getLeaves(user.uid);
                const approved = leaves.filter(l => l.status === 'APPROVED').length;
                const pending = leaves.filter(l => l.status === 'PENDING').length;
                responseText = `You have ${approved} approved leaves and ${pending} pending applications. Would you like to apply for a new one?`;
            } else if (lowerInput.includes('stock') || lowerInput.includes('inventory')) {
                const { forecastInventoryNeeds } = await import('../services/ai/ForecastingService');
                const suggestions = await forecastInventoryNeeds(user.uid);
                if (suggestions.length > 0) {
                    responseText = `You are running low on ${suggestions.length} items. I recommend restocking ${suggestions[0].itemName} (${suggestions[0].suggestedQuantity} units).`;
                } else {
                    responseText = "Your inventory levels look healthy right now.";
                }
            } else if (lowerInput.includes('plan') || lowerInput.includes('tour')) {
                const { optimizeTourPlan } = await import('../services/ai/RouteOptimizer');
                // Mock usage of optimizer
                const suggestion = optimizeTourPlan([], { id: 'h1', name: 'Home', lat: 28.7041, lng: 77.1025 });
                responseText = `I've analyzed your territory. ${suggestion.reasoning}`;
            }
        } catch (error) {
            console.error(error);
            responseText = "I encountered an error while analyzing your data.";
        }

        const botMsg: Message = { id: (Date.now() + 1).toString(), text: responseText, sender: 'BOT', timestamp: new Date() };
        setMessages(prev => [...prev, botMsg]);
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all z-50 flex items-center justify-center"
                >
                    <Sparkles className="h-6 w-6 animate-pulse" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-slate-200 overflow-hidden font-sans">
                    {/* Header */}
                    <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center space-x-2">
                            <Bot size={20} />
                            <span className="font-semibold">Tertius AI Assistant</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 rounded p-1">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.sender === 'USER'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-slate-200">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask anything..."
                                className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
