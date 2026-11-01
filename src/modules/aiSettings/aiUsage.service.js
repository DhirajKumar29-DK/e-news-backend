/**
 * AI Token Usage & Daily Quota Tracking Service
 * Tracks prompt, completion, and total tokens per AI provider per day in Asia/Kolkata timezone.
 * Provides quota specs and remaining allowance metrics for Admin UI.
 */

import { prisma } from '../../config/db.js';

export const PROVIDER_QUOTA_SPECS = {
  groq: {
    quotaType: 'DAILY',
    name: 'Groq (GroqCloud)',
    dailyQuotaTokens: 500000,
    dailyQuotaLabel: '5,00,000 Tokens/Day',
    resetSchedule: 'Every 24h at 5:30 AM IST (Daily Free Reset)',
    billingType: 'Free Tier (TPD: Tokens Per Day)',
    quotaBadge: 'Daily Free Tier',
    isFree: true
  },
  gemini: {
    quotaType: 'DAILY',
    name: 'Google Gemini',
    dailyQuotaTokens: 1000000,
    dailyQuotaRequests: 1500,
    dailyQuotaLabel: '1,500 Requests/Day (~10L Tokens)',
    resetSchedule: 'Every 24h at 5:30 AM IST (Daily Free Reset)',
    billingType: 'Free Tier (1500 RPD / 1M TPM)',
    quotaBadge: 'Daily Free Tier',
    isFree: true
  },
  openai: {
    quotaType: 'WALLET',
    name: 'OpenAI (ChatGPT)',
    dailyQuotaTokens: null,
    dailyQuotaLabel: 'Prepaid Wallet Balance',
    resetSchedule: 'Pay-as-you-go (Deposit Balance)',
    billingType: 'Prepaid Credit / Card Billing',
    quotaBadge: 'Pay-As-You-Go',
    isFree: false
  },
  deepseek: {
    quotaType: 'WALLET',
    name: 'DeepSeek',
    dailyQuotaTokens: null,
    dailyQuotaLabel: 'Prepaid Wallet Balance',
    resetSchedule: 'Pay-as-you-go (Deposit Balance)',
    billingType: 'Prepaid Credit',
    quotaBadge: 'Pay-As-You-Go',
    isFree: false
  },
  claude: {
    quotaType: 'WALLET',
    name: 'Anthropic Claude',
    dailyQuotaTokens: null,
    dailyQuotaLabel: 'Prepaid Wallet Balance',
    resetSchedule: 'Pay-as-you-go (Deposit Balance)',
    billingType: 'Prepaid Credit',
    quotaBadge: 'Pay-As-You-Go',
    isFree: false
  }
};

/**
 * Record token usage atomically in MySQL for today (Asia/Kolkata date)
 */
export async function recordAiTokenUsage({
  provider = 'groq',
  promptTokens = 0,
  completionTokens = 0,
  totalTokens = 0
}) {
  try {
    const norm = String(provider || 'groq').toLowerCase().trim();
    // Use ISO string for today in Indian Standard Time (IST)
    const todayKolkata = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const pTokens = Math.max(0, parseInt(promptTokens, 10) || 0);
    const cTokens = Math.max(0, parseInt(completionTokens, 10) || 0);
    const safeTotal = Math.max(pTokens + cTokens, parseInt(totalTokens, 10) || (pTokens + cTokens));

    await prisma.aiDailyUsage.upsert({
      where: {
        provider_date: {
          provider: norm,
          date: todayKolkata
        }
      },
      update: {
        requestCount: { increment: 1 },
        promptTokens: { increment: pTokens },
        completionTokens: { increment: cTokens },
        totalTokens: { increment: safeTotal }
      },
      create: {
        provider: norm,
        date: todayKolkata,
        requestCount: 1,
        promptTokens: pTokens,
        completionTokens: cTokens,
        totalTokens: safeTotal
      }
    });
  } catch (err) {
    console.warn('[AIUsage] recordAiTokenUsage non-blocking error:', err.message);
  }
}

/**
 * Get comprehensive token usage analytics for the Admin Panel
 */
export async function getAiTokenUsageStats({ provider = null } = {}) {
  const sys = await prisma.aiSystemSetting.findFirst();
  const activeProvider = (sys?.activeProvider || 'groq').toLowerCase().trim();
  const targetProvider = (provider || activeProvider).toLowerCase().trim();
  const todayKolkata = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  // 1. Fetch today's record for target provider
  const todayRecord = await prisma.aiDailyUsage.findUnique({
    where: {
      provider_date: {
        provider: targetProvider,
        date: todayKolkata
      }
    }
  });

  // 2. Fetch all providers today summary
  const allToday = await prisma.aiDailyUsage.findMany({
    where: { date: todayKolkata }
  });

  // 3. Lifetime totals for target provider
  const lifetime = await prisma.aiDailyUsage.aggregate({
    where: { provider: targetProvider },
    _sum: {
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
      requestCount: true
    }
  });

  const spec = PROVIDER_QUOTA_SPECS[targetProvider] || PROVIDER_QUOTA_SPECS.groq;
  const todayTokens = todayRecord?.totalTokens || 0;
  const promptTokens = todayRecord?.promptTokens || 0;
  const completionTokens = todayRecord?.completionTokens || 0;
  const requestCount = todayRecord?.requestCount || 0;

  const quotaLimit = spec.dailyQuotaTokens || null;
  const percentageUsed = quotaLimit
    ? Math.min(100, Number(((todayTokens / quotaLimit) * 100).toFixed(1)))
    : null;

  return {
    provider: targetProvider,
    activeProvider,
    date: todayKolkata,
    today: {
      tokensUsed: todayTokens,
      promptTokens,
      completionTokens,
      requestCount,
      percentageUsed,
      quotaLimit,
      remainingTokens: quotaLimit ? Math.max(0, quotaLimit - todayTokens) : null
    },
    quotaSpec: spec,
    lifetime: {
      totalTokens: lifetime._sum.totalTokens || todayTokens,
      totalRequests: lifetime._sum.requestCount || requestCount
    },
    allProvidersToday: allToday.reduce((acc, row) => {
      acc[row.provider] = {
        tokensUsed: row.totalTokens,
        requestCount: row.requestCount
      };
      return acc;
    }, {})
  };
}

