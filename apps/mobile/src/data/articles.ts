/**
 * Fictional demo data for UI prototyping. Names, quotes, events and statistics
 * are invented. "Radio Waa" is a real broadcaster (92.1 FM, Wa, Upper West
 * Region, Ghana — see docs/mock-data-report.md); nothing below is a real report,
 * quotation or event.
 *
 * Images: every article now carries a real photograph — `news-*` files for the
 * newsroom, `wa-*` for the two source pictures the fixtures started with. All of
 * them are catalogued with their origin in docs/assets-provenance.md. Nothing is
 * hot-linked from a remote service and no generated placeholder art is left.
 */

import type { Article, Category } from "~/lib/types";
import { categories, getCategoryBySlug } from "./categories";
import { getAuthorById } from "./authors";

const PROTO = "Generated cover art for this prototype";
const UNVERIFIED = "Photograph of unverified provenance — see docs/assets-provenance.md";

const cat = (slug: string): Category => {
  const found = getCategoryBySlug(slug);
  if (!found) throw new Error(`Unknown category slug: ${slug}`);
  return found;
};

const byline = (id: string) => {
  const found = getAuthorById(id);
  if (!found) throw new Error(`Unknown author id: ${id}`);
  return found;
};

export const articles: Article[] = [
  {
    id: "art-water-emergency",
    slug: "jambia-pumping-station-failure-water-rationing",
    title: "Water rationing returns as the Jambia pumping station fails for a second time",
    excerpt:
      "Eight communities on the northern spur go back to tankers. Officials blame a failed transformer; residents say they were told nothing until the queues formed.",
    category: cat("local-news"),
    author: byline("author-abu-sule"),
    publishedAt: "2026-10-15T05:40:00.000Z",
    updatedAt: "2026-10-15T07:15:00.000Z",
    readingMinutes: 1,
    featured: true,
    breaking: true,
    tags: ["water", "utilities", "Jambia", "rationing"],
    image: {
      src: "/assets/images/news-water-rationing.jpg",
      alt: "Residents filling buckets and drums from a water tanker in a Wa suburb",
      credit: PROTO,
    },
    body: [
      {
        type: "paragraph",
        text: "For the second time this year the Jambia pumping station has stopped, and the eight communities that depend on it are back on bowser queues. The station's supply transformer failed on Tuesday evening. By Wednesday morning the first tankers were already queuing outside the distribution point in Wa.",
      },
      {
        type: "paragraph",
        text: "What residents describe is not the failure itself but the silence around it. Messages to the district assembly went unanswered for two days. The first public notice arrived on a community radio handover, three days after the pipes went dry.",
      },
      { type: "heading", level: 2, text: "What the district says" },
      {
        type: "paragraph",
        text: "The district assembly says a replacement transformer has been ordered and that a temporary pump is being positioned at the northern reservoir. Officials asked that residents treat the interim period as a scheduling problem rather than a shortage.",
      },
      {
        type: "quote",
        text: "We are not asking for more than the district already promised. We are asking to be told when it stops.",
        attribution: "A resident at the Wa distribution point, waiting since dawn",
      },
      { type: "heading", level: 2, text: "The rotation, and who it misses" },
      {
        type: "paragraph",
        text: "Under the interim schedule each community receives supply for six hours at a time. Households that can store water manage. Households that cannot — the elderly, the shift-working, and anyone running a small food business — do not.",
      },
      {
        type: "list",
        items: [
          "Eight communities affected, roughly 14,000 people.",
          "Replacement transformer ordered; no installation date given.",
          "District assembly to hold a stakeholders meeting once the temporary pump is positioned.",
        ],
      },
      {
        type: "paragraph",
        text: "This story will be updated as the assembly confirms an installation date. Listeners can send what they are seeing to the newsroom; the item will be read on The Morning Frequency.",
      },
    ],
  },
  {
    id: "art-ndc-chairman",
    slug: "upper-west-ndc-chairman-defends-reselection-process",
    title: "Upper West NDC chairman defends the constituency reselection process",
    excerpt:
      "At a campaign briefing in Wa, the regional chairman said complaints about the party’s internal process were a sign of a healthy organisation.",
    category: cat("politics"),
    author: byline("author-hawa-musah"),
    publishedAt: "2026-10-14T13:20:00.000Z",
    readingMinutes: 1,
    featured: true,
    tags: ["NDC", "party politics", "elections", "Wa"],
    image: {
      src: "/assets/images/wa-ndc-chairman.jpg",
      alt: "A regional party chairman addressing supporters at a campaign briefing",
      credit: UNVERIFIED,
    },
    body: [
      {
        type: "paragraph",
        text: "The Upper West regional chairman of the National Democratic Congress told a campaign briefing in Wa that internal challenges over constituency reselections are evidence of a party that is functioning, not one that is divided.",
      },
      {
        type: "paragraph",
        text: "Reselections for a number of constituencies are due to be concluded before the regional conference. The chairman said the process gives the grassroots a direct say and described the volume of petitions as healthy participation.",
      },
      { type: "heading", level: 2, text: "The other reading" },
      {
        type: "paragraph",
        text: "Critics of the process, speaking outside the hall, called it slow and opaque, and said the complaints are about procedure rather than principle. A former regional organiser described the delay as the kind that decides contests before delegates arrive.",
      },
      {
        type: "quote",
        text: "Nobody is against the grassroots choosing. People are against choosing in the dark.",
        attribution: "A former regional organiser, speaking after the briefing",
      },
      {
        type: "paragraph",
        text: "The regional conference is expected to set the dates for the reselection exercise. Good Morning Wa will carry the outcome as it is announced.",
      },
    ],
  },
  {
    id: "art-shea-season",
    slug: "shea-season-opens-early-buyers-before-pods-fall",
    title: "Shea season opens early as buyers arrive before the pods have fallen",
    excerpt:
      "A tightening of the collection calendar has buyers in the market town a month ahead of the usual harvest.",
    category: cat("business"),
    author: byline("author-david-kuunyoo"),
    publishedAt: "2026-10-14T07:05:00.000Z",
    readingMinutes: 1,
    featured: true,
    tags: ["shea", "trade", "agriculture", "prices"],
    image: {
      src: "/assets/images/news-shea-season.jpg",
      alt: "A shea picker carrying a full basket through the savanna",
      credit: UNVERIFIED,
    },
    body: [
      {
        type: "paragraph",
        text: "The shea collection season has opened about a month early in the northern belt, with buyers arriving in the market town before the fruit has finished falling. Collectors who expected to sell into a November market are selling into an October one.",
      },
      {
        type: "paragraph",
        text: "The early opening follows a tighter collection calendar agreed at district level. Under the new arrangement the picking window is fixed rather than open-ended, which is meant to stop the destructive early-picking that damages next season’s yield.",
      },
      { type: "heading", level: 2, text: "Prices, and the pressure on them" },
      {
        type: "paragraph",
        text: "The Friday prices round-up recorded a firmer market than the same week last year. Collectors say the firmer price is welcome but is being undercut by the volume — more kola and more sellers arriving in the same week.",
      },
      {
        type: "quote",
        text: "A better price is still a small price if we have picked everything early and there is nothing for the children in May.",
        attribution: "A collector outside the Wa market",
      },
      {
        type: "list",
        items: [
          "Collection window fixed by district agreement, opening roughly a month early.",
          "Friday prices round-up records a firmer market year on year.",
          "Buyers report volume, not price, as the constraint on this season.",
        ],
      },
      {
        type: "paragraph",
        text: "The business desk reads the full prices round-up on Market Square every Friday morning.",
      },
    ],
  },
  {
    id: "art-mtn-coverage",
    slug: "mobile-coverage-extended-nine-communities",
    title: "Mobile coverage extended to nine communities as operator completes rural build",
    excerpt:
      "The expansion adds coverage along two of the district’s least-served roads, with the operator citing a shared-infrastructure agreement.",
    category: cat("technology"),
    author: byline("author-solomon-geyidonyah"),
    publishedAt: "2026-10-13T16:10:00.000Z",
    readingMinutes: 1,
    breaking: true,
    tags: ["connectivity", "mobile", "rural infrastructure"],
    image: {
      src: "/assets/images/news-mobile-coverage.jpg",
      alt: "Rooftops and motorbikes along a Wa street",
      credit: UNVERIFIED,
    },
    body: [
      {
        type: "paragraph",
        text: "An operator has extended mobile coverage to nine communities, adding signal along two of the district’s least-served roads. Residents in the newly covered areas will, for the first time, reach the network without walking to a nearby town.",
      },
      {
        type: "paragraph",
        text: "The operator attributed the expansion to a shared-infrastructure agreement that allows a single mast to carry more than one tenant’s equipment, a model that has brought coverage to the district at a lower cost per community.",
      },
      { type: "heading", level: 2, text: "What the technology desk is watching" },
      {
        type: "paragraph",
        text: "The technology desk is treating this as a connectivity story but also a signal story. Coverage that carries voice is not the same as coverage that carries data, and the communities that need mobile money most are often the ones where data is still marginal.",
      },
      {
        type: "quote",
        text: "A bar of signal is not the same as internet. We will keep asking which one we actually got.",
        attribution: "The technology desk, on air",
      },
      {
        type: "paragraph",
        text: "Coverage maps and a breakdown of the affected communities will be updated on the Good Morning Wa technology segment.",
      },
    ],
  },
  {
    id: "art-youth-drugs",
    slug: "jirapa-taskforce-tramadol-recovery-centres",
    title: "Jirapa taskforce opens two recovery centres as tramadol use spreads among students",
    excerpt:
      "Health officials in Jirapa say the referral pathway was the missing piece; families say the stigma is still the wall.",
    category: cat("health"),
    author: byline("author-fatima-nyagse"),
    publishedAt: "2026-10-12T09:30:00.000Z",
    readingMinutes: 1,
    featured: true,
    tags: ["health", "drug use", "Jirapa", "youth"],
    image: {
      src: "/assets/images/news-recovery-centre.jpg",
      alt: "Health workers gathered in a district hospital corridor",
      credit: UNVERIFIED,
    },
    body: [
      {
        type: "paragraph",
        text: "A district taskforce in Jirapa has opened two recovery centres, beginning with a cohort of patients referred through the district hospital and community health posts. Officials describe the referral pathway as the piece that had been missing.",
      },
      {
        type: "paragraph",
        text: "Tramadol use among students in the district has been described by health workers as spreading and, in several families, as hidden. The taskforce’s opening figures are modest; the concern is the referral rate, which officials say is rising.",
      },
      { type: "heading", level: 2, text: "The wall of stigma" },
      {
        type: "paragraph",
        text: "Families interviewed described shame, not cost, as the primary barrier to seeking help. Several had moved a young person to a relative in another district rather than take them to a centre in their own community.",
      },
      {
        type: "quote",
        text: "You do not want your auntie to hear. So the child goes somewhere else, or nowhere.",
        attribution: "A parent, interviewed for this report",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Two centres opened, referred through the district hospital and health posts.",
          "Referral rate reported rising; capacity is the next constraint.",
          "Community health workers to run follow-up in the centres' own catchments.",
        ],
      },
      {
        type: "paragraph",
        text: "The health desk will follow the centres through the harmattan period, when the report says referral numbers historically dip.",
      },
    ],
  },
  {
    id: "art-malaria-season",
    slug: "malaria-season-three-weeks-decide-district-numbers",
    title: "Malaria season: the three weeks that decide the district’s numbers",
    excerpt:
      "District health teams say the outcome for the year is effectively set by a fortnight of rain in the south of the region.",
    category: cat("health"),
    author: byline("author-fatima-nyagse"),
    publishedAt: "2026-10-11T11:00:00.000Z",
    readingMinutes: 1,
    tags: ["health", "malaria", "rains", "outreach"],
    image: {
      src: "/assets/images/news-malaria-clinic.jpg",
      alt: "A nurse drawing a vaccine into a syringe at a district clinic",
      credit: PROTO,
    },
    body: [
      {
        type: "paragraph",
        text: "District health teams across the region say the malaria figures for the coming year are, in practice, decided by a fortnight of rain at the southern edge of the Upper West. The rains create standing water, the mosquitoes follow, and the surge arrives before the outreach teams are fully mobilised.",
      },
      {
        type: "paragraph",
        text: "This year the teams have moved their mobilisation date forward by three weeks, treating the earlier rains as the new baseline rather than an anomaly.",
      },
      { type: "heading", level: 2, text: "The bottleneck is nets, not tests" },
      {
        type: "paragraph",
        text: "Rapid diagnostic tests are in reasonable supply. Nets are not. Teams report that when a household has already used a net for three seasons, a new distribution matters less than a replacement, and replacements are harder to source.",
      },
      {
        type: "paragraph",
        text: "The health desk will carry the district mobilisation figures as they are released, on the request line as well as on air.",
      },
    ],
  },
  {
    id: "art-wechiau-custody",
    slug: "wechiau-custody-death-family-demands-inquiry",
    title: "Wechiau custody death: family demands inquiry after overnight detention",
    excerpt:
      "The family says they were not told where he was held for thirty hours. Police say the death was recorded at the station hospital.",
    category: cat("local-news"),
    author: byline("author-abu-sule"),
    publishedAt: "2026-10-10T15:45:00.000Z",
    readingMinutes: 1,
    tags: ["Wechiau", "custody", "accountability", "justice"],
    image: {
      src: "/assets/images/news-custody-inquiry.jpg",
      alt: "Officials seated at a briefing table answering questions",
      credit: UNVERIFIED,
    },
    body: [
      {
        type: "paragraph",
        text: "The family of a man who died in police custody in Wechiau has demanded a formal inquiry after saying they were not told where he was being held for some thirty hours. Police say the death was recorded at the station hospital and that a post-mortem has been requested.",
      },
      {
        type: "paragraph",
        text: "The man was arrested in the district last week in connection with a dispute over land. The family says he was moved between two stations. Both say records will be produced.",
      },
      { type: "heading", level: 2, text: "What is being asked for" },
      {
        type: "paragraph",
        text: "The family, represented by a local lawyer, has asked for three things: the custody register for the period, the station hospital’s record, and an independent post-mortem. The police have said they will cooperate with the inquiry once it is formally constituted.",
      },
      {
        type: "quote",
        text: "Thirty hours. If we had known for thirty hours, the station would have been crowded.",
        attribution: "A family member, speaking to Radio Waa",
      },
      {
        type: "paragraph",
        text: "The newsroom has written to the district police command seeking the register. Good Morning Wa will carry any response.",
      },
    ],
  },
  {
    id: "art-sdd-league",
    slug: "sdd-league-upper-west-united-hold-leaders-draw",
    title: "SDD league: Upper West United hold the leaders to a draw in Jirapa",
    excerpt:
      "A 1–1 draw in Jirapa leaves the leaders still top but with the smallest margin in a month.",
    category: cat("sports"),
    author: byline("author-ibrahim-tampuole"),
    publishedAt: "2026-10-10T19:20:00.000Z",
    readingMinutes: 1,
    tags: ["football", "SDD league", "Upper West United"],
    image: {
      src: "/assets/images/news-sdd-league.jpg",
      alt: "Footballers celebrating a goal on the pitch",
      credit: PROTO,
    },
    body: [
      {
        type: "paragraph",
        text: "Upper West United were held to a 1–1 draw in Jirapa, a result that leaves the leaders top of the SDD University league table but with their narrowest margin in a month.",
      },
      {
        type: "paragraph",
        text: "United took the lead through a first-half counter but could not hold it. The equaliser came from a set piece late in the second half that several in the crowd conceded was poorly defended.",
      },
      {
        type: "quote",
        text: "We scored the easy one and defended the difficult one. That is the whole match in a sentence.",
        attribution: "United’s coach, after the match",
      },
      {
        type: "paragraph",
        text: "Fixtures and the full table are read on Full Time every Saturday, with results from the Sunday colts league alongside.",
      },
    ],
  },
  {
    id: "art-ndc-organiser",
    slug: "ndc-organiser-targets-forty-thousand-registrations",
    title: "NDC organiser targets 40,000 new registrations before the regional conference",
    excerpt:
      "The party says a district-by-district registration drive will close the gap in the north, where uptake has lagged.",
    category: cat("politics"),
    author: byline("author-hawa-musah"),
    publishedAt: "2026-10-09T10:15:00.000Z",
    readingMinutes: 1,
    tags: ["NDC", "registration", "party politics"],
    image: {
      src: "/assets/images/news-ndc-organiser.jpg",
      alt: "A party organiser addressing a district registration drive meeting",
      credit: UNVERIFIED,
    },
    body: [
      {
        type: "paragraph",
        text: "The regional organiser has set a target of forty thousand new party registrations before the regional conference, conceding that uptake in the northern districts has lagged the region as a whole.",
      },
      {
        type: "paragraph",
        text: "The plan is a district-by-district drive, with registration desks at the markets on market days and at the district assembly grounds. The organiser said the target is deliberately ambitious.",
      },
      {
        type: "quote",
        text: "Registration is the party counting itself. If we count late, we are surprised late.",
        attribution: "The regional organiser",
      },
      {
        type: "paragraph",
        text: "The party says a district-by-district breakdown of the drive will be published after the conference.",
      },
    ],
  },
  {
    id: "art-assembly-finance",
    slug: "assembly-finance-where-composite-budget-goes",
    title: "Assembly finance: where the district’s composite budget actually goes",
    excerpt:
      "A look through the district’s own budget documents shows where the money lands, and where it stops on the way.",
    category: cat("politics"),
    author: byline("author-hawa-musah"),
    publishedAt: "2026-10-08T08:00:00.000Z",
    readingMinutes: 1,
    featured: true,
    tags: ["budget", "assembly", "accountability", "devolution"],
    image: {
      src: "/assets/images/news-assembly-budget.jpg",
      alt: "An official addressing journalists behind a bank of microphones",
      credit: PROTO,
    },
    body: [
      {
        type: "paragraph",
        text: "The district’s composite budget is usually presented as a single figure. The documents behind it break down into a handful of programmes, and the breakdown tells a more useful story than the headline.",
      },
      {
        type: "paragraph",
        text: "Three programmes account for most of the spend: education, primary health, and the district assembly’s own operations. Water and sanitation, which residents raise most often on the request line, account for a smaller share.",
      },
      { type: "heading", level: 2, text: "Following the money" },
      {
        type: "paragraph",
        text: "Of the education allocation, the largest single line is classroom construction. Several completed projects in the district sit unstaffed or partially completed, which the assembly attributes to a sequencing problem between the education directorate and the district works department.",
      },
      {
        type: "quote",
        text: "We are not short of plans. We are short of the handover from one department to the next.",
        attribution: "A district assembly source, speaking on condition of anonymity",
      },
      {
        type: "list",
        items: [
          "Education, primary health and assembly operations dominate the composite budget.",
          "Water and sanitation allocations are smaller than the volume of resident complaints.",
          "The largest education line is classroom construction, with sequencing the sticking point.",
        ],
      },
      {
        type: "paragraph",
        text: "This is the first in a series reading the district’s own documents. Good Morning Wa will carry the budget documents and any assembly response.",
      },
    ],
  },
  {
    id: "art-transmitter-network",
    slug: "the-network-that-keeps-wa-on-air-transmitter-faults",
    title: "The network that keeps Wa on air: the month’s transmitter faults, explained",
    excerpt:
      "Two supply units and a storm. The engineering picture behind three outages is less dramatic and more fixable than it sounds.",
    category: cat("technology"),
    author: byline("author-solomon-geyidonyah"),
    publishedAt: "2026-10-07T12:30:00.000Z",
    readingMinutes: 1,
    tags: ["engineering", "transmitters", "broadcast", "spectrum"],
    image: {
      src: "/assets/images/news-transmitter.jpg",
      alt: "A broadcast transmitter mast against a clear sky",
      credit: PROTO,
    },
    body: [
      {
        type: "paragraph",
        text: "Three transmitters went off air in a fortnight. The station’s engineering team has given the technology desk the short version: one power supply failed on schedule, one failed early after a hot week, and one was knocked out by storm debris on a feeder line.",
      },
      { type: "heading", level: 2, text: "The engineering picture" },
      {
        type: "paragraph",
        text: "A transmitter is a small power station attached to a very tall antenna. Most outages are mundane, and the interesting ones are almost always weather or supply rather than anything to do with the studio.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "One supply unit failed within its expected window; a spare was swapped during the overnight maintenance slot.",
          "A second unit ran hot and failed eleven days early; engineers are reviewing the cooling arrangement.",
          "A third was taken out by storm debris on the feeder line and required a line crew.",
        ],
      },
      {
        type: "paragraph",
        text: "Coverage maps for the affected areas are updated as repairs complete, and the fallback frequencies remain on air throughout. The engineering team says the cooling review is the item most likely to prevent a repeat.",
      },
    ],
  },
  {
    id: "art-mobile-money-fees",
    slug: "mobile-money-the-fees-nobody-prints",
    title: "Mobile money: the fees nobody prints on the receipt",
    excerpt:
      "The small charges — cash-out, transfers, airtime — add up faster than most users realise, and the arithmetic is worth doing.",
    category: cat("technology"),
    author: byline("author-solomon-geyidonyah"),
    publishedAt: "2026-10-06T09:50:00.000Z",
    readingMinutes: 1,
    tags: ["mobile money", "fintech", "fees", "consumers"],
    image: {
      src: "/assets/images/news-mobile-money.jpg",
      alt: "A mobile money kiosk on a busy street corner",
      credit: PROTO,
    },
    body: [
      {
        type: "paragraph",
        text: "Most users can tell you the headline charge on a mobile money transfer. Far fewer can tell you what they spend in a month on the small ones: cash-out, airtime, and the small everyday transfers.",
      },
      {
        type: "paragraph",
        text: "Worked through with three agents on the Wa–Nandom road, the pattern is consistent: the small fees are paid without being counted, because each one is small enough to feel unimportant and large enough, over a month, to matter.",
      },
      { type: "heading", level: 2, text: "The arithmetic" },
      {
        type: "quote",
        text: "I never think about a fee. Then at the end of the month I look at what I have left and I cannot explain it.",
        attribution: "A trader, working with the technology desk",
      },
      {
        type: "paragraph",
        text: "The technology desk is not making a case against agents. The point is that a fee the user cannot see is a fee the user cannot budget for, and the region has a large informal economy that budgets carefully.",
      },
      {
        type: "paragraph",
        text: "Agent-by-agent fee schedules are published on the technology segment, with the arithmetic worked through for a listener’s typical month.",
      },
    ],
  },
  {
    id: "art-sdd-away-form",
    slug: "upper-west-united-away-form-coach-solved",
    title: "Upper West United’s away form is a problem the coach says is already solved",
    excerpt:
      "Four of the last five away matches have ended level. The coach has a theory about why, and it is not fitness.",
    category: cat("sports"),
    author: byline("author-ibrahim-tampuole"),
    publishedAt: "2026-10-05T18:40:00.000Z",
    readingMinutes: 1,
    tags: ["football", "Upper West United", "SDD league", "analysis"],
    image: {
      src: "/assets/images/news-upper-west-united.jpg",
      alt: "A player shielding the ball during a league match",
      credit: PROTO,
    },
    body: [
      {
        type: "paragraph",
        text: "Upper West United’s away form has been the talking point in the league for a month: four of the last five away matches have ended level. The coach has a theory, and it is not fitness.",
      },
      {
        type: "paragraph",
        text: "His argument is that away sides concede possession early, settle into a shape they did not intend, and then spend the second half managing a game rather than playing one. The league’s most successful away side, by his account, is the one that concedes nothing in the first thirty minutes.",
      },
      {
        type: "quote",
        text: "At home we win the game early. Away we lose it in the first half and spend an hour managing a thing we did not want.",
        attribution: "United’s coach",
      },
      {
        type: "paragraph",
        text: "Full Time reads every fixture and the table on Saturdays.",
      },
    ],
  },
  {
    id: "art-roads-inspection",
    slug: "feeder-road-audit-what-assembly-records-show",
    title: "Feeder road audit: what the district assemblies’ own inspection records show",
    excerpt:
      "We went through the inspection returns. Half the roads listed as completed last year do not match their descriptions.",
    category: cat("local-news"),
    author: byline("author-abu-sule"),
    publishedAt: "2026-10-04T10:30:00.000Z",
    readingMinutes: 1,
    featured: true,
    tags: ["roads", "assembly", "audit", "infrastructure"],
    image: {
      src: "/assets/images/news-road-audit.jpg",
      alt: "Officials walking a graded feeder road during an inspection",
      credit: UNVERIFIED,
    },
    body: [
      {
        type: "paragraph",
        text: "The district assemblies in the region publish an inspection return for each feeder road they supervise. Radio Waa has gone through those returns, and roughly half the roads listed as completed last year do not match their own written descriptions.",
      },
      {
        type: "paragraph",
        text: "The discrepancies are rarely dramatic. The common pattern is a road described as completed over its full length that is in fact completed over a portion, with the remainder impassable in the rains.",
      },
      { type: "heading", level: 2, text: "Two roads, two descriptions" },
      {
        type: "quote",
        text: "The return says completed. The road ends at the culvert. Both things are written down and they do not agree.",
        attribution: "A member of the district works staff",
      },
      {
        type: "list",
        items: [
          "About half of roads listed as completed last year diverge from their inspection descriptions.",
          "The usual pattern is partial completion described as full completion.",
          "Assembly responses to specific road returns will be carried as they arrive.",
        ],
      },
      {
        type: "paragraph",
        text: "The newsroom has put the specific returns to each assembly and will publish their answers in full. This story will be updated.",
      },
    ],
  },
  {
    id: "art-fintech-agents",
    slug: "mobile-money-agents-wa-nandom-after-bank-closed",
    title: "The mobile money agents on the Wa–Nandom road, after the last bank closed",
    excerpt:
      "Where the branch went, the agent became the bank. The consequences are not all negative.",
    category: cat("business"),
    author: byline("author-david-kuunyoo"),
    publishedAt: "2026-10-03T08:45:00.000Z",
    readingMinutes: 1,
    tags: ["mobile money", "banking", "access", "rural economy"],
    image: {
      src: "/assets/images/news-mobile-money-agents.jpg",
      alt: "Agents serving customers at a mobile money stand",
      credit: UNVERIFIED,
    },
    body: [
      {
        type: "paragraph",
        text: "When the last bank branch on the Wa–Nandom road closed, the nearest alternatives were already there: the mobile money agents who had been taking deposits of a sort for years.",
      },
      {
        type: "paragraph",
        text: "Two years on, the agents describe a mixed picture. Access is better — the road corridor is served around the clock, which no branch ever was. But the limits are real, and the gap between holding e-money and holding a savings account is the gap the region is now living inside.",
      },
      { type: "heading", level: 2, text: "What the agents actually do" },
      {
        type: "paragraph",
        text: "Most agents describe themselves as cash converters with a savings habit attached. That is closer to the truth than either the optimism or the criticism would suggest, and it is why the regulator’s agent-tiers discussion matters more here than it might elsewhere.",
      },
      {
        type: "quote",
        text: "People think we are the bank. We are the bank’s first step, and we take a fee for it.",
        attribution: "An agent on the Wa–Nandom road",
      },
      {
        type: "paragraph",
        text: "The business desk follows the agents’ survey on Market Square.",
      },
    ],
  },
  {
    id: "art-groundnut-prices",
    slug: "groundnut-prices-friday-round-up",
    title: "Groundnut prices: the Friday round-up from the Wa market",
    excerpt:
      "A firmer week for groundnut, but the spread between farmgate and market is widening — and that is where the debate is.",
    category: cat("business"),
    author: byline("author-david-kuunyoo"),
    publishedAt: "2026-10-02T08:20:00.000Z",
    readingMinutes: 1,
    tags: ["groundnut", "prices", "trade", "markets"],
    image: {
      src: "/assets/images/news-groundnut-market.jpg",
      alt: "Groundnuts spread out to dry on a mat",
      credit: PROTO,
    },
    body: [
      {
        type: "paragraph",
        text: "Groundnut traded firmer this week at the Wa market, with the standard grade up modestly. The more telling number is the spread between what a collector is offered at the farmgate and what the same sack fetches in town — a gap that has been widening through the season.",
      },
      {
        type: "quote",
        text: "Everyone celebrates a better price at the market. Nobody asks what the farmer was paid for it.",
        attribution: "A trader in the Wa market, during the Friday round-up",
      },
      {
        type: "paragraph",
        text: "The business desk reads the full prices round-up on Market Square every Friday morning.",
      },
    ],
  },
  {
    id: "art-anwelle-students",
    slug: "anwelle-students-walk-nine-kilometres-to-exams",
    title: "Anwelle students walk nine kilometres to sit their exams",
    excerpt:
      "The examination centre was moved. The school was not. For a fortnight, the morning starts at four.",
    category: cat("local-news"),
    author: byline("author-comfort-nangmin"),
    publishedAt: "2026-10-02T14:20:00.000Z",
    readingMinutes: 1,
    tags: ["education", "Anwelle", "exams", "access"],
    image: {
      src: "/assets/images/news-exams-walk.jpg",
      alt: "Pupils at their desks in a rural classroom",
      credit: UNVERIFIED,
    },
    body: [
      {
        type: "paragraph",
        text: "When the examination centre for Anwelle was moved to a larger hall, the school itself stayed where it is. The distance between the two is nine kilometres, and for the fortnight of the exam the school day starts at four in the morning.",
      },
      {
        type: "paragraph",
        text: "The head teacher says the move was made for space, not for access, and that nobody objected because everybody understood the reason. What she has asked for is not a second centre but a vehicle, or the centre back where it was.",
      },
      {
        type: "quote",
        text: "We can walk nine kilometres. We cannot walk nine kilometres and then sit an examination. The walking is taking the answer.",
        attribution: "The head teacher at Anwelle",
      },
      {
        type: "paragraph",
        text: "Community Matters has asked the district assembly to confirm what transport, if any, is available for next year’s cycle.",
      },
    ],
  },
  {
    id: "art-skills-training",
    slug: "skills-centre-teaching-groundnut-processing-hundred-women",
    title: "The skills centre teaching groundnut processing to a hundred women",
    excerpt:
      "A disused store room, a borrowed mill, and a waiting list: the region’s most requested training has no building yet.",
    category: cat("local-news"),
    author: byline("author-comfort-nangmin"),
    publishedAt: "2026-10-01T09:10:00.000Z",
    readingMinutes: 1,
    tags: ["education", "skills", "women", "groundnut"],
    image: {
      src: "/assets/images/news-skills-centre.jpg",
      alt: "Trainees at a groundnut processing skills session in a community hall",
      credit: UNVERIFIED,
    },
    body: [
      {
        type: "paragraph",
        text: "The most requested training in the district is not academic. It is groundnut processing, and the course that runs it operates out of a disused store room with a borrowed mill and a waiting list of a hundred.",
      },
      {
        type: "paragraph",
        text: "The reasoning behind the demand is straightforward. Raw groundnut leaves the region at one price and returns as processed paste at several times that. The gap is processing capacity, and processing capacity is a machine and a room.",
      },
      { type: "heading", level: 2, text: "What is missing is a building" },
      {
        type: "quote",
        text: "I can teach this to a hundred people. What I cannot do is teach them in a room where the machine is safe.",
        attribution: "The trainer running the course",
      },
      {
        type: "paragraph",
        text: "Community Matters will follow the district’s response on a dedicated centre. The waiting list, in the meantime, keeps its own count.",
      },
    ],
  },
  {
    id: "art-dumba-festival",
    slug: "dumba-festival-dance-survives-the-algorithm",
    title: "Dumba festival: the dance that survives contact with the algorithm",
    excerpt:
      "A festival that predates the platform economy is being shared on it, and negotiating the terms in real time.",
    category: cat("entertainment"),
    author: byline("author-grace-adengaa"),
    publishedAt: "2026-09-30T17:00:00.000Z",
    readingMinutes: 1,
    tags: ["Dumba", "festival", "music", "culture"],
    image: {
      src: "/assets/images/news-dumba-festival.jpg",
      alt: "Dancers in traditional dress at a Dumba procession",
      credit: PROTO,
    },
    body: [
      {
        type: "paragraph",
        text: "The Dumba festival predates every platform now sharing clips of it. That has been good for attendance and awkward for control: for the first time, the dancers most associated with the tradition are watching their own performance circulate without a say in where it goes.",
      },
      {
        type: "paragraph",
        text: "Organisers have responded by trying to set terms before the festival rather than after it, with a designated clip window, agreed hashtags, and a line in the performers’ contract about which recordings may circulate.",
      },
      {
        type: "quote",
        text: "We do not want to be famous for a fifteen-second cut of the wrong part of the drum.",
        attribution: "A lead dancer, before the festival",
      },
      {
        type: "paragraph",
        text: "The afternoon and drive desks will carry the festival schedule, and will note the parts of the programme the organisers have asked not to be filmed.",
      },
    ],
  },
  {
    id: "art-wa-hiphop",
    slug: "wa-hip-hop-after-damba-studios-behind-market",
    title: "Wa hip-hop after Damba: the studios behind the market",
    excerpt:
      "A room above a provision shop, a borrowed laptop, and a scene that decided to build rather than wait to be discovered.",
    category: cat("entertainment"),
    author: byline("author-grace-adengaa"),
    publishedAt: "2026-09-29T19:30:00.000Z",
    readingMinutes: 1,
    tags: ["hip-hop", "Wa", "music", "studios"],
    image: {
      src: "/assets/images/news-hip-hop-studio.jpg",
      alt: "A singer recording at a studio microphone",
      credit: PROTO,
    },
    body: [
      {
        type: "paragraph",
        text: "The room above the provision shop is the most reliable recording space in Wa, which is a sentence that would be funny anywhere else. The studio has a borrowed laptop, a microphone that has been repaired twice, and a waiting list.",
      },
      {
        type: "paragraph",
        text: "What distinguishes this scene from the older generation’s complaint about it is that the artists have stopped waiting to be discovered elsewhere. Sessions are arranged locally, collaborations are made in person, and the argument about whether to leave has largely given way to the argument about how to stay and get paid.",
      },
      {
        type: "quote",
        text: "Everyone used to tell us the music has no market here. So we built one and we are recording into it.",
        attribution: "A producer working from the room above the shop",
      },
      {
        type: "paragraph",
        text: "Hottest Mic plays new Wa material every Friday. Requests come in all week on the request line.",
      },
    ],
  },
  {
    id: "art-road-opinion",
    slug: "wa-nandom-road-is-not-a-transport-problem",
    title: "The Wa–Nandom road is not a transport problem",
    excerpt:
      "Everyone describes it as a bus problem. It is a maintenance-budget problem wearing a bus problem’s coat.",
    category: cat("opinion"),
    author: byline("author-abu-sule"),
    publishedAt: "2026-09-28T06:45:00.000Z",
    readingMinutes: 1,
    tags: ["opinion", "roads", "budget", "analysis"],
    image: {
      src: "/assets/images/news-wa-road.jpg",
      alt: "A main street in Wa with traffic and low buildings",
      credit: PROTO,
    },
    body: [
      {
        type: "paragraph",
        text: "Every few weeks the Wa–Nandom road is described on air as a transport problem. Operators are late, journeys take twice as long, and passengers blame the operators. The operators blame the road. Both are describing a symptom.",
      },
      { type: "heading", level: 2, text: "The actual constraint" },
      {
        type: "paragraph",
        text: "The binding constraint on this corridor is not vehicle numbers and it is not driver hours. It is the gap between the capital cost of building a road and the recurrent cost of maintaining one. Build the road and the money arrives. Maintain it, and it is the line everyone cuts first because nothing visible stops.",
      },
      {
        type: "quote",
        text: "A road that is not maintained is not a road that is cheap. It is a loan taken out against the next harvest.",
        attribution: "Opinion",
      },
      {
        type: "paragraph",
        text: "The district assemblies publish their own inspection returns. Radio Waa has been reading them. That is where this argument should be taken.",
      },
    ],
  },
  {
    id: "art-remittances",
    slug: "remittances-hometown-associations-financing-clinics",
    title: "Remittances: the hometown associations financing the region’s clinics",
    excerpt:
      "The money coming home is not abstract. In several communities it has built the health post outright.",
    category: cat("diaspora"),
    author: byline("author-comfort-nangmin"),
    publishedAt: "2026-09-27T11:20:00.000Z",
    readingMinutes: 1,
    tags: ["diaspora", "remittances", "health", "associations"],
    image: {
      src: "/assets/images/show-community-matters.jpg",
      alt: "A presenter speaking into a microphone in a bright studio",
      credit: PROTO,
    },
    body: [
      {
        type: "paragraph",
        text: "The remittance debate is usually conducted in national figures. In the communities it is conducted in buildings: the health post that exists because an association in Toronto or Birmingham raised the money for it.",
      },
      {
        type: "paragraph",
        text: "Community Matters has been following one such project — a clinic built, equipped and staffed by a hometown association over four years — and the paperwork behind it is more interesting than the finished building.",
      },
      { type: "heading", level: 2, text: "The handover problem" },
      {
        type: "paragraph",
        text: "A common failure is not corruption but handover. An association builds and equips, then the district is slow to staff. A building with a full-time nurse and no roof is worth more than a roof with neither, and the associations have learned to ask about staffing before they build.",
      },
      {
        type: "quote",
        text: "We learned: ask who will run it before you pour the concrete. A clinic needs a person, not only a roof.",
        attribution: "A member of a diaspora association",
      },
      {
        type: "paragraph",
        text: "Community Matters will publish the association’s accounts and the district’s staffing response.",
      },
    ],
  },
  {
    id: "art-harmattan",
    slug: "harmattan-arrives-visibility-flights-drive-warning",
    title: "Harmattan arrives: visibility, flights and the drive-time warning",
    excerpt:
      "The dust season has begun. Here is what changes for flights, for the morning drive, and for anyone on the road before six.",
    category: cat("weather-traffic"),
    author: byline("author-fatima-nyagse"),
    publishedAt: "2026-09-26T05:30:00.000Z",
    readingMinutes: 1,
    tags: ["harmattan", "weather", "traffic", "flights"],
    image: {
      src: "/assets/images/news-harmattan.jpg",
      alt: "Dust haze cutting visibility on a road during harmattan",
      credit: PROTO,
    },
    body: [
      {
        type: "paragraph",
        text: "The harmattan has arrived, bringing the dust haze that reduces morning visibility across the region. Visibility at dawn has dropped below the level at which the morning drive is comfortable.",
      },
      {
        type: "list",
        items: [
          "Early-morning visibility reduced; allow extra time on the roads.",
          "Flights may be delayed or rerouted during the worst of the haze.",
          "Asthma and respiratory complaints typically rise in the first fortnight.",
        ],
      },
      {
        type: "paragraph",
        text: "Good Morning Wa carries the weather and traffic update at the top of every hour during the season.",
      },
    ],
  },
];

const byRecency = (a: Article, b: Article) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

export function getLatestArticles(limit = 10): Article[] {
  return [...articles].sort(byRecency).slice(0, limit);
}

export function getFeaturedArticles(limit = 3): Article[] {
  return articles.filter((article) => article.featured).sort(byRecency).slice(0, limit);
}

export function getBreakingArticles(): Article[] {
  return articles.filter((article) => article.breaking).sort(byRecency);
}

export function getArticlesByCategory(category: Category): Article[] {
  return articles.filter((article) => article.category.id === category.id).sort(byRecency);
}

/** Trending = freshest non-featured stories, i.e. what is moving right now. */
export function getTrendingArticles(limit = 5): Article[] {
  return articles
    .filter((article) => !article.featured)
    .sort(byRecency)
    .slice(0, limit);
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  const sameCategory = articles.filter(
    (candidate) =>
      candidate.id !== article.id && candidate.category.id === article.category.id,
  );
  const sameTags = articles.filter(
    (candidate) =>
      candidate.id !== article.id &&
      candidate.category.id !== article.category.id &&
      candidate.tags.some((tag) => article.tags.includes(tag)),
  );
  return [...sameCategory, ...sameTags].sort(byRecency).slice(0, limit);
}

export function searchArticles(query: string, limit = 20): Article[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return articles
    .filter((article) =>
      [article.title, article.excerpt, article.category.name, ...article.tags]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    )
    .sort(byRecency)
    .slice(0, limit);
}

export { categories };