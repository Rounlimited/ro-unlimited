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
     1. DASHBOARD — Master the Dashboard (5 steps)
     ───────────────────────────────────────────── */
  dashboard: {
    title: 'Master the Dashboard',
    description: 'Learn the essentials of your admin command center.',
    pagePrefix: '/admin',
    steps: [
      {
        target: '[data-admin-header]',
        title: 'Admin Header',
        content:
          'This is your admin header. Your company name and notification bell are always visible here — no matter which page you are on.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="dashboard-stats"]',
        title: 'Key Metrics',
        content:
          'These cards show your key metrics at a glance — hero video status, project count, and active team size.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: 'nav',
        title: 'Navigation Bar',
        content:
          'Swipe up or tap the Menu button to access all features: Estimates, Customers, Vendors, and more.',
        placement: 'top',
        disableBeacon: true,
      },
      {
        target: '[data-tour="notification-bell"]',
        title: 'Notification Bell',
        content:
          'The notification bell alerts you to new intake submissions, emails, and important updates. A red badge means something needs your attention.',
        placement: 'bottom-end',
        disableBeacon: true,
      },
      {
        target: '[data-tour="checklist-cta"]',
        title: 'Launch Checklist',
        content:
          'Your Launch Checklist tracks everything you need to go live. Tap it to see your next action items!',
        placement: 'bottom',
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
        target: '[data-tour="estimate-wizard"]',
        title: 'Estimate Wizard',
        content:
          'The estimate wizard walks you through creating a professional estimate in 8 simple steps. Let\'s preview each one.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-tour="wizard-step-1"]',
        title: 'Step 1 — Customer',
        content:
          'First, select or create a customer. You can search your existing customers or add a new one on the fly.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="wizard-step-2"]',
        title: 'Step 2 — Template',
        content:
          'Choose a template to jumpstart your estimate. Templates come pre-loaded with line items, payment schedules, and disclaimers.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="wizard-step-3"]',
        title: 'Step 3 — Scope of Work',
        content:
          'Define the scope of work. This is the high-level description your customer will see at the top of the estimate.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="wizard-step-4"]',
        title: 'Step 4 — Line Items',
        content:
          'Add individual line items with quantities, units, and costs. Pull from your Cost Library or type custom items.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="wizard-step-5"]',
        title: 'Step 5 — Financials',
        content:
          'Review the financial breakdown: subtotal, overhead, markup, tax, and contingency. Adjust percentages to dial in your price.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="wizard-step-6"]',
        title: 'Step 6 — Payment Schedule',
        content:
          'Set up milestones for payment — e.g., 50% deposit, 25% at rough-in, 25% on completion. Each milestone gets a description and amount.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="wizard-step-7"]',
        title: 'Step 7 — Disclaimers',
        content:
          'Add legal disclaimers, warranty info, and terms. These appear at the bottom of the estimate and protect your business.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="wizard-step-8"]',
        title: 'Step 8 — Review & Send',
        content:
          'Preview the final estimate exactly as your customer will see it. You can download a PDF, email it directly, or copy a shareable link.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Pro Tip: Templates',
        content:
          'Save time by creating templates for your most common job types. Each template stores line items, payment schedules, and disclaimers.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Pro Tip: Cost Library',
        content:
          'Build your Cost Library with materials, labor, and equipment costs. When you add line items, you can pull directly from the library.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'You\'re Ready!',
        content:
          'That covers the estimate workflow. Head to Estimates → New Estimate to build your first one. You can always replay this tour from the Help Center.',
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
        target: '[data-tour="cost-library-header"]',
        title: 'Your Cost Library',
        content:
          'The Cost Library is your central database for materials, labor rates, equipment, and subcontractor costs. Items you add here can be pulled into any estimate.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="cost-library-add"]',
        title: 'Add an Item',
        content:
          'Tap the Add button to create a new cost item. You\'ll enter a name, category, unit of measure, and unit cost.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="cost-library-categories"]',
        title: 'Categories',
        content:
          'Organize items into categories like Materials, Labor, Equipment, or Subcontractor. Filter by category to find items fast.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="cost-library-item"]',
        title: 'Item Details',
        content:
          'Each item shows its name, category, unit, and cost. Tap any item to edit its details or update pricing.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Setting Costs',
        content:
          'Enter your actual cost for each item. This is what YOU pay — not what you charge the customer. Markup is applied separately in the estimate.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Markup Strategy',
        content:
          'In the estimate wizard, you\'ll set an overall markup percentage. Your cost × markup = what the customer pays. Keep costs accurate for true profit tracking.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Linking Vendors',
        content:
          'Associate cost items with vendors from your Vendor directory. This helps track where you source materials and compare pricing.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Using in Estimates',
        content:
          'When building an estimate, you\'ll see a "Pull from Library" option. Select items, set quantities, and they auto-populate with your saved costs.',
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
        target: '[data-tour="templates-header"]',
        title: 'Estimate Templates',
        content:
          'Templates let you pre-build estimates for common job types — bathroom remodel, kitchen reno, roof repair, etc. Start an estimate from a template and customize from there.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="templates-add"]',
        title: 'Create a Template',
        content:
          'Tap New Template to start building. Give it a name and description so you can find it quickly when creating estimates.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="templates-list"]',
        title: 'Your Templates',
        content:
          'All your templates appear here. Tap any template to edit its line items, payment schedule, or disclaimers.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Setting Defaults',
        content:
          'Mark one template as your default. When you create a new estimate, it will auto-load with the default template\'s settings.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Template Line Items',
        content:
          'Add line items from your Cost Library or create custom ones. Set default quantities, units, and descriptions.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Payment Schedules',
        content:
          'Define milestone-based payment schedules. For example: 50% deposit, 25% rough-in, 25% completion. These carry over to every estimate using this template.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Disclaimers & Terms',
        content:
          'Attach disclaimers from your Disclaimers library. Warranty info, liability clauses, and payment terms all live here.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Scope of Work',
        content:
          'Write a default scope-of-work description that auto-fills when using this template. You can always customize it per estimate.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Financial Defaults',
        content:
          'Set default overhead %, markup %, tax rate, and contingency. These pre-populate the financials step of the estimate wizard.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Using Templates',
        content:
          'When creating a new estimate, you\'ll choose a template in Step 2. All its defaults load in — then you just tweak and send!',
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
        title: 'Subtotal',
        content:
          'The subtotal is the sum of all your line item costs × quantities. This represents your raw cost before any adjustments.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Overhead',
        content:
          'Overhead covers your fixed business costs — insurance, office rent, vehicle expenses, tools. Set a percentage (typically 10-20%) that gets added on top of the subtotal.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Markup vs. Margin',
        content:
          'Markup is the percentage added to your cost. Margin is your profit as a percentage of the selling price. A 50% markup = 33% margin. We display both so you always know your true profit.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Tax',
        content:
          'Sales tax is calculated on the customer-facing total (after markup). Set your local tax rate and it auto-calculates on every estimate.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Contingency',
        content:
          'Contingency is a safety buffer (typically 5-10%) for unexpected costs — hidden damage, material price changes, weather delays. It\'s added before tax.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Final Total',
        content:
          'The total is: (Subtotal + Overhead) × (1 + Markup) × (1 + Contingency) + Tax. This is what your customer sees and pays.',
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
        target: '[data-tour="estimates-list"]',
        title: 'Estimate List',
        content:
          'All your estimates appear here with their current status. You can filter by status, search by customer, or sort by date.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '[data-tour="estimate-status"]',
        title: 'Estimate Statuses',
        content:
          'Estimates move through statuses: Draft → Sent → Viewed → Accepted → In Progress → Completed. Each status change is timestamped.',
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Sending via Email',
        content:
          'From the estimate detail page, tap Send to email it directly to your customer. They receive a professional PDF with a link to view it online.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Tracking Views',
        content:
          'When your customer opens the estimate link, the status auto-updates to "Viewed." You\'ll get a notification so you know they\'re looking at it.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Customer Acceptance',
        content:
          'Customers can accept and sign the estimate online. You\'ll get a notification with their digital signature and acceptance timestamp.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Change Orders',
        content:
          'Need to modify an accepted estimate? Create a Change Order that documents what changed, the cost difference, and requires customer approval.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'History Tab',
        content:
          'Every estimate has a History tab showing all activity: created, edited, sent, viewed, accepted, and any change orders. Full audit trail.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: 'body',
        title: 'Ready to Go!',
        content:
          'You now know how to send and track estimates. Create your first one, send it to a customer, and watch the status updates roll in!',
        placement: 'center',
        disableBeacon: true,
      },
    ],
  },
};
