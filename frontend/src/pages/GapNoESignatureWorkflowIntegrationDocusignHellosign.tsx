// // === Batch 02 Gaps & Frontend Mounts ===
import { useState, FormEvent } from 'react';

/**
 * Gap/CFS Feature Page: No e-signature workflow integration (DocuSign, HelloSign).
 * Slug: no-e-signature-workflow-integration-docusign-hellosign
 * Backend: /api/gap-no-e-signature-workflow-integration-docusign-hellosign
 */

interface AiResponse {
  ai_result?: unknown;
  model?: string;
  tokens?: number | null;
  [key: string]: unknown;
}

export default function NoESignatureWorkflowIntegrationDocusignHellosignPage() {
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      let body: unknown;
      try { body = JSON.parse(input); } catch (_) { body = { input }; }
      const res = await fetch('/api/gap-no-e-signature-workflow-integration-docusign-hellosign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data: AiResponse & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', color: '#e5e7eb' }}>
      <h2 style={{ marginBottom: 8 }}>No e-signature workflow integration (DocuSign, HelloSign).</h2>
      <p style={{ opacity: 0.75, marginBottom: 16 }}>No e-signature workflow integration (DocuSign, HelloSign).</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ fontSize: 13, opacity: 0.85 }}>
          Input (text or JSON):
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          placeholder='Describe the case or paste JSON'
          style={{
            padding: 10,
            borderRadius: 6,
            border: '1px solid #374151',
            background: '#111827',
            color: '#e5e7eb',
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 16px',
            borderRadius: 6,
            border: 'none',
            background: loading ? '#6b7280' : '#2563eb',
            color: '#fff',
            cursor: loading ? 'wait' : 'pointer',
            fontWeight: 600,
            alignSelf: 'flex-start',
          }}
        >
          {loading ? 'Running...' : 'Run Analysis'}
        </button>
      </form>
      {error && (
        <div style={{ marginTop: 16, padding: 12, background: '#7f1d1d', borderRadius: 6, color: '#fee2e2' }}>
          Error: {error}
        </div>
      )}
      {result && (
        <div style={{ marginTop: 16, padding: 12, background: '#0f172a', borderRadius: 6, border: '1px solid #1f2937' }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
            Model: {result.model ?? 'n/a'} | Tokens: {result.tokens ?? 'n/a'}
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13, margin: 0 }}>
{JSON.stringify(result.ai_result ?? result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
