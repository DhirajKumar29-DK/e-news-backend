/**
 * AI Settings Service (Production Database-First Architecture)
 * Primary Storage: MySQL via Prisma ORM
 * Security: AES-256-GCM Authenticated Encryption for API keys via AI_SETTINGS_ENCRYPTION_KEY
 * Safety: Test-Before-Save Guard and Automatic Legacy JSON Migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { encryptApiKey, decryptApiKey, maskApiKey } from './aiCrypto.js';
import {
  fetchLiveModels,
  testAiConnection as gatewayTestConnection,
  AI_PROVIDERS,
  PROVIDER_MODELS
} from './universalAiGateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE_PATH = path.resolve(__dirname, '../../../config/ai-settings.json');
const BACKUP_FILE_PATH = path.resolve(__dirname, '../../../config/ai-settings.json.backup');

const SUPPORTED_PROVIDERS = ['gemini', 'groq', 'openai', 'claude', 'deepseek'];

let isInitialized = false;

/**
 * Startup Migration & Initialization:
 * Safely migrates existing settings from JSON file to MySQL database on first boot.
 * Creates a backup before touching anything, verifies DB storage and round-trip decryption,
 * and only then cleanses plaintext from the legacy file.
 */
export async function initializeAiSettings() {
  if (isInitialized) return;

  try {
    // 1. Check if MySQL already has system settings
    let systemSetting = await prisma.aiSystemSetting.findFirst();

    if (!systemSetting) {
      console.log('[AISettings] Initializing AI Settings in MySQL Database for first time...');

      // Read legacy config if available
      let legacyData = null;
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        try {
          const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
          legacyData = JSON.parse(raw);
          // Safeguard: Ensure backup exists
          if (!fs.existsSync(BACKUP_FILE_PATH)) {
            fs.copyFileSync(CONFIG_FILE_PATH, BACKUP_FILE_PATH);
          }
        } catch (e) {
          console.warn('[AISettings] Warning reading legacy config file:', e.message);
        }
      }

      const activeProvider = (legacyData?.provider || 'gemini').toLowerCase().trim();
      const globalModel = legacyData?.model || 'gemini-3.5-flash-lite';

      systemSetting = await prisma.aiSystemSetting.create({
        data: {
          activeProvider,
          enabled: legacyData?.enabled ?? true,
          temperature: legacyData?.temperature ?? 0.7,
          maxTokens: legacyData?.maxTokens ?? 4096,
          topP: legacyData?.topP ?? 0.95,
          languageOverride: legacyData?.languageOverride || 'hi',
          customWelcomeGreeting: legacyData?.customWelcomeGreeting || 'नमस्ते! मैं आपका ब्रॉडशीट AI न्यूज़ एडिटर हूँ।'
        }
      });

      // Populate provider configs
      for (const p of SUPPORTED_PROVIDERS) {
        const rawKey = (legacyData?.apiKeys?.[p] || '').trim();
        let encryptedKey = '';
        let isVerified = false;

        if (rawKey && !rawKey.includes('••••')) {
          encryptedKey = encryptApiKey(rawKey);
          // Verify round-trip decryption before committing
          const decryptedCheck = decryptApiKey(encryptedKey);
          if (decryptedCheck === rawKey) {
            isVerified = true;
          } else {
            console.error(`[AISettings] Migration verification failed for provider ${p}!`);
          }
        }

        const selectedModel = p === activeProvider ? globalModel : (PROVIDER_MODELS[p]?.[0]?.id || null);
        const cachedModels = JSON.stringify(PROVIDER_MODELS[p] || []);

        await prisma.aiProviderConfig.upsert({
          where: { provider: p },
          update: {
            encryptedApiKey: encryptedKey || undefined,
            selectedModel,
            cachedModels
          },
          create: {
            provider: p,
            encryptedApiKey: encryptedKey || null,
            selectedModel,
            cachedModels,
            isVerified
          }
        });
      }

      // Safe Cleanse: Once DB commit is verified, overwrite JSON with sanitized status
      try {
        fs.writeFileSync(
          CONFIG_FILE_PATH,
          JSON.stringify({
            migratedToDatabase: true,
            migratedAt: new Date().toISOString(),
            notice: 'Primary AI settings are now permanently stored in MySQL database u963801592_NTPLenews.'
          }, null, 2),
          'utf8'
        );
        console.log('✅ [AISettings] Successfully migrated settings to MySQL and cleansed plaintext JSON file.');
      } catch (fErr) {
        console.warn('[AISettings] Notice updating legacy JSON file:', fErr.message);
      }
    } else {
      // Ensure all supported providers exist in MySQL
      for (const p of SUPPORTED_PROVIDERS) {
        const existing = await prisma.aiProviderConfig.findUnique({ where: { provider: p } });
        if (!existing) {
          await prisma.aiProviderConfig.create({
            data: {
              provider: p,
              selectedModel: PROVIDER_MODELS[p]?.[0]?.id || null,
              cachedModels: JSON.stringify(PROVIDER_MODELS[p] || [])
            }
          });
        }
      }
    }

    isInitialized = true;
  } catch (err) {
    console.error('❌ [AISettings] Failed to initialize AI Settings from MySQL:', err.message);
    throw err;
  }
}

/**
 * Get public sanitized settings for Admin Panel UI
 */
export async function getPublicAiSettings() {
  await initializeAiSettings();

  const systemSetting = await prisma.aiSystemSetting.findFirst() || {
    activeProvider: 'gemini',
    enabled: true,
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.95,
    languageOverride: 'hi'
  };

  const providerConfigs = await prisma.aiProviderConfig.findMany();

  const providers = {};
  for (const p of SUPPORTED_PROVIDERS) {
    const cfg = providerConfigs.find(c => c.provider === p);
    let decryptedKey = '';
    if (cfg?.encryptedApiKey) {
      decryptedKey = decryptApiKey(cfg.encryptedApiKey);
    }

    let parsedModels = [];
    try {
      parsedModels = cfg?.cachedModels ? JSON.parse(cfg.cachedModels) : [];
    } catch {
      parsedModels = [];
    }

    providers[p] = {
      hasApiKey: Boolean(decryptedKey),
      maskedKey: maskApiKey(decryptedKey),
      selectedModel: cfg?.selectedModel || (PROVIDER_MODELS[p]?.[0]?.id || ''),
      cachedModels: parsedModels.length > 0 ? parsedModels : (PROVIDER_MODELS[p] || []),
      isVerified: Boolean(cfg?.isVerified),
      lastTestedAt: cfg?.lastTestedAt || null,
      lastLatencyMs: cfg?.lastLatencyMs || null
    };
  }

  return {
    activeProvider: systemSetting.activeProvider,
    enabled: systemSetting.enabled,
    temperature: systemSetting.temperature,
    maxTokens: systemSetting.maxTokens,
    topP: systemSetting.topP,
    languageOverride: systemSetting.languageOverride,
    customWelcomeGreeting: systemSetting.customWelcomeGreeting,
    providers,
    updatedAt: systemSetting.updatedAt
  };
}

/**
 * Fetch Live Models directly from official provider API using supplied or saved key
 */
export async function fetchProviderModels({ provider, apiKey }) {
  await initializeAiSettings();
  const norm = (provider || 'gemini').toLowerCase().trim();

  let effectiveKey = (apiKey || '').trim();

  // If key is masked or empty, read saved encrypted key from DB
  if (!effectiveKey || effectiveKey.includes('••••')) {
    const cfg = await prisma.aiProviderConfig.findUnique({ where: { provider: norm } });
    if (cfg?.encryptedApiKey) {
      effectiveKey = decryptApiKey(cfg.encryptedApiKey);
    }
    // Fallback to environment variable if present
    if (!effectiveKey && norm === 'gemini') {
      effectiveKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    }
  }

  if (!effectiveKey) {
    throw new Error(`Please provide an API Key for ${norm.toUpperCase()} to fetch available models.`);
  }

  // Call official provider models API
  const liveModels = await fetchLiveModels({ provider: norm, apiKey: effectiveKey });

  // Update cached models in database for fast loading next time
  await prisma.aiProviderConfig.upsert({
    where: { provider: norm },
    update: {
      cachedModels: JSON.stringify(liveModels)
    },
    create: {
      provider: norm,
      cachedModels: JSON.stringify(liveModels)
    }
  });

  return {
    provider: norm,
    models: liveModels
  };
}

/**
 * Live Connection & Model Access Verification Probe
 */
export async function testConnection({ provider, model, apiKey }) {
  await initializeAiSettings();
  const norm = (provider || 'gemini').toLowerCase().trim();

  let effectiveKey = (apiKey || '').trim();
  if (!effectiveKey || effectiveKey.includes('••••')) {
    const cfg = await prisma.aiProviderConfig.findUnique({ where: { provider: norm } });
    if (cfg?.encryptedApiKey) {
      effectiveKey = decryptApiKey(cfg.encryptedApiKey);
    }
    if (!effectiveKey && norm === 'gemini') {
      effectiveKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    }
  }

  if (!effectiveKey) {
    return {
      success: false,
      provider: norm,
      model,
      message: `API Key missing for ${norm.toUpperCase()}. Please enter a valid API key.`
    };
  }

  const result = await gatewayTestConnection({
    provider: norm,
    model,
    apiKey: effectiveKey
  });

  // If probe succeeds, record verification timestamp in MySQL
  if (result.success) {
    await prisma.aiProviderConfig.upsert({
      where: { provider: norm },
      update: {
        isVerified: true,
        lastTestedAt: new Date(),
        lastLatencyMs: result.latencyMs || null,
        selectedModel: model || undefined
      },
      create: {
        provider: norm,
        isVerified: true,
        lastTestedAt: new Date(),
        lastLatencyMs: result.latencyMs || null,
        selectedModel: model || undefined
      }
    });
  }

  return result;
}

/**
 * Save / Update AI Settings with Strict Test-Before-Save Safety Shield
 */
export async function updateAiSettings(updates = {}) {
  await initializeAiSettings();

  const { activeProvider, enabled, temperature, maxTokens, topP, languageOverride, providerUpdates } = updates;

  // 1. Update Global System Settings if supplied
  const sysData = {};
  if (activeProvider && SUPPORTED_PROVIDERS.includes(activeProvider.toLowerCase())) {
    sysData.activeProvider = activeProvider.toLowerCase().trim();
  }
  if (enabled !== undefined) sysData.enabled = Boolean(enabled);
  if (temperature !== undefined) sysData.temperature = Number(temperature);
  if (maxTokens !== undefined) sysData.maxTokens = Number(maxTokens);
  if (topP !== undefined) sysData.topP = Number(topP);
  if (languageOverride !== undefined) sysData.languageOverride = String(languageOverride);

  const existingSys = await prisma.aiSystemSetting.findFirst();
  if (existingSys) {
    await prisma.aiSystemSetting.update({
      where: { id: existingSys.id },
      data: sysData
    });
  } else {
    await prisma.aiSystemSetting.create({
      data: { ...sysData, activeProvider: sysData.activeProvider || 'gemini' }
    });
  }

  // 2. Update Provider Configurations if supplied
  if (providerUpdates && typeof providerUpdates === 'object') {
    for (const [prov, conf] of Object.entries(providerUpdates)) {
      const norm = prov.toLowerCase().trim();
      if (!SUPPORTED_PROVIDERS.includes(norm)) continue;

      const updateData = {};

      // If incoming key is a new plaintext key (not masked and not empty)
      if (conf.apiKey && typeof conf.apiKey === 'string') {
        const cleanKey = conf.apiKey.trim();
        if (cleanKey && !cleanKey.includes('••••')) {
          // TEST-BEFORE-SAVE SERVER-SIDE GUARD:
          // Probe access before writing to database to prevent breaking working configuration!
          const targetModel = conf.selectedModel || PROVIDER_MODELS[norm]?.[0]?.id;
          const probe = await gatewayTestConnection({
            provider: norm,
            model: targetModel,
            apiKey: cleanKey
          });

          if (!probe.success) {
            throw new Error(
              `Cannot save ${norm.toUpperCase()} settings: Connection test failed (${probe.message || probe.error}). ` +
              `Your previous working key has NOT been modified.`
            );
          }

          updateData.encryptedApiKey = encryptApiKey(cleanKey);
          updateData.isVerified = true;
          updateData.lastTestedAt = new Date();
          updateData.lastLatencyMs = probe.latencyMs || null;
        }
      }

      if (conf.selectedModel) {
        updateData.selectedModel = String(conf.selectedModel).trim();
      }

      if (conf.cachedModels && Array.isArray(conf.cachedModels)) {
        updateData.cachedModels = JSON.stringify(conf.cachedModels);
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.aiProviderConfig.upsert({
          where: { provider: norm },
          update: updateData,
          create: {
            provider: norm,
            ...updateData
          }
        });
      }
    }
  }

  console.log(`[AISettings] Successfully updated AI Settings in MySQL.`);
  return await getPublicAiSettings();
}

/**
 * Get active runtime credentials for LLM completions
 * Used by Single Slot AI and Full Page AI in Broadsheet Newsroom.
 */
export async function getActiveAiCredentials() {
  await initializeAiSettings();

  const sys = await prisma.aiSystemSetting.findFirst() || {
    activeProvider: 'gemini',
    enabled: true,
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.95,
    languageOverride: 'hi'
  };

  // If master toggle is disabled, halt immediately!
  if (!sys.enabled) {
    return {
      enabled: false,
      provider: sys.activeProvider,
      model: '',
      apiKey: '',
      temperature: sys.temperature,
      maxTokens: sys.maxTokens,
      topP: sys.topP,
      languageOverride: sys.languageOverride
    };
  }

  const activeProvider = (sys.activeProvider || 'gemini').toLowerCase().trim();
  const cfg = await prisma.aiProviderConfig.findUnique({ where: { provider: activeProvider } });

  let apiKey = '';
  if (cfg?.encryptedApiKey) {
    apiKey = decryptApiKey(cfg.encryptedApiKey);
  }

  // Fallback to environment variable if configured
  if (!apiKey && activeProvider === 'gemini') {
    apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  }

  const model = cfg?.selectedModel || PROVIDER_MODELS[activeProvider]?.[0]?.id || 'gemini-3.5-flash-lite';

  return {
    enabled: true,
    provider: activeProvider,
    model,
    apiKey,
    temperature: sys.temperature,
    maxTokens: sys.maxTokens,
    topP: sys.topP,
    languageOverride: sys.languageOverride
  };
}

/**
 * Safely reveal decrypted key for authenticated Admin inspection
 */
export async function getDecryptedKeyForAdmin(provider) {
  await initializeAiSettings();
  const norm = (provider || 'gemini').toLowerCase().trim();
  const cfg = await prisma.aiProviderConfig.findUnique({ where: { provider: norm } });
  let apiKey = '';
  if (cfg?.encryptedApiKey) {
    apiKey = decryptApiKey(cfg.encryptedApiKey);
  }
  if (!apiKey && norm === 'gemini') {
    apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  }
  return apiKey;
}

