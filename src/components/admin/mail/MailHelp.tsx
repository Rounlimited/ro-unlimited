"use client";

/**
 * "How to use Mail": the plain-English guide inside the RO mail client (AdminInbox → Menu → How to use Mail,
 * or the Help button above the list). Written for someone who has never used a phone mail app with swipes.
 * Big type (18px body), short sections with a picture each. Numbers here must match the code:
 * Trash 30 days (api/cron/email-cleanup), Spam 90 days (api/email/inbound), attachments 15 MB / 30 MB.
 */

import {
  Inbox, Star, Send, Archive, FileEdit, AlertOctagon, Trash2, Hand, CheckCircle2, Folder, ListFilter, ShieldAlert,
  Search, Reply, Paperclip, Eye, Bell, LayoutDashboard, Sun, Moon, RefreshCw, Zap, Mail, Play, MoreVertical,
} from "lucide-react";

type Acct = { email: string; display_name: string; color: string; is_default?: boolean };

const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

function Section({ id, icon: I, title, children }: { id: string; icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section id={`help-${id}`} className="rounded-2xl border border-mail-line/15 bg-mail-panel p-4 sm:p-5 scroll-mt-3">
      <h3 className="flex items-center gap-3 text-[21px] font-bold text-mail-text leading-tight">
        <span className="w-11 h-11 rounded-full bg-mail-gold/15 text-mail-gold flex items-center justify-center shrink-0"><I size={22} /></span>
        {title}
      </h3>
      <div className="mt-3 space-y-3 text-[18px] leading-relaxed text-mail-text">{children}</div>
    </section>
  );
}

/** one line of a "picture + words" list */
function Row({ icon: I, name, children, tone }: { icon: React.ElementType; name: string; children: React.ReactNode; tone?: "danger" | "ok" | "gold" }) {
  return (
    <div className="flex items-start gap-3">
      <I size={22} className={cn("shrink-0 mt-1", tone === "danger" ? "text-mail-danger" : tone === "ok" ? "text-mail-ok" : "text-mail-gold")} />
      <p><b>{name}</b>: {children}</p>
    </div>
  );
}

const TOPICS: [string, string][] = [
  ["swipe", "Swiping"], ["select", "Picking several"], ["where", "Archive, Trash or Spam?"], ["folders", "Folders"],
  ["mailboxes", "Mailboxes"], ["filters", "Folders & filters"], ["block", "Blocking"], ["search", "Search"],
  ["star", "Starring"], ["reply", "Reply & forward"], ["files", "Attachments"], ["tracking", "Did they read it?"], ["more", "Everything else"],
];

export default function MailHelp({ accounts, hintOn, onHintChange, onShowSwipe, light, onToggleTheme }: {
  accounts: Acct[]; hintOn: boolean; onHintChange: (on: boolean) => void; onShowSwipe: () => void; light: boolean; onToggleTheme: () => void;
}) {
  const jump = (id: string) => { try { document.getElementById(`help-${id}`)?.scrollIntoView({ block: "start", behavior: "smooth" }); } catch { /* ignore */ } };
  const btn = "inline-flex items-center gap-2 min-h-[52px] px-5 rounded-full text-[17px] font-bold";
  return (
    <div className="px-3 sm:px-5 py-4 space-y-4 max-w-2xl mx-auto pb-16" data-mail-help>
      {/* The one-minute version */}
      <section className="rounded-2xl border border-mail-gold/50 bg-mail-gold/10 p-4 sm:p-5">
        <h3 className="text-[22px] font-bold text-mail-text">Mail in one minute</h3>
        <ul className="mt-2 space-y-2 text-[18px] leading-relaxed text-mail-text list-disc pl-6">
          <li><b>Tap</b> an email to read it.</li>
          <li><b>Slide it left</b> to put it away (Archive). <b>Slide it right</b> to mark it read or unread.</li>
          <li>Tap the gold <b>Compose</b> button to write a new email.</li>
          <li>Every button has its name under it. <b>More</b> (<MoreVertical size={17} className="inline -mt-1" />) holds the extra choices.</li>
          <li>Made a mistake? Tap <b>Undo</b> on the bar that pops up at the bottom.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={onShowSwipe} className={cn(btn, "bg-mail-gold text-mail-ink")}><Play size={19} /> Show me the swipe</button>
          <button onClick={() => onHintChange(!hintOn)} role="switch" aria-checked={hintOn}
            className={cn(btn, "border border-mail-line/25 text-mail-text font-semibold bg-mail-panel")}>
            <Hand size={19} /> Swipe tip when Mail opens: {hintOn ? "On" : "Off"}
          </button>
        </div>
      </section>

      {/* Contents */}
      <nav aria-label="Topics" className="flex flex-wrap gap-2">
        {TOPICS.map(([id, label]) => (
          <button key={id} onClick={() => jump(id)} className="min-h-[44px] px-4 rounded-full border border-mail-line/20 bg-mail-panel text-[16px] font-semibold text-mail-text">{label}</button>
        ))}
      </nav>

      <Section id="swipe" icon={Hand} title="Swiping">
        <p>Put your finger on an email in the list and slide it sideways, then let go.</p>
        <Row icon={Archive} name="Slide left">Archive: it leaves the Inbox and is kept forever in Archive. In Archive, Spam, Sent and Drafts, sliding left moves it to Trash instead. In Trash it does nothing.</Row>
        <Row icon={Mail} name="Slide right" tone="ok">mark it read (the gold dot goes away) or unread (shows as new again).</Row>
        <p>Slide only a little and it springs back with nothing changed. Changed your mind? Tap <b>Undo</b> on the bar at the bottom.</p>
        <p>When Mail opens, the top email slides a little by itself to show you this. It is only a picture: nothing is moved or marked. Touch the screen and it stops. Turn it off in the Menu under <b>Settings</b>.</p>
        <p>On a computer with a mouse, open the email and use the buttons at the top (Archive, Trash, Unread) instead.</p>
        <button onClick={onShowSwipe} className={cn(btn, "bg-mail-gold text-mail-ink")}><Play size={19} /> Show me the swipe</button>
      </Section>

      <Section id="select" icon={CheckCircle2} title="Picking several at once">
        <p><b>Press and hold</b> an email for a moment, or <b>tap the round letter</b> on its left. A gold tick appears.</p>
        <p>Tap more emails to add them. Then use the buttons at the top: <b>Archive</b>, <b>Read / Unread</b>, or <b>More</b> for Move to, Star, Spam, Block, Trash and Pick all.</p>
        <p>Tap <b>Cancel</b> (top left) to stop picking.</p>
      </Section>

      <Section id="where" icon={Archive} title="Archive, Trash or Spam?">
        <Row icon={Archive} name="Archive">&ldquo;I&apos;m done with it but want to keep it.&rdquo; Out of the Inbox, kept <b>forever</b>. Find it in Menu, Archive.</Row>
        <Row icon={Trash2} name="Trash" tone="danger">&ldquo;I don&apos;t want it.&rdquo; Kept <b>30 days</b> so you can rescue it, then deleted for good. <b>Empty Trash now</b> deletes right away and cannot be undone.</Row>
        <Row icon={AlertOctagon} name="Spam" tone="danger">&ldquo;This is junk.&rdquo; Kept <b>90 days</b>, then deleted. Mail from blocked senders, and mail sent to an address RO does not use, lands here too.</Row>
        <p>To rescue an email from Trash, Spam or Archive: open it and tap <b>To Inbox</b> at the top.</p>
      </Section>

      <Section id="folders" icon={Inbox} title="The folders in the Menu">
        <Row icon={Inbox} name="Inbox">new mail comes in here. The number next to it is how many are new (unread).</Row>
        <Row icon={Mail} name="All mail">every email in this mailbox in one list, whatever folder it was filed in, so you never have to dig through folders. Spam and Trash are left out.</Row>
        <Row icon={Star} name="Starred">everything you starred, wherever it is filed.</Row>
        <Row icon={Send} name="Sent">emails you sent from here.</Row>
        <Row icon={Archive} name="Archive">put away, kept forever.</Row>
        <Row icon={FileEdit} name="Drafts">emails saved to finish and send later.</Row>
        <Row icon={AlertOctagon} name="Spam">junk. Deleted after 90 days.</Row>
        <Row icon={Trash2} name="Trash">deleted mail. Deleted for good after 30 days.</Row>
        <Row icon={Folder} name="Your folders">the ones you made, listed under &ldquo;Your folders&rdquo;. &ldquo;Phone alerts on&rdquo; or &ldquo;Filed quietly&rdquo; under each one tells you if your phone pings for it.</Row>
        <p>In the list, a gold dot means new (unread). A number next to the name is how many emails are in that conversation. A paperclip means it has files attached.</p>
      </Section>

      <Section id="mailboxes" icon={Mail} title="Mailboxes (RO's email addresses)">
        <p>RO has more than one email address. Each address is a <b>mailbox</b>:</p>
        {accounts.length > 0 && (
          <ul className="space-y-1.5">
            {accounts.map((a) => (
              <li key={a.email} className="flex items-center gap-2.5 text-[17px]">
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                <span className="font-semibold break-all">{a.email}</span>
                <span className="text-mail-sub">({a.display_name}{a.is_default ? ", main" : ""})</span>
              </li>
            ))}
          </ul>
        )}
        <p>The button next to <b>Refresh</b> (above the list) shows which mailbox you are looking at. Tap it to switch.</p>
        <p><b>All mailboxes</b> puts every address in one list. Each email then shows a coloured dot and the address it was sent to.</p>
        <p>A new email is sent from the mailbox you are looking at. A reply goes from the address the email came to. You can change it on the <b>From</b> line.</p>
      </Section>

      <Section id="filters" icon={ListFilter} title="Your folders and filters">
        <p><b>Your folders</b> keep mail sorted, like Suppliers or Permits. Make them in Menu, <b>Folders &amp; filters</b>.</p>
        <p>Each folder <b>belongs to one or more mailboxes</b>. It only shows in the Menu when you are looking at those mailboxes (or All mailboxes), and its filters only file their mail.</p>
        <p>A <b>filter</b> files new mail by itself: mail from a sender, with certain words in the subject, or certain words in the email. Filters are checked from the top down; the first match wins. Mail from your customers always stays in the Inbox.</p>
        <p><b>Alerts on / off</b> on a folder decides if your phone pings when mail is filed there.</p>
        <p><b>Run filters now</b> sorts the mail that is already in the Inbox.</p>
        <p className="rounded-xl bg-mail-line/[0.05] border border-mail-line/15 p-3"><b>Fastest way:</b> open an email, tap <b>More</b>, then <b>Always file [sender] in…</b> and pick a folder. Their mail already here moves now, and their new mail goes straight there. It makes a filter you can change later.</p>
      </Section>

      <Section id="block" icon={ShieldAlert} title="Blocking a sender">
        <p>Open one of their emails, tap <b>More</b>, then <b>Block</b>. It asks first. Everything from that address moves to Spam, and new mail from it goes straight to Spam with no alert.</p>
        <p><b>Block everything from @company.com</b> blocks everyone at that company. Big providers like @gmail.com can&apos;t be blocked as a whole if a customer uses them; block the exact address.</p>
        <p>Unblock any time in Menu, Folders &amp; filters, at the bottom. Mail already in Spam stays there until you move it.</p>
      </Section>

      <Section id="star" icon={Star} title="Starring">
        <p>Tap the <b>star</b> on the right of an email (or <b>Star</b> at the top of an open email) to mark it important. It stays where it is and also shows in <b>Starred</b>. Tap again to take the star off.</p>
      </Section>

      <Section id="search" icon={Search} title="Search">
        <p>Type in the search box above the list. It looks at names, addresses, subjects and the first lines of the emails <b>in the folder and mailbox you are in</b>.</p>
        <p>Not finding it? Switch to <b>All mailboxes</b>, or open Archive or Sent and search again. Tap <b>Clear</b> to see everything.</p>
        <p>To see everything from one person: open their email, tap <b>More</b>, then <b>All mail from…</b></p>
      </Section>

      <Section id="reply" icon={Reply} title="Reply, Reply all, Forward">
        <Row icon={Reply} name="Reply">answers only the person who wrote.</Row>
        <Row icon={Reply} name="Reply all">answers them and everyone else who was copied in. It only shows when others were copied.</Row>
        <Row icon={Send} name="Forward">sends the email on to someone new. You type their address.</Row>
        <p>The buttons are at the bottom of an open email. <b>Show quoted text</b> shows the earlier emails tucked under a reply.</p>
        <p>Writing: fill in <b>To</b>, <b>Subject</b> and the message, then tap <b>Send</b>. <b>+ Copy someone</b> adds Cc (everyone sees them) and Bcc (a hidden copy).</p>
        <p>If you close a new email before sending, Mail asks if you want to keep it. <b>Keep it for later</b> saves it on this phone or computer only; an <b>unsent email</b> bar then shows above the list. Tap <b>Finish it</b>.</p>
      </Section>

      <Section id="files" icon={Paperclip} title="Attachments (files)">
        <p>A paperclip in the list means the email has files. Open the email, then tap a file to open it, or <b>Save</b> to download it. Pictures show as small previews; tap one to see it big.</p>
        <p>To send files, tap <b>Attach</b> at the top while writing. Up to 15 MB per file, 30 MB in total.</p>
      </Section>

      <Section id="tracking" icon={Eye} title="Did they read it? (under emails you send)">
        <p>Under every email you send from here is a line that tells you what happened:</p>
        <Row icon={Eye} name="Not opened yet">they have not opened it (that we can tell).</Row>
        <Row icon={Eye} name="Opened 2×" tone="ok">they opened the email twice.</Row>
        <Row icon={Eye} name="Clicked 1×" tone="ok">they tapped a link or button in it.</Row>
        <Row icon={Eye} name="3 website pages" tone="ok">pages of rounlimited.com they looked at after clicking.</Row>
        <p>A <b>green dot</b> means a real person did something. Tap the line (<b>Details</b>) to see each time, on what kind of device and roughly where.</p>
        <p><b>Automatic check</b>: some email programs and virus scanners open emails by themselves to check them. Those are listed separately, faded, and never counted as the customer reading it.</p>
        <p>Opens can be missed if their email app blocks pictures. Clicks and website visits are reliable.</p>
      </Section>

      <Section id="more" icon={Zap} title="Everything else">
        <Row icon={Bell} name="Phone alerts">you get one for new mail in the Inbox and in folders with alerts on. Spam never alerts. Tapping the alert opens that email.</Row>
        <Row icon={LayoutDashboard} name="Dashboard">the button at the top left goes back to the RO app&apos;s main screen. The phone&apos;s Back button steps back one screen at a time.</Row>
        <Row icon={light ? Sun : Moon} name="Light or dark">Menu, Settings, <b>Light mode</b> switches between a white and a black background. It is remembered on this device. In dark mode an email can look different from how the sender made it; open it, tap <b>More</b> on the email, then <b>Show original colors</b>.</Row>
        <button onClick={onToggleTheme} className={cn(btn, "border border-mail-line/25 text-mail-text font-semibold bg-mail-panel")}>
          {light ? <Moon size={19} /> : <Sun size={19} />} Switch to {light ? "dark" : "light"} mode
        </button>
        <Row icon={RefreshCw} name="New mail">Mail checks for new email every minute while it is open. To check now, tap <b>Refresh</b>, or pull the list down with your finger and let go.</Row>
        <Row icon={Zap} name="Why it opens instantly">Mail keeps a copy of your emails on this device, so lists and emails show right away, even with a weak signal. Then it quietly checks for anything new and updates. &ldquo;Updating…&rdquo; means it is checking. &ldquo;Couldn&apos;t refresh, showing the copy from…&rdquo; means no connection right now; tap <b>Retry</b>. Signing out clears the copy.</Row>
      </Section>
    </div>
  );
}
