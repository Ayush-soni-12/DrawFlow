import { NodeCategory, RegistryNodeDefinition } from './index';
import { CURATED_NODE_REGISTRY } from './registry';

/**
 * Normalizes an arbitrary handwritten or extracted label into a clean keyword.
 * Examples:
 *   "Shopify Webhook!" -> "shopify webhook"
 *   "Post to Slack"    -> "post to slack"
 *   "Google Sheets"    -> "google sheets"
 */
export function normalizeLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts a string to camelCase for official n8n node identifiers.
 * Examples:
 *   "google sheets" -> "googleSheets"
 *   "airtable"      -> "airtable"
 *   "http request"  -> "httpRequest"
 */
export function toCamelCase(str: string): string {
  const parts = str.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return 'customNode';
  return (
    parts[0].toLowerCase() +
    parts
      .slice(1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('')
  );
}

/**
 * Common service stop words to ignore when extracting the root service name.
 */
/**
 * Common service stop words to ignore when extracting the root service name.
 */
const STOP_WORDS = new Set([
  'trigger',
  'node',
  'api',
  'call',
  'send',
  'post',
  'get',
  'create',
  'update',
  'sync',
  'service',
  'integration',
  'connector',
  'action',
  'step',
  'custom',
  'to',
  'from',
  'with',
  'in',
  'on',
  'payment',
  'checkout',
  'ticket',
  'support',
  'task',
  'record',
  'lead'
]);

/**
 * Recognized official n8n community integrations for high precision mapping.
 */
const RECOGNIZED_COMMUNITY_SERVICES: Record<string, { id: string; category: NodeCategory }> = {
  stripe: { id: 'n8n-nodes-base.stripe', category: 'action' },
  airtable: { id: 'n8n-nodes-base.airtable', category: 'database' },
  zendesk: { id: 'n8n-nodes-base.zendesk', category: 'action' },
  trello: { id: 'n8n-nodes-base.trello', category: 'action' },
  jira: { id: 'n8n-nodes-base.jira', category: 'action' },
  asana: { id: 'n8n-nodes-base.asana', category: 'action' },
  linear: { id: 'n8n-nodes-base.linear', category: 'action' },
  shopify: { id: 'n8n-nodes-base.shopify', category: 'action' },
  paypal: { id: 'n8n-nodes-base.payPal', category: 'action' },
  salesforce: { id: 'n8n-nodes-base.salesforce', category: 'action' },
  mailchimp: { id: 'n8n-nodes-base.mailchimp', category: 'action' },
  sendgrid: { id: 'n8n-nodes-base.sendGrid', category: 'notification' },
  clickup: { id: 'n8n-nodes-base.clickUp', category: 'action' }
};

/**
 * Infers an appropriate NodeCategory from a label or raw text if not explicitly provided.
 */
export function inferCategory(label: string): NodeCategory {
  const lower = label.toLowerCase();

  if (
    lower.includes('trigger') ||
    lower.includes('webhook') ||
    lower.includes('cron') ||
    lower.includes('schedule') ||
    lower.includes('poll') ||
    lower.includes('listener') ||
    lower.includes('form')
  ) {
    return 'trigger';
  }

  if (
    lower.includes('if') ||
    lower.includes('check') ||
    lower.includes('condition') ||
    lower.includes('branch') ||
    lower.includes('switch') ||
    lower.includes('filter')
  ) {
    return 'condition';
  }

  if (
    lower.includes('db') ||
    lower.includes('database') ||
    lower.includes('postgres') ||
    lower.includes('sql') ||
    lower.includes('mongo') ||
    lower.includes('redis') ||
    lower.includes('supabase') ||
    lower.includes('sheet') ||
    lower.includes('table')
  ) {
    return 'database';
  }

  if (
    lower.includes('slack') ||
    lower.includes('email') ||
    lower.includes('gmail') ||
    lower.includes('discord') ||
    lower.includes('telegram') ||
    lower.includes('sms') ||
    lower.includes('notify') ||
    lower.includes('alert') ||
    lower.includes('message')
  ) {
    return 'notification';
  }

  if (
    lower.includes('format') ||
    lower.includes('transform') ||
    lower.includes('set') ||
    lower.includes('code') ||
    lower.includes('script') ||
    lower.includes('clean') ||
    lower.includes('map') ||
    lower.includes('aggregate') ||
    lower.includes('batch')
  ) {
    return 'transform';
  }

  return 'action';
}

/**
 * Resolves any handwritten label into a valid RegistryNodeDefinition.
 * Checks the curated catalog first using exact and alias matching.
 * If not found, dynamically synthesizes a valid n8n node type identifier (n8n-nodes-base.<service>)
 * with safe defaults to guarantee clipboard export never fails.
 */
export function resolveNode(
  label: string,
  categoryOverride?: NodeCategory
): RegistryNodeDefinition {
  const normalized = normalizeLabel(label);
  const words = normalized.split(' ').filter(Boolean);

  // 1. Check exact ID match or name match in curated registry
  for (const def of CURATED_NODE_REGISTRY) {
    if (def.id.toLowerCase() === normalized || def.name.toLowerCase() === normalized) {
      return def;
    }
  }

  // 2. Check curated registry aliases using whole word / phrase boundaries
  const normalizedWords = new Set(words);
  for (const def of CURATED_NODE_REGISTRY) {
    for (const alias of def.aliases) {
      const normAlias = normalizeLabel(alias);
      if (normAlias === normalized) {
        return def;
      }
      // If alias is multi word, check if normalized string contains the exact phrase
      if (normAlias.includes(' ')) {
        const regex = new RegExp(`(^|\\s)${normAlias}(\\s|$)`, 'i');
        if (regex.test(normalized)) {
          return def;
        }
      } else {
        // Single word alias must match an exact word, not a substring of another word
        if (normalizedWords.has(normAlias)) {
          return def;
        }
      }
    }
  }

  // 3. Check recognized community services (e.g. stripe, airtable, zendesk, trello)
  for (const word of words) {
    if (RECOGNIZED_COMMUNITY_SERVICES[word]) {
      const match = RECOGNIZED_COMMUNITY_SERVICES[word];
      const category = categoryOverride || match.category;
      return {
        id: match.id,
        name: label.trim() || word,
        displayName: `${label.trim()} (Community)`,
        category,
        typeVersion: 1,
        inputs: category === 'trigger' ? [] : ['main'],
        outputs: ['main'],
        aliases: [normalized],
        icon: category === 'database' ? 'database' : 'box',
        defaultParameters: {}
      };
    }
  }

  // 4. Fallback: Universal Dynamic Resolution
  // Filter out generic action words to isolate the target service slug
  const serviceTokens = words.filter((w) => !STOP_WORDS.has(w));
  const serviceName = serviceTokens.length > 0 ? serviceTokens.join(' ') : normalized || 'custom';
  const camelSlug = toCamelCase(serviceName);
  const n8nId = `n8n-nodes-base.${camelSlug}`;

  const category = categoryOverride || inferCategory(label);
  const isTrigger = category === 'trigger';

  return {
    id: n8nId,
    name: label.trim() || 'Custom Node',
    displayName: `${label.trim()} (Community / Dynamic)`,
    category,
    typeVersion: 1,
    inputs: isTrigger ? [] : ['main'],
    outputs: ['main'],
    aliases: [normalized],
    icon: isTrigger ? 'play-circle' : category === 'database' ? 'database' : 'box',
    defaultParameters: {}
  };
}

/**
 * Returns all registered curated node definitions.
 */
export function getAllCuratedNodes(): RegistryNodeDefinition[] {
  return [...CURATED_NODE_REGISTRY];
}
