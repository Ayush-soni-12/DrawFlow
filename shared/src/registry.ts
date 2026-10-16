import { RegistryNodeDefinition } from './index';

export const CURATED_NODE_REGISTRY: RegistryNodeDefinition[] = [
  // --- TRIGGERS ---
  {
    id: 'n8n-nodes-base.webhook',
    name: 'Webhook',
    displayName: 'Webhook Trigger',
    category: 'trigger',
    typeVersion: 1,
    inputs: [],
    outputs: ['main'],
    aliases: [
      'webhook',
      'http trigger',
      'api in',
      'webhook trigger',
      'stripe webhook',
      'github webhook',
      'shopify webhook'
    ],
    icon: 'webhook',
    defaultParameters: {
      httpMethod: 'POST',
      path: 'webhook-trigger',
      responseMode: 'onReceived',
      responseData: 'allEntries'
    }
  },
  {
    id: 'n8n-nodes-base.scheduleTrigger',
    name: 'Schedule Trigger',
    displayName: 'Cron / Schedule',
    category: 'trigger',
    typeVersion: 1.1,
    inputs: [],
    outputs: ['main'],
    aliases: ['schedule', 'cron', 'timer', 'every day', 'interval', 'hourly', 'daily'],
    icon: 'clock',
    defaultParameters: {
      rule: {
        interval: [{ field: 'days', intervalValue: 1 }]
      }
    }
  },
  {
    id: 'n8n-nodes-base.formTrigger',
    name: 'Form Trigger',
    displayName: 'n8n Form Trigger',
    category: 'trigger',
    typeVersion: 2,
    inputs: [],
    outputs: ['main'],
    aliases: ['form', 'form submission', 'typeform', 'tally', 'survey', 'form trigger'],
    icon: 'file-text',
    defaultParameters: {
      formTitle: 'User Input Form',
      formDescription: 'Submit information to trigger automation'
    }
  },
  {
    id: 'n8n-nodes-base.emailReadImap',
    name: 'Email Trigger (IMAP)',
    displayName: 'Email Trigger',
    category: 'trigger',
    typeVersion: 2,
    inputs: [],
    outputs: ['main'],
    aliases: ['email trigger', 'new email', 'incoming email', 'imap', 'gmail trigger'],
    icon: 'mail',
    defaultParameters: {
      action: 'download',
      format: 'resolved'
    }
  },

  // --- ACTIONS & COMMUNICATION ---
  {
    id: 'n8n-nodes-base.slack',
    name: 'Slack',
    displayName: 'Slack Alert / Message',
    category: 'notification',
    typeVersion: 2.1,
    inputs: ['main'],
    outputs: ['main'],
    aliases: [
      'slack',
      'slack message',
      'slack alert',
      'slack notification',
      'post to slack',
      'notify slack'
    ],
    icon: 'message-square',
    defaultParameters: {
      resource: 'message',
      operation: 'post',
      channel: '#general',
      text: 'Notification from DrawFlow workflow'
    }
  },
  {
    id: 'n8n-nodes-base.gmail',
    name: 'Gmail',
    displayName: 'Send Gmail Email',
    category: 'notification',
    typeVersion: 2.1,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['gmail', 'send email', 'email', 'mailer', 'send mail', 'email customer'],
    icon: 'mail',
    defaultParameters: {
      resource: 'message',
      operation: 'send',
      subject: 'Automated Update',
      message: 'Hello, here is your workflow update.'
    }
  },
  {
    id: 'n8n-nodes-base.discord',
    name: 'Discord',
    displayName: 'Discord Webhook / Bot',
    category: 'notification',
    typeVersion: 2,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['discord', 'discord webhook', 'discord channel', 'post discord'],
    icon: 'message-circle',
    defaultParameters: {
      resource: 'message',
      operation: 'send',
      content: 'Alert notification'
    }
  },
  {
    id: 'n8n-nodes-base.telegram',
    name: 'Telegram',
    displayName: 'Telegram Bot',
    category: 'notification',
    typeVersion: 1.1,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['telegram', 'telegram message', 'telegram bot', 'tg alert'],
    icon: 'send',
    defaultParameters: {
      resource: 'message',
      operation: 'sendMessage',
      text: 'Telegram update'
    }
  },
  {
    id: 'n8n-nodes-base.httpRequest',
    name: 'HTTP Request',
    displayName: 'HTTP Request / API Call',
    category: 'action',
    typeVersion: 4.2,
    inputs: ['main'],
    outputs: ['main'],
    aliases: [
      'http',
      'api call',
      'fetch',
      'rest api',
      'curl',
      'webhook out',
      'post request',
      'get request',
      'http request'
    ],
    icon: 'globe',
    defaultParameters: {
      method: 'GET',
      url: 'https://api.example.com/v1/data',
      authentication: 'none'
    }
  },
  {
    id: 'n8n-nodes-base.notion',
    name: 'Notion',
    displayName: 'Notion Database / Page',
    category: 'action',
    typeVersion: 2.2,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['notion', 'notion db', 'notion page', 'add to notion'],
    icon: 'book-open',
    defaultParameters: {
      resource: 'databasePage',
      operation: 'create'
    }
  },
  {
    id: 'n8n-nodes-base.airtable',
    name: 'Airtable',
    displayName: 'Airtable Record',
    category: 'database',
    typeVersion: 2,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['airtable', 'airtable base', 'airtable record', 'insert airtable'],
    icon: 'table',
    defaultParameters: {
      operation: 'append'
    }
  },
  {
    id: 'n8n-nodes-base.hubspot',
    name: 'HubSpot',
    displayName: 'HubSpot CRM',
    category: 'action',
    typeVersion: 1.1,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['hubspot', 'hubspot contact', 'crm sync', 'crm lead'],
    icon: 'users',
    defaultParameters: {
      resource: 'contact',
      operation: 'create'
    }
  },
  {
    id: 'n8n-nodes-base.twilio',
    name: 'Twilio',
    displayName: 'Twilio SMS',
    category: 'notification',
    typeVersion: 1,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['twilio', 'sms', 'send sms', 'text message'],
    icon: 'phone',
    defaultParameters: {
      resource: 'sms',
      operation: 'send',
      message: 'DrawFlow SMS Alert'
    }
  },
  {
    id: 'n8n-nodes-base.github',
    name: 'GitHub',
    displayName: 'GitHub Issue / PR',
    category: 'action',
    typeVersion: 1,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['github', 'create issue', 'github issue', 'open pr', 'github repo'],
    icon: 'github',
    defaultParameters: {
      resource: 'issue',
      operation: 'create',
      title: 'Workflow Ticket'
    }
  },

  // --- DATABASES & STORAGE ---
  {
    id: 'n8n-nodes-base.postgres',
    name: 'PostgreSQL',
    displayName: 'PostgreSQL Database',
    category: 'database',
    typeVersion: 2.4,
    inputs: ['main'],
    outputs: ['main'],
    aliases: [
      'postgres',
      'postgresql',
      'postgres query',
      'sql query',
      'query user db',
      'database',
      'sql'
    ],
    icon: 'database',
    defaultParameters: {
      operation: 'executeQuery',
      query: 'SELECT * FROM users WHERE id = $1;'
    }
  },
  {
    id: 'n8n-nodes-base.mySql',
    name: 'MySQL',
    displayName: 'MySQL Database',
    category: 'database',
    typeVersion: 2.3,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['mysql', 'mysql query', 'mariadb'],
    icon: 'database',
    defaultParameters: {
      operation: 'executeQuery',
      query: 'SELECT * FROM records LIMIT 10;'
    }
  },
  {
    id: 'n8n-nodes-base.googleSheets',
    name: 'Google Sheets',
    displayName: 'Google Sheets Spreadsheet',
    category: 'database',
    typeVersion: 4.4,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['google sheets', 'sheets', 'spreadsheet', 'excel', 'append row', 'google sheet'],
    icon: 'sheet',
    defaultParameters: {
      operation: 'append',
      sheetName: 'Sheet1'
    }
  },
  {
    id: 'n8n-nodes-base.mongoDb',
    name: 'MongoDB',
    displayName: 'MongoDB Document Store',
    category: 'database',
    typeVersion: 1.1,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['mongodb', 'mongo', 'nosql', 'mongo insert'],
    icon: 'database',
    defaultParameters: {
      operation: 'find',
      collection: 'items'
    }
  },
  {
    id: 'n8n-nodes-base.redis',
    name: 'Redis',
    displayName: 'Redis Key-Value Cache',
    category: 'database',
    typeVersion: 1,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['redis', 'cache', 'redis get', 'redis set'],
    icon: 'layers',
    defaultParameters: {
      operation: 'get',
      keyName: 'cache_key'
    }
  },
  {
    id: 'n8n-nodes-base.supabase',
    name: 'Supabase',
    displayName: 'Supabase Database',
    category: 'database',
    typeVersion: 1,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['supabase', 'supabase db', 'supabase table'],
    icon: 'database',
    defaultParameters: {
      tableId: 'profiles',
      operation: 'getAll'
    }
  },

  // --- FLOW CONTROL & GLUE ---
  {
    id: 'n8n-nodes-base.if',
    name: 'If',
    displayName: 'If / Conditional Branch',
    category: 'condition',
    typeVersion: 2,
    inputs: ['main'],
    outputs: ['main', 'main'], // pin 0: true, pin 1: false
    aliases: ['if', 'condition', 'branch', 'check', 'filter condition', 'is true', 'verify'],
    icon: 'git-branch',
    defaultParameters: {
      conditions: {
        options: { caseSensitive: true },
        conditions: [
          {
            id: 'c1',
            leftValue: '={{ $json.id }}',
            rightValue: '',
            operator: { type: 'string', operation: 'notEmpty' }
          }
        ],
        combinator: 'and'
      }
    }
  },
  {
    id: 'n8n-nodes-base.switch',
    name: 'Switch',
    displayName: 'Switch Multi-Branch',
    category: 'condition',
    typeVersion: 3,
    inputs: ['main'],
    outputs: ['main', 'main', 'main', 'main'],
    aliases: ['switch', 'case', 'router', 'multi branch', 'route status'],
    icon: 'shuffle',
    defaultParameters: {
      mode: 'rules',
      rules: { values: [] }
    }
  },
  {
    id: 'n8n-nodes-base.set',
    name: 'Edit Fields (Set)',
    displayName: 'Edit Fields / Formatter',
    category: 'transform',
    typeVersion: 3.3,
    inputs: ['main'],
    outputs: ['main'],
    aliases: [
      'set',
      'edit fields',
      'formatter',
      'transform',
      'map fields',
      'clean payload',
      'shape data'
    ],
    icon: 'edit',
    defaultParameters: {
      mode: 'manual',
      fields: {
        values: [{ name: 'formattedTime', stringValue: '={{ $now }}' }]
      }
    }
  },
  {
    id: 'n8n-nodes-base.code',
    name: 'Code',
    displayName: 'JavaScript / Python Code',
    category: 'transform',
    typeVersion: 2,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['code', 'javascript', 'python', 'script', 'function', 'custom transform', 'run code'],
    icon: 'code',
    defaultParameters: {
      language: 'javaScript',
      jsCode:
        '// Loop over input items and add a new field\nfor (const item of $input.all()) {\n  item.json.processed = true;\n}\nreturn $input.all();'
    }
  },
  {
    id: 'n8n-nodes-base.splitInBatches',
    name: 'Split In Batches',
    displayName: 'Loop & Batch Splitter',
    category: 'transform',
    typeVersion: 3,
    inputs: ['main'],
    outputs: ['main', 'main'],
    aliases: ['batch', 'loop', 'split in batches', 'paginate', 'throttle', 'chunk items'],
    icon: 'repeat',
    defaultParameters: {
      batchSize: 10
    }
  },
  {
    id: 'n8n-nodes-base.aggregate',
    name: 'Aggregate',
    displayName: 'Aggregate Items to Array',
    category: 'transform',
    typeVersion: 1,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['aggregate', 'combine', 'group', 'merge items', 'collect array'],
    icon: 'minimize-2',
    defaultParameters: {
      aggregate: 'aggregateAllItemData'
    }
  },
  {
    id: 'n8n-nodes-base.wait',
    name: 'Wait',
    displayName: 'Wait / Delay',
    category: 'action',
    typeVersion: 1.1,
    inputs: ['main'],
    outputs: ['main'],
    aliases: ['wait', 'delay', 'sleep', 'pause for 5 minutes'],
    icon: 'pause',
    defaultParameters: {
      amount: 5,
      unit: 'minutes'
    }
  },
  {
    id: 'n8n-nodes-base.errorTrigger',
    name: 'Error Trigger',
    displayName: 'Error Trigger Handler',
    category: 'trigger',
    typeVersion: 1,
    inputs: [],
    outputs: ['main'],
    aliases: ['error trigger', 'on error', 'catch', 'error handler', 'workflow error'],
    icon: 'alert-triangle',
    defaultParameters: {}
  }
];
