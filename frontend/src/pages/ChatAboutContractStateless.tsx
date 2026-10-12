import FormattedAIReport from '../components/FormattedAIReport';
import { useState } from 'react';
import api from '../services/api';
import { MessageSquare, Send } from 'lucide-react';

type ChatMsg = { role: 'user' | 'assistant'; content: unknown };

const examples = [
  { label: 'Service terms', contractText: 'The supplier will deliver the website in three milestones. Invoices are due 30 days after acceptance. The customer may request corrections within ten business days.', question: 'What are the main obligations and missing acceptance details?' },
  { label: 'Data processing', contractText: 'The vendor may use customer data to provide the subscription service. It will return data within 30 days after termination and notify the customer of a confirmed incident.', question: 'Which data handling terms should be clarified before signing?' },
  { label: 'Confidentiality', contractText: 'Each party must protect confidential information for three years and may disclose it to advisers bound by confidentiality. Public information is excluded.', question: 'Summarize the confidentiality duties and any negotiation points.' },
];

export default function ChatAboutContractStateless() {
  const [contractText, setContractText] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setError(null);
    if (!contractText.trim()) {
      setError('Contract text is required');
      return;
    }
    if (!input.trim()) {
      setError('Enter a question');
      return;
    }
    const next: ChatMsg[] = [...messages, { role: 'user', content: input }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat-about-contract', {
        contract_text: contractText,
        messages: next,
      });
      const reply = data.reply;
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      setError(e.response?.data?.error || e.response?.data?.errors?.[0]?.msg || e.message);
    }
    setLoading(false);
  };

  const reset = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-primary-600" />
          Chat About Contract
        </h1>
        <p className="text-gray-600">Stateless multi-turn Q&amp;A grounded in a contract</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Contract</h2>
          <div className="flex flex-wrap gap-2 mb-3" aria-label="Fill sample inputs">{examples.map(example => <button key={example.label} type="button" disabled={loading} onClick={() => { setContractText(example.contractText); setInput(example.question); setError(null); }} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">{example.label}</button>)}</div>
          <textarea
            rows={20}
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            placeholder="Paste full contract text..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={reset}
            className="mt-3 text-sm text-gray-600 underline"
          >
            Reset conversation
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Conversation</h2>
          <div className="flex-1 space-y-3 overflow-auto max-h-[480px] mb-3">
            {messages.length === 0 && (
              <div className="text-gray-400 text-sm">Ask a question about the contract.</div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded text-sm ${
                  m.role === 'user'
                    ? 'bg-primary-50 border border-primary-100'
                    : 'bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="text-xs font-medium text-gray-500 mb-1">{m.role}</div>
                <div className="whitespace-pre-wrap">{m.role === 'assistant' ? <FormattedAIReport response={m.content} /> : String(m.content)}</div>
              </div>
            ))}
            {loading && <div className="text-gray-500 text-sm">Thinking...</div>}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm mb-2">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) send();
              }}
              placeholder="Ask about a clause, a risk, an obligation..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={send}
              disabled={loading}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
