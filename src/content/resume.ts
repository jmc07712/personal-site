import type { Product, Span, YM } from './types';

export const identity = {
  name: 'Jared Chester',
  title: 'Senior Software Engineer',
  level: 'L6',
  employer: 'Amazon Ads',
  location: 'New York',
  email: 'jared.m.chester516@gmail.com',
  github: 'https://github.com/jmc07712',
  linkedin: 'https://www.linkedin.com/in/jared-chester-52b76a190/',
  source: 'https://github.com/jmc07712/personal-site',
  positioning:
    'I build AI agents and the data systems underneath them. Senior software engineer at Amazon Ads in New York.',
  about: [
    'My current work is a conversational agent that builds pitch decks for 5,000 Amazon Ads sellers, and an architecture that puts four teams’ AI capabilities behind one agent.',
    'Most of my Amazon work has been data infrastructure: an insights API that serves 1.2 billion records a month, orchestration for more than 2,000 Spark jobs, and a cross-VPC cache for pseudonymized identity data.',
    'I mentor new graduates, sit on promotion panels, and run my org’s GenAI tech talk series. On my own time I ship small products.',
  ],
  education:
    'B.S. Computer Science, minor in mathematics, Rutgers University, summa cum laude, 2021',
} as const;

/** The trace axis starts at the first role. */
export const TRACE_START: YM = '2018-09';

export const spans: Span[] = [
  {
    id: 'career',
    name: 'Career',
    kind: 'root',
    from: '2018-09',
    to: 'now',
    summary:
      'Research software at Rutgers, security apps at AT&T, then data platforms and AI agents at Amazon Ads.',
    metrics: [],
  },
  {
    id: 'tischfield-lab',
    name: 'Tischfield Lab',
    kind: 'role',
    parent: 'career',
    from: '2018-09',
    to: '2021-05',
    org: 'Jay A. Tischfield Laboratory, Rutgers',
    title: 'Lead developer and data analyst',
    location: 'Piscataway, NJ',
    summary:
      'I led five developers across four universities building computer-vision tools for a Tourette syndrome study.',
    metrics: [
      { value: '5', label: 'developers led, across 4 universities' },
      { value: '100-node', label: 'SLURM GPU cluster' },
    ],
    stack: ['Python', 'Electron', 'TensorFlow', 'PyTorch'],
  },
  {
    id: 'behavioral-syllables',
    name: 'Behavioral syllables',
    kind: 'system',
    parent: 'tischfield-lab',
    from: '2018-09',
    to: '2021-05',
    summary:
      'Tools that split recorded behavior into discrete “syllables” with an autoregressive hidden Markov model.',
    metrics: [{ value: 'AR-HMM', label: 'segments behavior into syllables' }],
    stack: ['Python', 'Electron', 'TensorFlow', 'PyTorch', 'SLURM'],
  },
  {
    id: 'rutgers',
    name: 'Rutgers, B.S.',
    kind: 'event',
    parent: 'career',
    at: '2021-05',
    org: 'Rutgers University',
    title: 'B.S. Computer Science, minor in mathematics',
    summary: 'Graduated summa cum laude.',
    metrics: [],
  },
  {
    id: 'att',
    name: 'AT&T',
    kind: 'role',
    parent: 'career',
    from: '2021-07',
    to: '2022-07',
    org: 'AT&T, Chief Security Organization',
    title: 'Full-stack application developer',
    location: 'Middletown, NJ',
    summary:
      'I built security applications for internal teams and moved their logins to OAuth 2.0 and OpenID Connect.',
    metrics: [{ value: 'OAuth 2.0', label: 'and OIDC across internal apps' }],
    stack: ['AngularJS', 'Express', 'MySQL'],
  },
  {
    id: 'oauth-oidc',
    name: 'OAuth and OIDC sign-in',
    kind: 'system',
    parent: 'att',
    from: '2021-07',
    to: '2022-07',
    summary: 'One standard login path in place of each app’s own legacy flow.',
    metrics: [{ value: 'OIDC', label: 'replaced per-app login flows' }],
    stack: ['AngularJS', 'Express', 'MySQL', 'OAuth 2.0', 'OIDC'],
  },
  {
    id: 'amazon-ads',
    name: 'Amazon Ads',
    kind: 'role',
    parent: 'career',
    from: '2022-08',
    to: 'now',
    org: 'Amazon Ads',
    title: 'Senior software engineer (L6)',
    location: 'New York',
    summary:
      'AI agents, recommendation systems, APIs, and the pipelines under them. Promoted to L6 in 2025.',
    metrics: [
      { value: '5,000', label: 'sellers use the Pitching Agent' },
      { value: '1.2B', label: 'records a month through the Insights API' },
    ],
  },
  {
    id: 'identity-cache',
    name: 'Identity cache',
    kind: 'system',
    parent: 'amazon-ads',
    from: '2022-08',
    to: '2023-12',
    approx: true,
    summary:
      'A DynamoDB cache that lets pipelines in many VPCs share pseudonymized identity lookups.',
    metrics: [
      { value: '97–99%', label: 'cache hit rate in 3 regions' },
      { value: '3B+', label: 'pseudonymized records a month' },
      { value: '3.5 weeks', label: 'to move all traffic' },
    ],
    stack: ['DynamoDB', 'Spark', 'EMR', 'Scala', 'Java'],
  },
  {
    id: 'insights-store',
    name: 'Insights store',
    kind: 'system',
    parent: 'amazon-ads',
    from: '2023-01',
    to: '2024-12',
    approx: true,
    summary:
      'The storage and serving layer behind the Insights API. A new insight is onboarded with a config file, not code.',
    metrics: [],
    stack: ['Java', 'Lambda', 'DynamoDB', 'S3'],
  },
  {
    id: 'insights-api',
    name: 'Insights API',
    kind: 'system',
    parent: 'amazon-ads',
    from: '2023-01',
    to: '2025-12',
    approx: true,
    summary: 'The shared API that products, services, and agents use to find and serve insights.',
    metrics: [
      { value: '1.2B', label: 'records a month' },
      { value: '10M+', label: 'requests a month' },
      { value: '100 TPS', label: 'at peak' },
      { value: '1,000×', label: 'faster search with OpenSearch' },
    ],
    stack: ['Java', 'Lambda', 'API Gateway', 'DynamoDB', 'OpenSearch'],
  },
  {
    id: 'study-recommendations',
    name: 'Measurement study recommendations',
    kind: 'system',
    parent: 'amazon-ads',
    from: '2024-01',
    to: '2025-12',
    approx: true,
    summary:
      'A platform that recommends third-party measurement studies, with a rules engine, a model, and plain-language explanations.',
    metrics: [
      { value: '4h → <2m', label: 'to choose a study' },
      { value: '4', label: 'engineers led' },
    ],
    stack: ['Java', 'React', 'SageMaker', 'DynamoDB'],
  },
  {
    id: 'pipeline-orchestration',
    name: 'Pipeline orchestration',
    kind: 'system',
    parent: 'amazon-ads',
    from: '2025-01',
    to: '2025-12',
    approx: true,
    summary:
      'One service that starts more than 2,000 Spark jobs as soon as their input data lands.',
    metrics: [
      { value: '2,000+', label: 'Spark/EMR jobs' },
      { value: '~40%', label: 'lower compute cost' },
      { value: '2w → <1w', label: 'full refresh time' },
    ],
    stack: ['Java', 'Spark', 'EMR', 'S3', 'Lambda'],
  },
  {
    id: 'pitching-agent',
    name: 'Pitching Agent',
    kind: 'system',
    parent: 'amazon-ads',
    from: '2025-01',
    to: 'now',
    approx: true,
    summary:
      'A conversational agent on Claude and Amazon Bedrock that researches an advertiser’s account and drafts a pitch deck.',
    metrics: [
      { value: '5,000', label: 'sellers served' },
      { value: '2h → 5m', label: 'to build a pitch' },
      { value: '100K+', label: 'hours saved a year' },
      { value: '40+', label: 'MCP tools' },
    ],
    stack: ['Python', 'Claude', 'Amazon Bedrock', 'MCP', 'ECS'],
  },
  {
    id: 'genai-adoption',
    name: 'GenAI adoption',
    kind: 'system',
    parent: 'amazon-ads',
    from: '2025-01',
    to: 'now',
    approx: true,
    summary:
      'A tech talk series I started, an adoption plan I co-wrote, and two tools I shared with the org: an LLM code reviewer and a design-doc knowledge base for coding agents.',
    metrics: [{ value: '2', label: 'internal AI tools shared across the org' }],
    stack: ['Claude', 'Amazon Bedrock', 'Python'],
  },
  {
    id: 'agent-architecture',
    name: 'Agent architecture',
    kind: 'system',
    parent: 'amazon-ads',
    from: '2026-01',
    to: 'now',
    approx: true,
    summary: 'One domain agent in front of four teams’ AI capabilities.',
    metrics: [
      { value: '4', label: 'teams behind one agent' },
      { value: '50', label: 'engineers in the org it covers' },
    ],
    stack: ['MCP', 'Claude', 'Amazon Bedrock', 'Python'],
  },
];

/** Independent products, newest first. */
export const products: Product[] = [
  {
    id: 'counterdex',
    name: 'Counterdex',
    url: 'https://counterdex.vercel.app',
    source: 'https://github.com/jmc07712/counterdex',
    summary:
      'Build Pokémon teams, see how to beat any team, and find out when PokéAPI changes a Pokémon on one of yours.',
    highlights: [
      'A sync of about 3,000 requests fingerprints every Pokémon and keeps a before-and-after snapshot whenever one changes.',
      'Counter teams come from pairwise matchup scores and a greedy builder. Searching every possible team would mean checking about 1.6 quadrillion of them.',
      'React and FastAPI deploy together on one Vercel domain. The backend is tested against a real Postgres.',
    ],
    stack: ['React', 'Vite', 'TanStack Query', 'FastAPI', 'SQLAlchemy', 'Postgres', 'Vercel'],
  },
  {
    id: 'docly',
    name: 'Docly',
    url: 'https://askdocly.com',
    summary:
      'Upload a document and get a summary, risk flags, clause explanations, and answers that cite the source.',
    highlights: [
      'Web and mobile apps from one codebase family: Next.js and React Native.',
      'Answers come from Claude and point back to the passage they rely on.',
      'Payments through Stripe on the web and in-app purchases on mobile.',
    ],
    stack: ['Next.js', 'React Native', 'Claude', 'Firebase', 'Stripe'],
  },
  {
    id: 'dateescape',
    name: 'DateEscape',
    url: 'https://dateescape.app',
    summary:
      'A way out of an uncomfortable situation: schedule a realistic fake call and let your phone ring on cue.',
    highlights: [
      'CallKeep shows the native incoming-call screen, so the call looks real.',
      'Firebase schedules the call and push notifications deliver it.',
      'Home-screen widgets, and subscriptions through RevenueCat.',
    ],
    stack: ['React Native', 'Expo', 'Firebase', 'CallKeep', 'RevenueCat'],
  },
];

export const skills = {
  languages: ['Python', 'TypeScript', 'Java', 'Scala', 'C++', 'SQL'],
  product: ['React', 'React Native', 'Next.js'],
  platform: [
    'Claude',
    'Amazon Bedrock',
    'MCP',
    'SageMaker',
    'Spark/EMR',
    'DynamoDB',
    'OpenSearch',
    'Firebase',
    'PyTorch',
    'TensorFlow',
    'AWS',
  ],
} as const;
