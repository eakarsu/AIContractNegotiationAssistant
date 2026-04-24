import { AlertTriangle, CheckCircle, ChevronRight, Shield, DollarSign, Scale, Briefcase, Users, TrendingUp, Award } from 'lucide-react';

// Smart parser that handles ANY format - JSON, nested JSON, strings, arrays
const smartParse = (input: any): string[] => {
  if (!input) return [];

  // If already an array of strings
  if (Array.isArray(input)) {
    return input.flatMap(item => smartParse(item));
  }

  // If it's a string
  if (typeof input === 'string') {
    const trimmed = input.trim();

    // Try to parse as JSON
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return smartParse(parsed);
      } catch {
        // Not valid JSON, treat as text
      }
    }

    // Split by newlines and clean up
    const lines = trimmed
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[\d]+[\.\):\-]\s*/, '').replace(/^\[?[A-Z]+\]?\s*/, '').trim())
      .filter(line => line.length > 0);

    return lines.length > 0 ? lines : [trimmed];
  }

  // If it's an object
  if (typeof input === 'object' && input !== null) {
    // Check for wrapper keys first
    for (const key of ['json', 'data', 'result', 'response']) {
      if (input[key]) return smartParse(input[key]);
    }

    // Check for content arrays
    for (const key of ['findings', 'recommendations', 'items', 'risks', 'issues', 'list']) {
      if (input[key]) return smartParse(input[key]);
    }

    // Extract text from object properties
    const text = input.description || input.finding || input.riskItem || input.risk ||
                 input.recommendation || input.text || input.content || input.message;
    const severity = input.severity || input.level || input.priority;

    if (text) {
      const prefix = severity ? `[${String(severity).toUpperCase()}] ` : '';
      return [prefix + text];
    }

    // Last resort: get all string values
    const strings = Object.values(input)
      .filter(v => typeof v === 'string' && v.length > 0 && v.length < 500)
      .map(v => String(v));

    return strings.length > 0 ? strings : [];
  }

  return [String(input)];
};

// Circular gauge component
export const RiskGauge = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#eab308' : '#22c55e';
  const textColor = score >= 70 ? 'text-red-600' : score >= 40 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle cx="64" cy="64" r="45" stroke="#e5e7eb" strokeWidth="10" fill="none" />
        <circle cx="64" cy="64" r="45" stroke={color} strokeWidth="10" fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${textColor}`}>{score}</span>
        <span className="text-xs text-gray-500">/ 100</span>
      </div>
    </div>
  );
};

// Risk category card
export const RiskCategoryCard = ({ icon: Icon, title, score, color }: {
  icon: any; title: string; score: number | null; color: string
}) => {
  if (score === null || score === undefined) return null;
  const textColor = score >= 70 ? 'text-red-600' : score >= 40 ? 'text-yellow-600' : 'text-green-600';
  const barColor = score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color}`}><Icon className="text-white" size={18} /></div>
        <span className="font-medium text-gray-700">{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-2xl font-bold ${textColor}`}>{score}</span>
        <div className="flex-1 mx-3">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
          </div>
        </div>
        <span className="text-xs text-gray-400">/100</span>
      </div>
    </div>
  );
};

// Main risk display component
export const RiskAnalysisDisplay = ({ risk }: { risk: any }) => {
  if (!risk) return null;

  const findings = smartParse(risk.findings);
  const recommendations = smartParse(risk.recommendations);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Risk Analysis</h2>
              <p className="text-indigo-200 text-sm">Powered by AI</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-bold shadow ${
            risk.category === 'high' ? 'bg-red-500 text-white' :
            risk.category === 'medium' ? 'bg-yellow-400 text-yellow-900' :
            'bg-green-500 text-white'
          }`}>
            {risk.category?.toUpperCase()} RISK
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overall Score */}
        <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white rounded-xl shadow-sm">
          <RiskGauge score={risk.overallScore || 0} />
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Risk Score</h3>
            <p className="text-gray-600">
              {(risk.overallScore || 0) >= 70
                ? 'Significant risk factors require immediate attention.'
                : (risk.overallScore || 0) >= 40
                ? 'Moderate risk factors should be reviewed.'
                : 'Minimal risk factors. Well-structured contract.'}
            </p>
          </div>
        </div>

        {/* Risk Breakdown */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600" />
            Risk Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RiskCategoryCard icon={DollarSign} title="Financial" score={risk.financialRisk} color="bg-blue-500" />
            <RiskCategoryCard icon={Scale} title="Legal" score={risk.legalRisk} color="bg-purple-500" />
            <RiskCategoryCard icon={Briefcase} title="Operational" score={risk.operationalRisk} color="bg-orange-500" />
            <RiskCategoryCard icon={Users} title="Reputational" score={risk.reputationalRisk} color="bg-pink-500" />
          </div>
        </div>

        {/* Findings */}
        {findings.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              Key Findings
            </h3>
            <div className="space-y-3">
              {findings.slice(0, 10).map((finding, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                  <ChevronRight className="text-amber-500 mt-0.5 flex-shrink-0" size={18} />
                  <p className="text-gray-700">{finding}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={20} className="text-green-500" />
              Recommendations
            </h3>
            <div className="space-y-3">
              {recommendations.slice(0, 10).map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
                  <p className="text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-200">
          Analysis: {new Date(risk.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysisDisplay;
