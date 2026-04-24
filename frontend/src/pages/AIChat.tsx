import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Trash2, FileText, Sparkles } from 'lucide-react';
import { sendChatMessage, getChatHistory, clearChatHistory, getContracts, analyzeContract } from '../services/api';
import { useToast } from '../hooks/useToast';

export default function AIChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState('');
  const [analysisType, setAnalysisType] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    loadContracts();
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadContracts = async () => {
    try {
      const response = await getContracts();
      setContracts(response.data);
    } catch (error) {
      console.error('Failed to load contracts:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await getChatHistory(sessionId);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || submitting) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setSubmitting(true);

    try {
      const response = await sendChatMessage({
        sessionId,
        message: input,
        contractId: selectedContract || undefined
      });
      setMessages(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedContract || !analysisType || submitting) return;
    setLoading(true);
    setSubmitting(true);

    try {
      const response = await analyzeContract({ contractId: parseInt(selectedContract), analysisType });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.analysis }]);
    } catch (error) {
      console.error('Failed to analyze:', error);
      toast.error('Failed to analyze contract. Please try again.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearChatHistory(sessionId);
      setMessages([]);
      toast.success('Chat history cleared.');
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast.error('Failed to clear chat history.');
    }
  };

  const quickPrompts = [
    'What are the key risks in this contract?',
    'Summarize the main obligations',
    'What clauses should I negotiate?',
    'Check for compliance issues',
    'Suggest improvements to liability terms'
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-2xl font-bold text-gray-900">AI Contract Assistant</h1><p className="text-gray-600">Get AI-powered help with your contracts</p></div>
        <button onClick={handleClear} className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={20} />Clear Chat</button>
      </div>

      <div className="flex gap-4 mb-4">
        <select value={selectedContract} onChange={(e) => setSelectedContract(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
          <option value="">Select a contract for context (optional)</option>
          {contracts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        {selectedContract && (
          <>
            <select value={analysisType} onChange={(e) => setAnalysisType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">Quick Analysis</option>
              <option value="summary">Summary</option>
              <option value="risks">Risk Analysis</option>
              <option value="negotiation">Negotiation Tips</option>
              <option value="compliance">Compliance Review</option>
            </select>
            <button onClick={handleAnalyze} disabled={!analysisType || submitting} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"><Sparkles size={20} /></button>
          </>
        )}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="mx-auto text-primary-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How can I help you today?</h3>
              <p className="text-gray-600 mb-6">Ask me anything about contracts, negotiations, or legal terms.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {quickPrompts.map((prompt, i) => (
                  <button key={i} onClick={() => setInput(prompt)} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200">{prompt}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center"><Bot className="text-primary-600" size={18} /></div>}
              <div className={`max-w-[70%] p-3 rounded-xl ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"><User className="text-gray-600" size={18} /></div>}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center"><Bot className="text-primary-600" size={18} /></div>
              <div className="bg-gray-100 p-3 rounded-xl"><div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span></div></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about contracts, negotiations, or legal terms..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              disabled={submitting}
            />
            <button onClick={handleSend} disabled={submitting || !input.trim()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"><Send size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
