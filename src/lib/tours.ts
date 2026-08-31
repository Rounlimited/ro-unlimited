/**
 * Guided tours — the app pointing at itself and explaining what each thing is.
 *
 * A step targets a real element by `data-tour` attribute. If the element isn't
 * on screen, the step is skipped rather than pointing at nothing, so a tour
 * never breaks when a page changes.
 *
 * Written for JR: plain words, no jargon, and it says WHY a thing exists, not
 * just what it is.
 */

export interface TourStep {
  /** data-tour value to spotlight. Omit for a plain centered card. */
  target?: string;
  title: string;
  body: string;
  /** Send the user to this route before the step runs. */
  route?: string;
  /** Nudge: what to tap to make the target appear (e.g. a tab). */
  hint?: string;
}

export interface Tour {
  id: string;
  title: string;
  blurb: string;
  /** Route this tour starts on. */
  route: string;
  steps: TourStep[];
}

export const TOURS: Tour[] = [
  {
    id: 'tour-whats-new',
    title: 'What Just Got Added',
    blurb: 'Progress tracking, the job log, and reports that write themselves.',
    route: '/admin/estimates',
    steps: [
      {
        title: "Here's what's new",
        body: "Three things: every job now tracks percent complete, you can log what happened each day, and the weekly or monthly report writes itself from that log. Let me show you where each one lives.",
      },
      {
        target: 'track-job',
        title: 'Track a Job',
        body: "For work you never estimated in here. Bid it on paper? Old contract? Tap this, name the job and the customer, list your phases, and you get the same progress tracking and customer reports.",
      },
      {
        target: 'estimate-row',
        title: 'Open any job',
        body: 'Tap a job to open it. Everything new lives inside — the Progress tab and the Reports tab.',
        hint: 'Tap any row in this list.',
      },
    ],
  },
  {
    id: 'tour-progress',
    title: 'Tracking Percent Complete',
    blurb: 'Phases, percentages, and your schedule and budget buttons.',
    route: '/admin/estimates',
    steps: [
      {
        title: 'Percent complete, without the math',
        body: "Open any job and tap the Progress tab. This tour explains what you'll find there.",
      },
      {
        target: 'tab-progress',
        title: 'The Progress tab',
        body: "Everything about where the job stands. Phases, the overall percentage, and your own status buttons.",
        hint: 'Tap the Progress tab.',
      },
      {
        target: 'progress-overall',
        title: 'The number that counts',
        body: "This is weighted by the dollar value of each phase — so finishing a small phase moves it a little, not a lot. If an owner or a bank asks how you got the number, it holds up. On a lump-sum job with no priced line items, every phase counts the same unless you give one a bigger share.",
      },
      {
        target: 'progress-phases',
        title: 'Tap a phase along as you go',
        body: "0, 25, 50, 75, 100. That's the whole job. The phases come from the line items you priced, and you can add your own with the button underneath — Site Prep, Footings, Framing, whatever you actually work.",
      },
      {
        target: 'progress-status',
        title: 'Your status buttons',
        body: "Ahead, On Schedule, Behind — and Under, On Budget, Over. Tap Behind and it asks why with one tap: weather, permits, materials, owner decision, change order, sub. These are yours. Customers never see them.",
      },
    ],
  },
  {
    id: 'tour-log-reports',
    title: 'The Job Log & Reports',
    blurb: 'Tap what happened; the report writes itself.',
    route: '/admin/estimates',
    steps: [
      {
        title: 'Stop typing up reports',
        body: "Open a job and tap the Reports tab. You log what happened as the week goes, then press one button and the report is written.",
      },
      {
        target: 'tab-reports',
        title: 'The Reports tab',
        body: 'The job log lives at the top, the report button underneath, and every report you have sent below that.',
        hint: 'Tap the Reports tab.',
      },
      {
        target: 'log-buttons',
        title: 'Log what happened',
        body: "Work Done, Rain Day, Problem, Milestone, Inspection, Note. A rain day is one tap — no typing at all. Got a day you forgot? Change the date and log it late.",
      },
      {
        target: 'log-entries',
        title: 'Anything you log can be held back',
        body: "Each entry has an ON/OFF. ON means it goes to the customer in the next report. Switch it OFF for something that's yours only.",
      },
      {
        target: 'draft-report',
        title: 'One button writes it',
        body: "It lays out your week day by day, counts the rain days, adds which phases finished and the percent complete, then hands it to you. Change any word you want.",
      },
      {
        target: 'draft-report',
        title: 'Then text it or email it',
        body: "Copy Link puts a short link on your clipboard to text them. Email It sends it. Nothing goes to a customer until you press one of those — the app never sends on its own.",
      },
    ],
  },
  {
    id: 'tour-reporting-clause',
    title: 'Promising Reports in the Contract',
    blurb: 'Pick a schedule once; the clause writes itself.',
    route: '/admin/estimates',
    steps: [
      {
        title: 'Stop writing it in by hand',
        body: "When you build an estimate, the Terms step now has a Progress Reporting box. Pick weekly, every 2 weeks, monthly, daily or at each phase.",
      },
      {
        title: 'It writes its own paragraph',
        body: "Tick what each report covers — work completed, percent complete, photos, what's next — and the proper paragraph goes into the contract and the PDF. You never type it again.",
      },
      {
        title: 'And it reminds you',
        body: "On the schedule you picked, the app drafts the report and tells you it's waiting. It never sends without you.",
      },
    ],
  },
  {
    id: 'tour-options',
    title: 'Letting Customers Pick Options',
    blurb: 'Roof colors, driveway finishes — with photos and prices.',
    route: '/admin/estimates',
    steps: [
      {
        title: 'Give them choices on their link',
        body: "Open any estimate and tap the Options tab. You build groups of choices — roof color, driveway finish, add-ons — each with a photo and a price difference.",
      },
      {
        target: 'tab-options',
        title: 'The Options tab',
        body: 'Add from Presets has ready-made groups for every division we do, already priced. Custom Group builds your own.',
        hint: 'Tap the Options tab.',
      },
      {
        target: 'preview-link',
        title: 'See what they see',
        body: "Preview Link opens the customer's actual page. Their picks update the total live, and lock in when they sign.",
      },
    ],
  },
  {
    id: 'tour-letters',
    title: 'Writing Letters on Letterhead',
    blurb: 'Ask for a letter; get an official PDF.',
    route: '/admin/letters',
    steps: [
      {
        target: 'letter-prompt',
        title: 'Just say what you need',
        body: "Type it the way you'd say it out loud: \"letter to the county asking to release the trench\" or \"notice to the owner that we're delayed on the meter box.\" Plain words are fine.",
      },
      {
        target: 'letter-types',
        title: 'Or start from a common one',
        body: 'Tap one of these and it fills in the kind of letter you need, then you add the detail.',
      },
      {
        target: 'letter-write',
        title: 'It writes it up',
        body: "You get a proper letter — subject line, body, closing — that you can edit like any text before it goes anywhere.",
      },
      {
        target: 'letter-pdf',
        title: 'On your letterhead',
        body: "Download the PDF and it comes out on RO letterhead with your logo, contact details and license list at the bottom. It looks official because it is.",
      },
    ],
  },
];

export const tourById = (id: string) => TOURS.find((t) => t.id === id);

/** Tours worth offering on a given admin route. */
export function toursForRoute(pathname: string): Tour[] {
  if (pathname.startsWith('/admin/letters')) return TOURS.filter((t) => t.id === 'tour-letters');
  if (pathname.startsWith('/admin/estimates')) {
    return TOURS.filter((t) => t.route === '/admin/estimates');
  }
  return TOURS.filter((t) => t.id === 'tour-whats-new');
}
