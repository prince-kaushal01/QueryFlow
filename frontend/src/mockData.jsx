// mockData.js
// small realistic dataset used by Inbox + Analytics
export const initialQueries = [
  {
    id: '1',
    subject: 'Product not working as expected',
    content: 'I purchased your premium plan yesterday but the advanced features are not showing up in my dashboard. Can you help?',
    channel: 'email',
    type: 'complaint',
    priority: 'urgent',
    status: 'new',
    sender_name: 'Sarah Johnson',
    sender_email: 'sarah.j@example.com',
    tags: ['premium', 'dashboard', 'features'],
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m ago
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    history: [{ timestamp: new Date().toISOString(), action: 'Query received', user: 'System' }]
  },
  {
    id: '2',
    subject: 'How do I integrate with Zapier?',
    content: 'Looking to automate workflows. Do you have Zapier integration? What steps are required?',
    channel: 'webchat',
    type: 'question',
    priority: 'low',
    status: 'open',
    sender_name: 'Mike Chen',
    sender_email: 'mike.chen@mail.com',
    tags: ['integration','zapier'],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    history: []
  },
  {
    id: '3',
    subject: 'Feature request: Dark mode',
    content: 'It would be great to have dark mode. Many of our team members prefer it for night work.',
    channel: 'email',
    type: 'request',
    priority: 'low',
    status: 'new',
    sender_name: 'Pooja Sharma',
    sender_email: 'pooja@company.com',
    tags: ['feature','ux','dark-mode'],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    history: []
  },
  {
    id: '4',
    subject: 'App crashes on Android 13',
    content: 'App crashes during startup on Android 13. Stack trace attached.',
    channel: 'twitter',
    type: 'complaint',
    priority: 'high',
    status: 'in_progress',
    sender_name: 'Gaurav',
    sender_email: '@gaurav',
    tags: ['bug','android'],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updated_at: new Date().toISOString(),
    history: [{ timestamp: new Date().toISOString(), action: 'Assigned to Mobile Team', user: 'Agent A' }]
  },
  {
    id: '5',
    subject: 'Invoice for October',
    content: 'Can you send invoice for Oct? I need it for accounting.',
    channel: 'email',
    type: 'request',
    priority: 'medium',
    status: 'resolved',
    sender_name: 'Sahil',
    sender_email: 'sahil@mail.com',
    tags: ['billing','invoice'],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    history: [{ timestamp: new Date().toISOString(), action: 'Invoice sent', user: 'Billing' }]
  }
  // add more if you want
];
