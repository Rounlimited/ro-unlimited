import type { Step } from 'react-joyride';

export interface TourDefinition {
  title: string;
  description: string;
  /** If set, the tour only renders when pathname starts with this value */
  pagePrefix?: string;
  steps: Step[];
}

export const TOUR_DEFINITIONS: Record<string, TourDefinition> = {
  /* ─────────────────────────────────────────────
     1. DASHBOARD — Master the Dashboard (9 steps)
     Comprehensive tour of every dashboard element
     ───────────────────────────────────────────── */
  dashboard: {
    title: 'Master the Dashboard',
    description: 'Learn the essentials of your admin command center.',
    pagePrefix: '/admin',
    steps: [
      {
        target: 'body',
        title: 'Welcome to Your Command Center',
        content:
          'This is your admin dashboard — the hub of your entire operation. Let\'s walk through everything you can do from right here.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-admin-header]',
        title: 'Admin Header',
        content:
          'Your header is always visible on every page. It shows the RO Unlimited logo (tap it to come back here) and your notification bell for alerts.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="notification-bell"]',
        title: 'Notification Bell',
        content:
          'This bell alerts you when something needs attention — new employee intake submissions, incoming emails, and system updates. A red badge means you have unread notifications.',
        placement: 'bottom-end',
        disableBeacon: true,
      },
      {
        target: '[data-tour="dashboard-stats"]',
        title: 'Key Metrics',
        content:
          'Your at-a-glance stats: Hero video status (is your homepage video live?), project count, and active team size. These update in real-time.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="hero-buttons"]',
        title: 'Email & Team',
        content:
          'Quick access to your two most-used features. Email shows your live unread count with a pulsing badge. Team takes you to employee management, onboarding, and performance reviews.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="quick-actions"]',
        title: 'Quick Actions',
        content:
          'One-tap shortcuts to Portfolio (your project gallery), Site Editor (video and content controls), and Settings (accounts, team access, email configuration).',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="system-status"]',
        title: 'System Status',
        content:
          'Live system health at a glance. Website uptime, email system status, and team activity. Green means everything\'s running smooth.',
        placement: 'top',
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-bar"]',
        title: 'Navigation Bar',
        content:
          'Your main navigation lives here at the bottom. Swipe up on the handle to open the full app drawer with ALL features — Estimates, Customers, Vendors, Cost Library, Help Center, and everything else.',
        placement: 'top',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'You\'re All Set!',
        content:
          'That\'s your dashboard! Open the app drawer and tap Estimates to start creating professional construction estimates. You can replay this tour anytime from the Help Center.',
        placement: 'center',
        disableBeacon: true,
      },
    ],
  },

  /* ─────────────────────────────────────────────
     2. FIRST ESTIMATE — Create Your First Estimate (12 steps)
     ───────────────────────────────────────────── */
  first_estimate: {
    title: 'Create Your First Estimate',
    description: 'Walk through the estimate wizard step by step.',
    pagePrefix: '/admin/estimates',
    steps: [
      {
        target: 'body',
        title: 'Estimate Wizard',
        content:
          'The estimate wizard walks you through creating a professional estimate in 8 simple steps. Let\'s preview each one.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Step 1 — Customer & Project',
        content:
          'First, select or create a customer. Then set the project type, division, and address. You can search existing customers or add a new one on the fly.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Step 2 — Template',
        content:
          'Choose a template to jumpstart your estimate. Templates come pre-loaded with line items, payment schedules, and disclaimers. Or start blank.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Step 3 — Scope of Work',
        content:
          'Define the scope using the rich text editor. Bold, lists, links — make it professional. This is what your customer reads first.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Step 4 — Line Items',
        content:
          'The heart of your estimate. Add items grouped by phase (Demolition, Framing, Electrical, etc). Pull from your Cost Library or type custom items. Set quantities, units, and costs.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Step 5 — Financials',
        content:
          'Set overhead, markup, tax, permit fees, and contingency percentages. Watch the total update in real-time. The margin/markup converter shows your true profit.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Step 6 — Payment Schedule',
        content:
          'Define payment milestones — deposit, rough-in, completion. Use quick presets (50/50, 3-way) or customize. Must add up to 100%.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Step 7 — Terms & Disclaimers',
        content:
          'Select which legal disclaimers to include. 5 are auto-checked by default. Add exclusions for what\'s NOT included in the estimate.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Step 8 — Review & Send',
        content:
          'Preview everything, save as draft, generate a PDF, or email it directly to your customer. They receive a professional branded estimate.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Pro Tip: Templates Save Time',
        content:
          'Create templates for your most common jobs. Each template stores line items, payment schedules, and disclaimers. New estimates take minutes instead of hours.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Pro Tip: Cost Library',
        content:
          'Build your Cost Library with materials, labor, and equipment costs. When adding line items, pull directly from the library with accurate pricing.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'You\'re Ready!',
        content:
          'Head to Estimates → New Estimate to build your first one. You can replay this tour anytime from the Help Center.',
        placement: 'center',
        disableBeacon: true,
      },
    ],
  },

  /* ─────────────────────────────────────────────
     3. COST LIBRARY — Set Up Cost Library (8 steps)
     ───────────────────────────────────────────── */
  cost_library: {
    title: 'Set Up Cost Library',
    description: 'Build your reusable library of materials, labor, and equipment costs.',
    pagePrefix: '/admin/cost-library',
    steps: [
      {
        target: 'body',
        title: 'Your Cost Library',
        content:
          'The Cost Library is your central database for materials, labor rates, equipment, and subcontractor costs. Items you add here can be pulled into any estimate.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Adding Items',
        content:
          'Tap "Add Item" to create a new cost entry. Enter a name, pick a category (Material, Labor, Equipment, Subcontractor), set the unit of measure and cost.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Categories',
        content:
          'Organize items into categories. Filter by category using the tabs at the top to find items quickly when building estimates.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Setting Costs',
        content:
          'Enter YOUR actual cost for each item — what you pay, not what you charge. Markup is applied separately in the estimate wizard.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Default Markup',
        content:
          'Set a default markup percentage per item. When pulled into an estimate, this markup auto-applies. You can always override it per estimate.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Trades',
        content:
          'Tag items with a trade — Electrical, Plumbing, Framing, Concrete, etc. This helps organize items and filter by specialty.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Linking Vendors',
        content:
          'Associate cost items with vendors from your Vendor directory. Track where you source materials and compare pricing over time.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Using in Estimates',
        content:
          'In the estimate wizard Step 4, click "Add from Library" to search and select items. They auto-populate with your saved costs and markup. Fast and accurate.',
        placement: 'center',
        disableBeacon: true,
      },
    ],
  },

  /* ─────────────────────────────────────────────
     4. TEMPLATES — Customize Templates (10 steps)
     ───────────────────────────────────────────── */
  templates: {
    title: 'Customize Templates',
    description: 'Create reusable estimate templates for your most common job types.',
    pagePrefix: '/admin/templates',
    steps: [
      {
        target: 'body',
        title: 'Estimate Templates',
        content:
          'Templates let you pre-build estimates for common job types — bathroom remodel, kitchen reno, roof repair. Start an estimate from a template and customize from there.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Creating a Template',
        content:
          'Tap "Create Template" to start. Give it a name, description, and select the division and estimate type it applies to.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Default Percentages',
        content:
          'Set default overhead, markup, tax, and contingency percentages. These auto-fill the Financials step when using this template.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Template Line Items',
        content:
          'Add default line items with phase, description, category, unit, and cost. These pre-populate Step 4 of the wizard.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Payment Schedules',
        content:
          'Define milestone-based payment schedules — deposit, rough-in, completion. These carry over to every estimate using this template.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Disclaimers',
        content:
          'Select which disclaimers auto-include when this template is used. Different job types may need different legal protections.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Exclusions',
        content:
          'Write default exclusion text — what\'s NOT included. Common: permits, engineering, landscaping, appliances. Customize per estimate.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Duplicating Templates',
        content:
          'Use the duplicate button to clone a template. Great for creating variations — "Kitchen Remodel (Standard)" vs "Kitchen Remodel (Premium)".',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Active vs Inactive',
        content:
          'Toggle templates active or inactive. Inactive templates won\'t show up in the wizard but are kept for reference.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Using Templates',
        content:
          'When creating a new estimate, Step 2 shows your templates filtered by division. Select one and all defaults load in — then just tweak and send!',
        placement: 'center',
        disableBeacon: true,
      },
    ],
  },

  /* ─────────────────────────────────────────────
     5. FINANCIALS — Understanding Financials (6 steps)
     ───────────────────────────────────────────── */
  financials: {
    title: 'Understanding Financials',
    description: 'Learn how costs, markup, and margins work in your estimates.',
    steps: [
      {
        target: 'body',
        title: 'How Pricing Works',
        content:
          'Your estimate total is built up from raw costs through several layers. Let\'s break down each one so you know exactly where your profit comes from.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Subtotal',
        content:
          'The subtotal is the sum of all line item costs × quantities. This is your raw material + labor + equipment cost before any business expenses.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Overhead (10-20%)',
        content:
          'Overhead covers your fixed business costs — insurance, office rent, vehicle expenses, tools, admin staff. Industry standard is 10-20% of subtotal.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Markup vs. Margin',
        content:
          'Markup is added ON TOP of cost: 25% markup on $100 = $125. Margin is profit as % of sale price: $25 profit on $125 = 20% margin. A 50% markup = 33% margin. We show both.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Tax & Contingency',
        content:
          'Sales tax applies to the customer total. Contingency (5-10%) is your safety buffer for surprises — hidden damage, price changes, weather delays.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Your Total',
        content:
          'Final formula: Subtotal + Overhead + Markup + Tax + Permit Fees + Contingency = Total. A healthy GC margin is 8-15%. The wizard shows this in real-time.',
        placement: 'center',
        disableBeacon: true,
      },
    ],
  },

  /* ─────────────────────────────────────────────
     6. SEND & TRACK — Send and Track Estimates (8 steps)
     ───────────────────────────────────────────── */
  send_track: {
    title: 'Send & Track Estimates',
    description: 'Learn how to send estimates and track customer responses.',
    pagePrefix: '/admin/estimates',
    steps: [
      {
        target: 'body',
        title: 'Estimate Lifecycle',
        content:
          'Every estimate follows a lifecycle: Draft → Sent → Viewed → Accepted (or Declined/Expired). Let\'s walk through each stage.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Draft Status',
        content:
          'New estimates start as Drafts. You can edit, save, and come back to them anytime. Nothing is sent to the customer until you\'re ready.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Sending via Email',
        content:
          'Click Send from the estimate detail page. Choose which @rounlimited.com account to send from, add a personal message, and hit Send. The customer gets a professional branded email.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Tracking Views',
        content:
          'When your customer opens the estimate, the status updates to "Viewed" with a timestamp. You\'ll know they\'re looking at it.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Acceptance & Signatures',
        content:
          'Customers can accept and digitally sign. You get a notification with their signature and timestamp. The estimate moves to "Accepted" status.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Change Orders',
        content:
          'Need to modify an accepted estimate? Create a Change Order that documents what changed, the cost difference, and requires new customer approval.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'History & Audit Trail',
        content:
          'Every estimate has a History tab showing all activity — created, edited, sent, viewed, accepted, plus any change orders. Full accountability.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Ready to Go!',
        content:
          'Create your first estimate, send it, and watch the status updates roll in. You can replay this tour anytime from the Help Center.',
        placement: 'center',
        disableBeacon: true,
      },
    ],
  },
};
