// Test parsing logic
const content = '{"json":{"overallScore":62,"findings":[{"riskItem":"Test Risk","severity":"high","description":"This is a test finding"}],"recommendations":["Fix this issue","Review the contract"]}}';

const parseAIResponse = (content) => {
  let data;
  try {
    data = typeof content === 'string' ? JSON.parse(content) : content;
  } catch {
    return null;
  }
  if (data.json) data = data.json;
  if (data.response) data = data.response;
  if (data.result) data = data.result;
  return data;
};

const extractText = (data) => {
  if (!data) return '';
  if (typeof data === 'string') return data;

  if (Array.isArray(data)) {
    return data.map((item, idx) => {
      if (typeof item === 'string') return `${idx + 1}. ${item}`;
      if (typeof item === 'object' && item !== null) {
        const text = item.description || item.finding || item.riskItem || item.risk || item.recommendation || item.text;
        const severity = item.severity || item.level || item.priority;
        if (text) {
          return severity ? `${idx + 1}. [${severity.toUpperCase()}] ${text}` : `${idx + 1}. ${text}`;
        }
        const values = Object.values(item).filter(v => typeof v === 'string');
        return `${idx + 1}. ${values.join(' - ')}`;
      }
      return `${idx + 1}. ${String(item)}`;
    }).join('\n');
  }

  if (typeof data === 'object') {
    for (const key of ['findings', 'items', 'risks', 'recommendations']) {
      if (Array.isArray(data[key])) {
        return extractText(data[key]);
      }
    }
    return JSON.stringify(data);
  }

  return String(data);
};

const parsed = parseAIResponse(content);
console.log('=== PARSED DATA ===');
console.log(JSON.stringify(parsed, null, 2));
console.log('\n=== EXTRACTED FINDINGS ===');
console.log(extractText(parsed.findings));
console.log('\n=== EXTRACTED RECOMMENDATIONS ===');
console.log(extractText(parsed.recommendations));
