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
    'I’m a senior software engineer at Amazon Ads in New York. I build AI agents and the data infrastructure underneath them.',
  about: [
    'A lot of my work takes a job people did by hand and gets it down to minutes. I designed the Pitching Agent and I’m its tech lead. It turns an advertiser’s account data into a pitch deck in about five minutes, down from two hours. It serves 5,000 Amazon Ads sellers and saves more than 100,000 hours a year.',
    'I also designed the domain agent that now sits in front of four teams’ AI tools. A product integrates once and gets all four.',
    'Before agents, I worked on data infrastructure. I led the Insights API, which serves 1.2 billion records a month. I also built the service that runs 2,000+ Spark jobs over tens of petabytes a month, which cut their compute cost by about 40%.',
    'I started out in a Rutgers research lab, turning video of behavior into data for a Tourette syndrome study. Then I built security apps at AT&T, and I joined Amazon Ads in 2022.',
    'At Amazon I mentor new grads and sit on promotion panels, and I started my org’s GenAI talk series. On the side I build small apps. The latest is Counterdex, a Pokémon team builder.',
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
    summary: 'I started in a research lab at Rutgers and worked at AT&T before joining Amazon Ads.',
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
      'Led five developers across four universities building computer-vision tools that turn video of behavior into data for a Tourette syndrome study.',
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
      'Turned hours of video into behavior researchers could count, using an autoregressive hidden Markov model to split it into “syllables”.',
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
      'Built internal security apps for AT&T’s Chief Security Organization and moved their logins to OAuth 2.0 and OpenID Connect.',
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
      'Replaced every app’s home-grown login with one shared OAuth 2.0 and OIDC sign-in, leaving a single login path to secure.',
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
      'I build AI agents, recommendation services, APIs and data pipelines. I was promoted to L6 in 2025.',
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
      'Built a DynamoDB cache so pipelines in any VPC could look up pseudonymized IDs after a privacy change. It hits 97–99% of the time in three regions.',
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
      'Redesigned the storage and serving layer behind the Insights API. Teams now add a new insight by writing a config file.',
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
      'Designed and led one API for advertising insights, shared by product UIs, backend services and AI agents. It serves 1.2 billion records a month.',
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
      'Led a team of four building a tool that picks a third-party measurement study in under two minutes, down from four hours. An LLM explains each pick.',
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
      'Built a service that starts each of 2,000+ Spark jobs the moment its input data lands. Compute cost fell by about 40%, and a full refresh went from two weeks to under one.',
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
      'Designed an AI agent on Claude and Amazon Bedrock that turns account data into a pitch deck in five minutes, down from two hours. It serves 5,000 sellers.',
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
      'Started my org’s GenAI talk series and co-wrote its adoption plan. I also shared two AI tools across the org.',
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
      'Designed one agent in front of four teams’ AI tools, so a product integrates once to reach all of them. It’s live in production.',
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
      'A Pokémon team builder that finds a counter team for any team you give it. It also tells you when PokéAPI changes a Pokémon you rely on.',
    highlights: [
      'A sync job makes about 3,000 PokéAPI requests and keeps a before-and-after snapshot of every change, so you can see exactly what moved.',
      'Checking every possible team would mean about 1.6 quadrillion combinations, so Counterdex builds the counter one pick at a time from pairwise matchup scores.',
    ],
    stack: ['React', 'Vite', 'TanStack Query', 'FastAPI', 'SQLAlchemy', 'Postgres', 'Vercel'],
  },
  {
    id: 'docly',
    name: 'Docly',
    url: 'https://askdocly.com',
    summary:
      'Upload a document and Docly summarizes it and flags the risks worth a second look. Every answer to your questions cites the part of the document it came from.',
    highlights: [
      'It runs on the web with Next.js and on phones with React Native.',
      'Claude reads the document and answers questions. Stripe handles billing on the web, and in-app purchases handle it on mobile.',
    ],
    stack: ['Next.js', 'React Native', 'Claude', 'Firebase', 'Stripe'],
  },
  {
    id: 'dateescape',
    name: 'DateEscape',
    url: 'https://dateescape.app',
    summary: 'Schedules a realistic fake phone call so you have an easy way out of a bad date.',
    highlights: [
      'CallKeep puts the call on the phone’s real incoming-call screen, so nobody can tell it apart from a normal call.',
      'Firebase schedules the calls and RevenueCat handles subscriptions.',
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
