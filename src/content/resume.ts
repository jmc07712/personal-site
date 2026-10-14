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
    'I’m a senior software engineer at Amazon Ads in New York, where I build AI agents and the data infrastructure that supports them.',
  about: [
    'I designed and serve as tech lead for the Pitching Agent, an AI agent that turns an advertiser’s account data into a complete pitch deck. It cut pitch preparation from two hours to about five minutes. Today it serves 5,000 Amazon Ads sellers and saves more than 100,000 hours a year.',
    'I also designed the domain agent that places four teams’ AI capabilities behind a single interface, so products integrate once to reach all of them. It is now live in production.',
    'Earlier at Amazon, I focused on data infrastructure. I led the Insights API, which serves 1.2 billion records a month. I also built an orchestration service that runs more than 2,000 Spark jobs over tens of petabytes a month and cut their compute costs by about 40%.',
    'Before Amazon, I built internal security applications at AT&T. At Rutgers, I led five developers building computer-vision tools for a Tourette syndrome study.',
    'Within my organization, I mentor new graduates and serve on promotion panels. I also founded its GenAI talk series. Outside of work, I build independent apps, most recently Counterdex, a Pokémon team builder.',
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
      'I began in a research lab at Rutgers and worked at AT&T before joining Amazon Ads in 2022.',
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
      'Led five developers across four universities building computer-vision tools that convert video of behavior into data for a Tourette syndrome study.',
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
      'Converted hours of video into quantifiable behavior, using an autoregressive hidden Markov model to segment it into “syllables”.',
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
      'Built internal security applications for AT&T’s Chief Security Organization and migrated their sign-in to OAuth 2.0 and OpenID Connect.',
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
    summary:
      'Replaced each application’s legacy login with a shared OAuth 2.0 and OIDC sign-in, leaving a single login path to secure.',
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
      'I build AI agents, recommendation services, APIs and data pipelines, and I was promoted to L6 in 2025.',
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
      'Built a DynamoDB cache that lets pipelines in any VPC look up pseudonymized IDs, with a 97–99% hit rate across three regions.',
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
      'Redesigned the storage and serving layer behind the Insights API so teams can onboard new insights through configuration.',
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
    summary:
      'Designed and led a shared API for advertising insights used by product UIs, backend services and AI agents. It serves 1.2 billion records a month.',
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
      'Led a team of four building a tool that recommends third-party measurement studies in under two minutes, down from four hours, with an LLM-written rationale for each.',
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
      'Built a service that starts each of more than 2,000 Spark jobs as soon as its input data lands. It cut compute costs by about 40% and full refresh time from two weeks to under one.',
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
      'Designed an AI agent on Claude and Amazon Bedrock that builds pitch decks from account data, reducing a two-hour task to about five minutes. It serves 5,000 sellers.',
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
      'Founded my organization’s GenAI talk series and co-wrote its adoption plan. I also shared two internal AI tools across the organization.',
    metrics: [{ value: '2', label: 'internal AI tools shared across the org' }],
    stack: ['Claude', 'Amazon Bedrock', 'Python'],
  },
  {
    id: 'domain-agent',
    name: 'Domain agent',
    kind: 'system',
    parent: 'amazon-ads',
    from: '2026-01',
    to: 'now',
    approx: true,
    summary:
      'Designed a single agent that fronts four teams’ AI capabilities, so products integrate once. It is live in production.',
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
      'A Pokémon team builder that generates a counter team for any lineup and alerts you when PokéAPI changes a Pokémon you use.',
    highlights: [
      'A sync job makes about 3,000 PokéAPI requests and stores before-and-after snapshots, so users can review exactly what changed.',
      'Evaluating every possible team would mean about 1.6 quadrillion combinations, so Counterdex builds counters one pick at a time from pairwise matchup scores.',
    ],
    stack: ['React', 'Vite', 'TanStack Query', 'FastAPI', 'SQLAlchemy', 'Postgres', 'Vercel'],
  },
  {
    id: 'docly',
    name: 'Docly',
    url: 'https://askdocly.com',
    summary:
      'Docly summarizes uploaded documents and flags potential risks. Answers to your questions cite the passage they come from.',
    highlights: [
      'It is available on the web with Next.js and on mobile with React Native.',
      'Claude analyzes each document and answers questions. Billing runs on Stripe for the web and on in-app purchases for mobile.',
    ],
    stack: ['Next.js', 'React Native', 'Claude', 'Firebase', 'Stripe'],
  },
  {
    id: 'dateescape',
    name: 'DateEscape',
    url: 'https://dateescape.app',
    summary:
      'Schedules a realistic incoming phone call that gives you a graceful exit from a bad date.',
    highlights: [
      'CallKeep displays the call on the phone’s native incoming-call screen, making it indistinguishable from a real call.',
      'Firebase schedules the calls, and RevenueCat manages subscriptions.',
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
