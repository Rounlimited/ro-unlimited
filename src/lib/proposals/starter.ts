import type { ProposalContent } from './types';

// Starter content — the RO Unlimited "Infrastructure First" plan.
// New proposals seed from this so there's always a working example.

export function starterContent(): ProposalContent {
  return {
    brandFrom: 'NexaVision Group',
    preparedFor: 'Prepared for JR',
    heroLines: ['The best', 'work gets', 'buried.'],
    heroSub: 'Water mains. Sewer taps. Stormwater. Site development. Nobody sees it when it\u2019s done \u2014 but every building in the Upstate stands on it. You self-perform all of it. This plan puts that front and center on rounlimited.com.',
    gradeLeft: '\u25BC Existing grade',
    gradeRight: 'Scroll down to dig in',
    footerLeft: 'NexaVision Group',
    footerRight: 'Show up. Build right. Stand behind it.',
    sections: [
      {
        kind: 'quotes',
        depth: 'Depth \u22122 FT \u00B7 The call',
        title: 'What you told us',
        intro: 'Here\u2019s your ask, played back so we know we heard it right:',
        quotes: [
          { who: 'JR \u00B7 Voice note 1', text: 'Focus on complete new construction, site and infrastructure development. Grading license, water & sewer license, Tier 2 septic & grease trap. Tapping mains, ductile pipe, stormwater. Tuck the small residential stuff away \u2014 no more dog doors and toilet swaps.' },
          { who: 'JR \u00B7 Voice note 2', text: 'Perfect scenario: get the commercial job, do all the site work and infrastructure in-house, then build it \u2014 subbing the rest depending on size. Really big jobs, full sub-out. That\u2019s why I worked so hard for these licenses.' },
        ],
        paragraphs: [
          'Translation: **RO Unlimited is a self-performing sitework and infrastructure contractor that also delivers the building.** The dirt, the pipe, the taps, the septic \u2014 that stays in-house, under your licenses, on your equipment. The vertical gets built with subs scaled to the job.',
          'That\u2019s the exact pitch developers want to hear. Site delays are where commercial schedules die \u2014 ==a GC who self-performs his own sitework controls the critical path instead of chasing a sub for it.== The turnkey civil players in Charleston win on this message. Nobody owns it in the Upstate yet. You will.',
        ],
      },
      {
        kind: 'cards',
        depth: 'Depth \u22124 FT \u00B7 The lineup',
        title: 'The new divisions',
        intro: 'Front page leads with what you self-perform. Buildings second. Small residential goes in the back room \u2014 still there, just not on the sign.',
        cards: [
          { tag: 'Lead division \u00B7 Self-performed', title: 'Site Development & Grading', body: 'The front door. Everything from raw land to pad-ready \u2014 your crews, your iron.', items: ['Clearing & mass grading', 'Stormwater & erosion control', 'Building pads & site balancing'], lead: true },
          { tag: 'Lead division \u00B7 Self-performed', title: 'Underground Utilities', body: 'The license moat. Most competitors can\u2019t legally touch this \u2014 and you never wait on a sub for it.', items: ['Water main taps & ductile iron / C900 runs', 'Sanitary sewer & storm drainage', 'Tier 2 septic systems & commercial grease traps'], lead: true },
          { tag: 'Stays \u00B7 Sharpened', title: 'Commercial Construction', body: 'Ground-up builds on sites RO already developed. Sitework and infrastructure self-performed; the vertical delivered with subs scaled to the job. One contract, one throat to choke.' },
          { tag: 'Demoted \u00B7 Kept for SEO', title: 'Residential', body: 'Custom homes stay as one quiet page \u2014 off the main nav, still findable by referrals and Google. The repair-level stuff (doors, toilets) comes off the site entirely.', demoted: true },
        ],
        footnote: '**Your licenses go on the site \u2014 visibly.** Banks and developers verify them before they call. It\u2019s free credibility sitting in your wallet.',
        licenses: [
          { label: 'Grading License', num: '\u2116 pending from JR' },
          { label: 'Water & Sewer License', num: '\u2116 pending from JR' },
          { label: 'Tier 2 Septic / Grease Trap', num: '\u2116 pending from JR' },
        ],
      },
      {
        kind: 'phases',
        depth: 'Depth \u22126 FT \u00B7 The dig schedule',
        title: 'How we roll it out',
        phases: [
          { n: 1, title: 'New division pages', body: 'Site Development and Underground Utilities pages built and written. Licenses displayed. Residential moved to the back.', note: 'Needs: license numbers from you' },
          { n: 2, title: 'Homepage re-lead', body: 'Hero, nav, and messaging flip to infrastructure-first: "We self-perform the sitework. First cut to final tap, in-house."', note: 'Needs: photos of your own work \u2014 pipe in the trench, taps, pads' },
          { n: 3, title: 'Proof layer', body: 'Sitework gallery built entirely from your own jobs. Underground work photographed before backfill is the whole sales pitch \u2014 thirty seconds with your phone at every trench, tap, and tank from here on.', note: 'Ongoing \u2014 your jobs only, shot before it\u2019s buried' },
        ],
      },
      {
        kind: 'approve',
        depth: 'Bedrock \u00B7 Your call',
        title: 'Green-light it',
        intro: 'Three things we need from you to break ground:',
        asks: [
          'A yes on the division lineup above.',
          'Your license numbers (grading, water/sewer, Tier 2).',
          'Any photos of underground work before backfill.',
        ],
        questions: [
          { id: 'divisions', question: 'Utilities and septic: separate divisions, or one "Site & Infrastructure" umbrella?', type: 'choice', options: ['Separate divisions', 'One umbrella', 'You decide'] },
        ],
        approveLabel: 'Approve \u2014 break ground',
        allowComment: true,
      },
    ],
  };
}
