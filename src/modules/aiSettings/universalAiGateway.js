/**
 * Universal Multi-Provider AI Gateway
 * Supports Google Gemini, xAI Grok, OpenAI, Anthropic Claude, and DeepSeek.
 * Provides unified request formatting, response normalization, and live connection testing.
 */

import { env } from '../../config/env.js';
import { recordAiTokenUsage } from './aiUsage.service.js';

export const AI_PROVIDERS = {
  GEMINI: 'gemini',
  GROQ: 'groq',
  OPENAI: 'openai',
  CLAUDE: 'claude',
  DEEPSEEK: 'deepseek'
};

export const PROVIDER_MODELS = {
  gemini: [
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Recommended - High Speed & High Quota)', context: '1M tokens' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Balanced Reasoning & Speed)', context: '1M tokens' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', context: '1M tokens' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', context: '1M tokens' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep Journalistic Analysis)', context: '1M tokens' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', context: '1M tokens' },
    { id: 'gemini-pro-latest', name: 'Gemini Pro Latest', context: '1M tokens' }
  ],
  groq: [
    { id: 'openai/gpt-oss-120b', name: 'OpenAI GPT-OSS 120B (High Intelligence & Multilingual)', context: '128k tokens' },
    { id: 'openai/gpt-oss-20b', name: 'OpenAI GPT-OSS 20B (Recommended - Fast & Powerful)', context: '128k tokens' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Recommended - High Speed & Smart)', context: '128k tokens' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra-Fast ~200ms)', context: '128k tokens' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Broad Context)', context: '32k tokens' }
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Recommended - Fast & Cost Efficient)', context: '128k tokens' },
    { id: 'gpt-4o', name: 'GPT-4o (Flagship Omni High Intelligence)', context: '128k tokens' },
    { id: 'o1-mini', name: 'o1-mini (Specialized Reasoning)', context: '128k tokens' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', context: '128k tokens' }
  ],
  claude: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Superior Journalistic Writing)', context: '200k tokens' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Lightning Fast Output)', context: '200k tokens' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Complex Long-form Analysis)', context: '200k tokens' }
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek-V3 Chat (High Performance Open Weights)', context: '64k tokens' },
    { id: 'deepseek-reasoner', name: 'DeepSeek-R1 Reasoner (Deep Chain-of-Thought)', context: '64k tokens' }
  ]
};

/**
 * Universal Completion Caller
 */
export async function callUniversalAI({
  provider = 'gemini',
  model = 'gemini-2.5-flash',
  apiKey = '',
  prompt = '',
  systemInstruction = '',
  history = [],
  temperature = 0.7,
  maxTokens = 4096,
  topP = 0.95,
  timeoutMs = 60000
}) {
  const normProvider = (provider || 'gemini').toLowerCase().trim();
  const effectiveModel = model || (PROVIDER_MODELS[normProvider]?.[0]?.id) || 'gemini-2.5-flash';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let result = null;

    if (normProvider === AI_PROVIDERS.GEMINI) {
      result = await callGeminiAPI({
        apiKey,
        model: effectiveModel,
        prompt,
        systemInstruction,
        history,
        temperature,
        maxTokens,
        topP,
        signal: controller.signal
      });
    } else if (normProvider === AI_PROVIDERS.GROQ || normProvider === 'grok') {
      result = await callOpenAICompatibleAPI({
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey,
        model: effectiveModel,
        prompt,
        systemInstruction,
        history,
        temperature,
        maxTokens,
        topP,
        providerName: 'Groq',
        signal: controller.signal
      });
    } else if (normProvider === AI_PROVIDERS.OPENAI) {
      result = await callOpenAICompatibleAPI({
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey,
        model: effectiveModel,
        prompt,
        systemInstruction,
        history,
        temperature,
        maxTokens,
        topP,
        providerName: 'OpenAI',
        signal: controller.signal
      });
    } else if (normProvider === AI_PROVIDERS.DEEPSEEK) {
      result = await callOpenAICompatibleAPI({
        endpoint: 'https://api.deepseek.com/chat/completions',
        apiKey,
        model: effectiveModel,
        prompt,
        systemInstruction,
        history,
        temperature,
        maxTokens,
        topP,
        providerName: 'DeepSeek',
        signal: controller.signal
      });
    } else if (normProvider === AI_PROVIDERS.CLAUDE) {
      result = await callClaudeAPI({
        apiKey,
        model: effectiveModel,
        prompt,
        systemInstruction,
        history,
        temperature,
        maxTokens,
        topP,
        signal: controller.signal
      });
    } else {
      throw new Error(`Unsupported AI Provider: ${provider}`);
    }

    if (result && result.usage) {
      recordAiTokenUsage({
        provider: result.provider || normProvider,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens
      }).catch(err => console.warn('[UniversalAI] Token record warning:', err.message));
    }

    return result;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Google Gemini Implementation
 */
async function callGeminiAPI({
  apiKey,
  model,
  prompt,
  systemInstruction,
  history,
  temperature,
  maxTokens,
  topP,
  signal
}) {
  const key = apiKey || env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Google Gemini API Key is missing.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const contents = [];
  if (Array.isArray(history) && history.length > 0) {
    for (const msg of history.slice(-6)) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const body = {
    contents,
    generationConfig: {
      temperature: Number(temperature) || 0.7,
      maxOutputTokens: Number(maxTokens) || 4096,
      topP: Number(topP) || 0.95
    }
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini API Error (${res.status})`);
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const promptTokens = data.usageMetadata?.promptTokenCount || 0;
  const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
  const totalTokens = data.usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

  return {
    rawText,
    provider: 'gemini',
    model,
    usage: { promptTokens, completionTokens, totalTokens }
  };
}

/**
 * OpenAI / Grok / DeepSeek Standard Format Caller
 */
async function callOpenAICompatibleAPI({
  endpoint,
  apiKey,
  model,
  prompt,
  systemInstruction,
  history,
  temperature,
  maxTokens,
  topP,
  providerName,
  signal
}) {
  if (!apiKey) throw new Error(`${providerName} API Key is missing. Please configure it in AI Settings.`);

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  if (Array.isArray(history) && history.length > 0) {
    for (const msg of history.slice(-6)) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    }
  }

  messages.push({ role: 'user', content: prompt });

  const body = {
    model,
    messages,
    temperature: Number(temperature) || 0.7,
    max_tokens: Number(maxTokens) || 4096,
    top_p: Number(topP) || 0.95
  };

  console.log(`[UniversalAI] Calling ${providerName} at ${endpoint} with model: "${model}", keyPrefix: "${apiKey?.substring(0, 8)}..."`);

  const res = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  console.log(`[UniversalAI] ${providerName} HTTP ${res.status}:`, JSON.stringify(data));

  if (!res.ok) {
    throw new Error(data.error?.message || `${providerName} API Error (${res.status})`);
  }

  const rawText = data.choices?.[0]?.message?.content || '';
  const promptTokens = data.usage?.prompt_tokens || 0;
  const completionTokens = data.usage?.completion_tokens || 0;
  const totalTokens = data.usage?.total_tokens || (promptTokens + completionTokens);

  return {
    rawText,
    provider: providerName.toLowerCase(),
    model,
    usage: { promptTokens, completionTokens, totalTokens }
  };
}

/**
 * Anthropic Claude API Implementation
 */
async function callClaudeAPI({
  apiKey,
  model,
  prompt,
  systemInstruction,
  history,
  temperature,
  maxTokens,
  topP,
  signal
}) {
  if (!apiKey) throw new Error('Anthropic Claude API Key is missing. Please configure it in AI Settings.');

  const messages = [];
  if (Array.isArray(history) && history.length > 0) {
    for (const msg of history.slice(-6)) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    }
  }

  messages.push({ role: 'user', content: prompt });

  const body = {
    model,
    max_tokens: Number(maxTokens) || 4096,
    temperature: Number(temperature) || 0.7,
    top_p: Number(topP) || 0.95,
    messages
  };

  if (systemInstruction) {
    body.system = systemInstruction;
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Claude API Error (${res.status})`);
  }

  const rawText = data.content?.[0]?.text || '';
  const promptTokens = data.usage?.input_tokens || 0;
  const completionTokens = data.usage?.output_tokens || 0;
  const totalTokens = promptTokens + completionTokens;

  return {
    rawText,
    provider: 'claude',
    model,
    usage: { promptTokens, completionTokens, totalTokens }
  };
}

/**
 * Live Models Fetcher
 * Dynamically queries official provider APIs using the Admin's supplied key.
 * Strictly filters for text/chat generation capabilities and normalizes model objects.
 */
export async function fetchLiveModels({ provider, apiKey }) {
  const normProvider = (provider || 'gemini').toLowerCase().trim();
  const cleanKey = (apiKey || '').trim();

  if (!cleanKey) {
    throw new Error(`API Key is required to fetch models for ${provider.toUpperCase()}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    // 1. Google Gemini (Strictly filter out internal image/audio/robotics/experimental test names)
    if (normProvider === AI_PROVIDERS.GEMINI) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `Google Gemini API Error (${res.status})`);
      }

      const GEMINI_EXCLUDE = [
        'banana', 'image', 'tts', 'transcribe', 'lyria', 'robotics',
        'computer-use', 'deep-research', 'antigravity', 'argon', 'gemma',
        'customtools', 'custom-tools', 'audio', 'embedding', 'aqa', 'imagen',
        'learnlm', 'medlm', 'preview', 'omni'
      ];

      const rawModels = data.models || [];
      const priorityOrder = [
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-flash-latest',
        'gemini-pro-latest'
      ];

      let chatModels = rawModels
        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .filter(m => {
          const id = (m.name || '').toLowerCase();
          const disp = (m.displayName || '').toLowerCase();
          return !GEMINI_EXCLUDE.some(term => id.includes(term) || disp.includes(term));
        })
        .map(m => {
          const cleanId = (m.name || '').replace(/^models\//, '');
          const inLimit = m.inputTokenLimit ? `${Math.round(m.inputTokenLimit / 1000)}k tokens` : '1M tokens';
          let cleanName = m.displayName || cleanId;

          if (cleanId.includes('flash-lite')) {
            cleanName = `${cleanName} (Recommended - Fast & High Quota)`;
          } else if (cleanId === 'gemini-3.5-flash' || cleanId === 'gemini-2.5-flash') {
            cleanName = `${cleanName} (Balanced Speed & Reasoning)`;
          } else if (cleanId.includes('pro')) {
            cleanName = `${cleanName} (Deep Journalistic Analysis)`;
          }

          return {
            id: cleanId,
            name: cleanName,
            context: inLimit,
            isVerified: false
          };
        });

      // Sort by recommended priority and pick top clean models
      chatModels.sort((a, b) => {
        const idxA = priorityOrder.indexOf(a.id);
        const idxB = priorityOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.id.localeCompare(b.id);
      });

      // Keep only top 6 production models
      chatModels = chatModels.slice(0, 6);

      if (chatModels.length === 0) {
        return PROVIDER_MODELS.gemini;
      }
      return chatModels;
    }

    // 2. OpenAI (Strictly keep top chat models, exclude date snapshots and audio/realtime)
    if (normProvider === AI_PROVIDERS.OPENAI) {
      const url = 'https://api.openai.com/v1/models';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${cleanKey}` },
        signal: controller.signal
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `OpenAI API Error (${res.status})`);
      }

      const rawList = data.data || [];
      const allowedOpenAi = ['gpt-4o', 'gpt-4o-mini', 'o1-mini', 'o3-mini', 'gpt-4-turbo'];
      const chatModels = rawList
        .filter(m => {
          const id = (m.id || '').toLowerCase();
          if (/-\d{4}-\d{2}-\d{2}/.test(id)) return false;
          if (/(realtime|audio|embedding|whisper|dall-e|tts|moderation|babbage|davinci|curie|instruct|search)/i.test(id)) return false;
          return allowedOpenAi.includes(id);
        })
        .map(m => {
          let name = m.id.toUpperCase();
          if (m.id === 'gpt-4o-mini') name = 'GPT-4o Mini (Recommended - Fast & Cost Efficient)';
          if (m.id === 'gpt-4o') name = 'GPT-4o (Flagship Omni High Intelligence)';
          if (m.id === 'o1-mini') name = 'o1-mini (Specialized Reasoning)';
          return {
            id: m.id,
            name,
            context: '128k tokens',
            isVerified: false
          };
        })
        .slice(0, 5);

      if (chatModels.length === 0) {
        return PROVIDER_MODELS.openai;
      }
      return chatModels;
    }

    // 3. Groq (GroqCloud - Ultra-Fast LPU Engine)
    if (normProvider === AI_PROVIDERS.GROQ || normProvider === 'grok') {
      const url = 'https://api.groq.com/openai/v1/models';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${cleanKey}` },
        signal: controller.signal
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `Groq API Error (${res.status})`);
      }

      const rawList = data.data || [];
      const priorityOrder = [
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'llama-3.1-8b-instant',
        'llama-3.3-70b-versatile',
        'mixtral-8x7b-32768',
        'gemma2-9b-it'
      ];

      const groqModels = rawList
        .filter(m => {
          const id = (m.id || '').toLowerCase();
          if (/(whisper|audio|vision|guard|distil|allam|orpheus|canopy|arabic)/i.test(id)) return false;
          return true;
        })
        .map(m => {
          let name = m.id;
          if (m.id === 'openai/gpt-oss-120b') name = 'OpenAI GPT-OSS 120B (High Intelligence & Multilingual)';
          else if (m.id === 'openai/gpt-oss-20b') name = 'OpenAI GPT-OSS 20B (Recommended - Fast & Powerful)';
          else if (m.id === 'llama-3.3-70b-versatile') name = 'Llama 3.3 70B Versatile (Recommended - High Speed & Smart)';
          else if (m.id === 'llama-3.1-8b-instant') name = 'Llama 3.1 8B Instant (Ultra-Fast ~200ms)';
          else if (m.id === 'mixtral-8x7b-32768') name = 'Mixtral 8x7B (Broad Context)';
          else if (m.id === 'gemma2-9b-it') name = 'Gemma 2 9B (Google on Groq LPU)';

          return {
            id: m.id,
            name,
            context: '128k tokens',
            isVerified: false
          };
        })
        .sort((a, b) => {
          const idxA = priorityOrder.indexOf(a.id);
          const idxB = priorityOrder.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.id.localeCompare(b.id);
        })
        .slice(0, 6);

      if (groqModels.length === 0) {
        return PROVIDER_MODELS.groq;
      }
      return groqModels;
    }

    // 4. DeepSeek
    if (normProvider === AI_PROVIDERS.DEEPSEEK) {
      const url = 'https://api.deepseek.com/models';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${cleanKey}` },
        signal: controller.signal
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `DeepSeek API Error (${res.status})`);
      }

      const rawList = data.data || [];
      const deepseekModels = rawList.map(m => ({
        id: m.id,
        name: m.id === 'deepseek-chat' ? 'DeepSeek V3 (Chat)' : m.id === 'deepseek-reasoner' ? 'DeepSeek R1 (Reasoner)' : m.id,
        context: '64k tokens',
        isVerified: false
      }));

      if (deepseekModels.length === 0) {
        return [
          { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)', context: '64k tokens', isVerified: false },
          { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)', context: '64k tokens', isVerified: false }
        ];
      }
      return deepseekModels;
    }

    // 5. Anthropic Claude (With explicit permission handling and unverified notice)
    if (normProvider === AI_PROVIDERS.CLAUDE) {
      const url = 'https://api.anthropic.com/v1/models';
      const res = await fetch(url, {
        headers: {
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01'
        },
        signal: controller.signal
      });
      const data = await res.json();

      if (res.ok && Array.isArray(data.data) && data.data.length > 0) {
        return data.data.map(m => ({
          id: m.id,
          name: m.display_name || m.id,
          context: '200k tokens',
          isVerified: false
        }));
      }

      // If Anthropic returns 401 or 403, throw explicit diagnostic error
      if (res.status === 401) {
        throw new Error('Anthropic Claude API Error: Invalid API Key.');
      }
      if (res.status === 403) {
        throw new Error(data.error?.message || 'Anthropic Claude Models API Error: Key lacks workspace models listing permission.');
      }

      throw new Error(data.error?.message || `Claude API Error (${res.status})`);
    }

    throw new Error(`Unsupported AI Provider: ${provider}`);
  } catch (err) {
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      throw new Error(`Timeout: ${provider.toUpperCase()} models API did not respond within 12 seconds.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Live Connection Tester
 * Pings the provider with a 2-token request, measuring latency in milliseconds.
 */
export async function testAiConnection({ provider, model, apiKey }) {
  const normProvider = (provider || 'gemini').toLowerCase().trim();
  const targetModel = model || PROVIDER_MODELS[normProvider]?.[0]?.id;

  const startMs = Date.now();
  try {
    const res = await callUniversalAI({
      provider: normProvider,
      model: targetModel,
      apiKey: (apiKey || '').trim(),
      prompt: 'Respond with exactly the single word "READY".',
      systemInstruction: 'You are an automated API connectivity health checker. Output only READY.',
      maxTokens: 5,
      temperature: 0.1,
      timeoutMs: 40000
    });

    const latencyMs = Date.now() - startMs;
    const responseText = (res.rawText || '').trim();

    return {
      success: true,
      provider: normProvider,
      model: targetModel,
      latencyMs,
      message: `Connection successful! ${normProvider.toUpperCase()} responded in ${latencyMs}ms.`,
      sampleResponse: responseText
    };
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    let friendlyMessage = err.message;
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      friendlyMessage = 'Connection timed out: Server ne samay par uttar nahi diya. Kripya "Gemini 3.5 Flash Lite" chunein ya dubara koshish karein.';
    }
    return {
      success: false,
      provider: normProvider,
      model: targetModel,
      latencyMs,
      message: `Connection failed: ${friendlyMessage}`,
      error: err.message
    };
  }
}
