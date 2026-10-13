import type { CaseFile } from './types';

/**
 * The longer story behind each system in the Experience trace. Amazon work is described
 * by what it does, not by internal names, and every number matches the resume.
 */
export const caseFiles: CaseFile[] = [
  {
    slug: 'pitching-agent',
    spanId: 'pitching-agent',
    title: 'Pitching Agent',
    role: 'Architect and tech lead',
    when: '2025 to now (approx.)',
    summary:
      'A conversational agent that researches an advertiser’s account and drafts a pitch deck in about five minutes, down from two hours by hand.',
    problem: [
      'Building a pitch by hand took about two hours: pull metrics from several tools, pick the insights that matter, write the story, then make the slides.',
      'The insights already existed in our platforms. Nothing could turn them into a narrative on demand.',
    ],
    built: [
      'A conversational agent on Claude through Amazon Bedrock. It runs in a container runtime that keeps session state, conversation history, and generated files.',
      'An MCP gateway that gives the model more than 40 tools, including SQL analysis, insight lookups through the Insights API, charting, and analysis of customer feedback.',
      'A generation flow that researches the account, chooses insights, writes the narrative, and renders a slide deck with charts and recommendations.',
      'Runtime guardrails, and the governance review needed to put an AI agent in front of sellers.',
    ],
    diagram: {
      cols: 5,
      rows: 4,
      nodes: [
        { id: 'user', label: 'Seller', col: 0, row: 1 },
        { id: 'agent', label: 'Agent runtime', col: 1, row: 1 },
        { id: 'llm', label: 'Claude', col: 2, row: 0 },
        { id: 'mcp', label: 'MCP gateway', col: 2, row: 2 },
        { id: 'api', label: 'Insights API', col: 3, row: 1 },
        { id: 'sql', label: 'SQL analysis', col: 3, row: 2 },
        { id: 'charts', label: 'Charts', col: 3, row: 3 },
        { id: 'deck', label: 'Pitch deck', col: 4, row: 1 },
      ],
      edges: [
        { from: 'user', to: 'agent', label: 'asks' },
        { from: 'agent', to: 'llm', label: 'reasons' },
        { from: 'agent', to: 'mcp', label: 'tool calls' },
        { from: 'mcp', to: 'api' },
        { from: 'mcp', to: 'sql' },
        { from: 'mcp', to: 'charts' },
        { from: 'agent', to: 'deck', label: 'writes' },
      ],
    },
    decisions: [
      {
        title: 'Tools behind MCP, not custom integrations',
        body: 'Each data team exposes its capability as MCP tools behind one gateway. A new capability ships without a change to the agent.',
      },
      {
        title: 'Stop resending a 16,000-token prompt',
        body: 'The first version sent a 16,000-token system prompt on every model call. I split it so each step loads only the context it needs, which cut the cost and latency of each call.',
      },
      {
        title: 'Guardrails in code',
        body: 'The runtime enforces the agent’s limits. The prompt states them too, but only code holds when the model drifts.',
      },
    ],
    impact: [
      { value: '5,000', label: 'sellers served' },
      { value: '300', label: 'requests a minute at peak' },
      { value: '2h → 5m', label: 'to build a pitch' },
      { value: '100K+', label: 'hours saved a year' },
      { value: '40+', label: 'MCP tools' },
    ],
    stack: ['Python', 'Claude', 'Amazon Bedrock', 'MCP', 'ECS', 'Lambda', 'DynamoDB', 'S3'],
  },
  {
    slug: 'agent-architecture',
    spanId: 'agent-architecture',
    title: 'Agent architecture',
    role: 'Architect, with Principal Engineers',
    when: '2026 to now (approx.)',
    summary:
      'An architecture that puts four teams’ AI capabilities behind a single domain agent, so a calling product talks to one agent instead of coordinating four.',
    problem: [
      'Four teams were each building an agent. A product that wanted research, a chart, and a narrative had to know about all of them and stitch the answers together itself.',
      'Each team was also solving routing, memory, and security on its own.',
    ],
    built: [
      'A three-layer design. Each capability is an MCP server. A domain agent routes requests by intent, chains capabilities together, and keeps session memory. A registration layer holds interface contracts and latency budgets.',
      'Trust zones between capabilities, so one tool’s permissions never reach another’s.',
      'A plan to grow the existing Pitching Agent into the domain agent, so the team writing narratives didn’t have to rebuild anything.',
      'I set this direction with Principal Engineers and took it through review with org leadership.',
    ],
    diagram: {
      cols: 5,
      rows: 4,
      nodes: [
        { id: 'caller', label: 'Calling app', col: 0, row: 1 },
        { id: 'core', label: 'Domain agent', col: 1, row: 1 },
        { id: 'registry', label: 'Contracts', col: 1, row: 3 },
        { id: 'research', label: 'Research', col: 3, row: 0 },
        { id: 'charts', label: 'Charts', col: 3, row: 1 },
        { id: 'narrative', label: 'Narrative', col: 3, row: 2 },
        { id: 'search', label: 'Search', col: 3, row: 3 },
      ],
      edges: [
        { from: 'caller', to: 'core', label: 'one call' },
        { from: 'core', to: 'research' },
        { from: 'core', to: 'charts' },
        { from: 'core', to: 'narrative' },
        { from: 'core', to: 'search' },
        { from: 'registry', to: 'core', label: 'registers' },
      ],
    },
    decisions: [
      {
        title: 'One agent at the boundary',
        body: 'Callers integrate once. Adding a capability means registering MCP tools, not asking every consumer to change.',
      },
      {
        title: 'Contracts and latency budgets first',
        body: 'Each capability registers against an interface contract with a latency budget, so teams ship on their own schedules and a combined answer stays fast.',
      },
      {
        title: 'Extend the Pitching Agent',
        body: 'The domain agent starts from the Pitching Agent’s runtime, which already serves 5,000 sellers, instead of a new codebase.',
      },
    ],
    impact: [
      { value: '4', label: 'teams behind one agent' },
      { value: '50', label: 'engineers in the org it covers' },
    ],
    stack: ['MCP', 'Claude', 'Amazon Bedrock', 'Agent-to-agent protocol', 'Python', 'ECS'],
  },
  {
    slug: 'genai-adoption',
    spanId: 'genai-adoption',
    title: 'GenAI adoption',
    role: 'Organizer and co-author',
    when: '2025 to now (approx.)',
    summary:
      'A tech talk series I started, an adoption plan I co-wrote, and two tools I shared with the org: an LLM code reviewer and a design-doc knowledge base for coding agents.',
    problem: [
      'Engineers wanted to use GenAI but had no shared practices, tools, or place to learn from each other.',
    ],
    built: [
      'A recurring GenAI tech talk series that I started and run, with speakers from across the org.',
      'The org’s GenAI adoption plan, which I co-wrote, and the working group that carries it out.',
      'An LLM code reviewer that reads a git diff and comments on it.',
      'A knowledge base that feeds the team’s existing design docs to coding agents.',
    ],
    diagram: {
      cols: 3,
      rows: 3,
      nodes: [
        { id: 'docs', label: 'Design docs', col: 0, row: 0 },
        { id: 'kb', label: 'Knowledge base', col: 1, row: 0 },
        { id: 'agents', label: 'Coding agents', col: 2, row: 0 },
        { id: 'diff', label: 'Git diff', col: 0, row: 2 },
        { id: 'judge', label: 'LLM reviewer', col: 1, row: 2 },
        { id: 'comments', label: 'Review notes', col: 2, row: 2 },
      ],
      edges: [
        { from: 'docs', to: 'kb' },
        { from: 'kb', to: 'agents' },
        { from: 'diff', to: 'judge' },
        { from: 'judge', to: 'comments' },
      ],
    },
    decisions: [
      {
        title: 'Use the docs we already write',
        body: 'The knowledge base reads existing design docs, so it costs no extra work and stays current as the docs change.',
      },
      {
        title: 'Talks over one-on-one help',
        body: 'One talk reaches more engineers than one-on-one help can, and the series turns up tools other teams can reuse.',
      },
    ],
    impact: [
      { value: 'Started', label: 'the org’s GenAI talk series' },
      { value: 'Co-wrote', label: 'the org’s GenAI adoption plan' },
      { value: '2', label: 'AI tools shared across the org' },
    ],
    stack: ['Claude', 'Amazon Bedrock', 'Python', 'MCP'],
  },
  {
    slug: 'pipeline-orchestration',
    spanId: 'pipeline-orchestration',
    title: 'Pipeline orchestration',
    role: 'Architect',
    when: '2025 (approx.)',
    summary:
      'One service that starts more than 2,000 Spark jobs over hundreds of petabytes a month as soon as their input data lands, in place of cron jobs and manual runs.',
    problem: [
      'Metric pipelines were started by a mix of cron jobs and manual runs. A full refresh took about two weeks.',
      'When upstream data landed, nobody could easily tell which downstream jobs needed to run.',
    ],
    built: [
      'An orchestration service on the company’s internal workflow engine, with dependency tracking, retries, and monitoring.',
      'Dependency resolution from upstream success markers. When data lands, the service works out which jobs to run next.',
      'A migration of every metric provider onto the service. It turned up jobs that wrote their success markers to the wrong place, which I fixed along the way.',
    ],
    diagram: {
      cols: 5,
      rows: 3,
      nodes: [
        { id: 'upstream', label: 'Upstream data', col: 0, row: 1 },
        { id: 'markers', label: 'Ready markers', col: 1, row: 1 },
        { id: 'orch', label: 'Orchestrator', col: 2, row: 1 },
        { id: 'retry', label: 'Retries/alarms', col: 2, row: 2 },
        { id: 'spark', label: 'Spark on EMR', col: 3, row: 1 },
        { id: 'metrics', label: 'Metric stores', col: 4, row: 1 },
      ],
      edges: [
        { from: 'upstream', to: 'markers' },
        { from: 'markers', to: 'orch', label: 'ready' },
        { from: 'orch', to: 'retry' },
        { from: 'orch', to: 'spark', label: 'runs' },
        { from: 'spark', to: 'metrics' },
      ],
    },
    decisions: [
      {
        title: 'Start jobs when their inputs exist',
        body: 'Jobs run when their data is ready, not on a timer, so refreshes happen as early as possible and never read stale inputs.',
      },
      {
        title: 'Migrate every provider',
        body: 'Keeping cron jobs alongside the new service would have left two answers to “is this data ready?”, so I moved every metric provider over.',
      },
    ],
    impact: [
      { value: '2,000+', label: 'Spark/EMR jobs' },
      { value: '100s of PB', label: 'processed a month' },
      { value: '~40%', label: 'lower compute cost' },
      { value: '2w → <1w', label: 'full refresh time' },
    ],
    stack: ['Java', 'Spark', 'EMR', 'S3', 'Lambda', 'DynamoDB', 'CloudWatch'],
  },
  {
    slug: 'study-recommendations',
    spanId: 'study-recommendations',
    title: 'Measurement study recommendations',
    role: 'Tech lead, team of four',
    when: '2024 to 2025 (approx.)',
    summary:
      'A platform that recommends the right third-party measurement study in under two minutes instead of four hours.',
    problem: [
      'Choosing a third-party measurement study meant working through vendors and eligibility rules by hand, about four hours each time.',
      'The eligibility rules change often, so they couldn’t be hard-coded.',
    ],
    built: [
      'A configurable rules engine for study eligibility, and a store for vendor metadata.',
      'A SageMaker model that ranks the eligible studies, with an LLM-written explanation for each recommendation.',
      'React UIs. I designed the UX mocks myself, which is what got the partner org on board.',
      'I led four engineers and worked with the UX, sales, and Salesforce teams on the product plan.',
    ],
    diagram: {
      cols: 5,
      rows: 3,
      nodes: [
        { id: 'user', label: 'Requester', col: 0, row: 1 },
        { id: 'ui', label: 'React UI', col: 1, row: 1 },
        { id: 'api', label: 'Recommender', col: 2, row: 1 },
        { id: 'rules', label: 'Rules engine', col: 3, row: 0 },
        { id: 'model', label: 'SageMaker', col: 3, row: 1 },
        { id: 'llm', label: 'Explanations', col: 3, row: 2 },
        { id: 'vendors', label: 'Vendor data', col: 4, row: 0 },
      ],
      edges: [
        { from: 'user', to: 'ui' },
        { from: 'ui', to: 'api' },
        { from: 'api', to: 'rules', label: 'filter' },
        { from: 'api', to: 'model', label: 'rank' },
        { from: 'api', to: 'llm', label: 'explain' },
        { from: 'rules', to: 'vendors' },
      ],
    },
    decisions: [
      {
        title: 'Rules as configuration',
        body: 'Eligibility lives in a rules engine the business can change without a deploy. The model only ranks what the rules allow.',
      },
      {
        title: 'Explain every recommendation',
        body: 'Each pick comes with a plain-language reason, so people can check it instead of trusting a score.',
      },
      {
        title: 'Mocks before APIs',
        body: 'I drew the UX first. The mocks settled the requirements with the partner org faster than design documents did.',
      },
    ],
    impact: [
      { value: '4h → <2m', label: 'to choose a study' },
      { value: '4', label: 'engineers led' },
    ],
    stack: ['Java', 'React', 'SageMaker', 'DynamoDB', 'API Gateway', 'CDK', 'Salesforce'],
  },
  {
    slug: 'insights-api',
    spanId: 'insights-api',
    title: 'Insights API',
    role: 'Architect and tech lead',
    when: '2023 to 2025 (approx.)',
    summary:
      'The shared API that products, backend services, and AI agents use to find and serve advertising insights.',
    problem: [
      'Insights came out of many pipelines and were served in many one-off ways. Every new product rebuilt the same plumbing.',
      'Search over a billion records was too slow for interactive use or for agents.',
    ],
    built: [
      'A layered model: metrics combine into insight types, and types group into families. Consumers ask for an insight, not a table.',
      'Signals with dependency resolution. When upstream data refreshes, the API works out which insights are now stale and starts the pipelines that rebuild them.',
      'OpenSearch indexes for search over 1.2 billion records, 1,000 times faster than before.',
      'It grew into a shared platform for three UIs, more than 12 backend services, recommendation systems, and GenAI workflows. I then handed ownership to the team.',
    ],
    diagram: {
      cols: 4,
      rows: 3,
      nodes: [
        { id: 'uis', label: 'Product UIs', col: 0, row: 0 },
        { id: 'services', label: 'Services', col: 0, row: 1 },
        { id: 'agents', label: 'AI agents', col: 0, row: 2 },
        { id: 'api', label: 'Insights API', col: 1, row: 1 },
        { id: 'signals', label: 'Signals', col: 2, row: 0 },
        { id: 'store', label: 'Insight store', col: 2, row: 1 },
        { id: 'index', label: 'OpenSearch', col: 2, row: 2 },
        { id: 'pipelines', label: 'Pipelines', col: 3, row: 0 },
      ],
      edges: [
        { from: 'uis', to: 'api' },
        { from: 'services', to: 'api' },
        { from: 'agents', to: 'api' },
        { from: 'api', to: 'signals' },
        { from: 'api', to: 'store' },
        { from: 'api', to: 'index', label: 'search' },
        { from: 'signals', to: 'pipelines', label: 'rebuild' },
      ],
    },
    decisions: [
      {
        title: 'Insight types, not tables',
        body: 'The metric, type, and family layers let new insights reuse existing pieces, and they gave models and agents a vocabulary to ask with.',
      },
      {
        title: 'Push freshness instead of polling',
        body: 'Upstream refreshes emit signals and the API decides what is stale, so consumers never have to check.',
      },
      {
        title: 'Index for search',
        body: 'Moving search onto OpenSearch made it 1,000 times faster, fast enough for people and agents to use interactively.',
      },
    ],
    impact: [
      { value: '1.2B', label: 'records a month' },
      { value: '10M+', label: 'requests a month' },
      { value: '100 TPS', label: 'at peak' },
      { value: '1,000×', label: 'faster search' },
      { value: '12+', label: 'backend services, plus 3 UIs' },
    ],
    stack: ['Java', 'Lambda', 'API Gateway', 'DynamoDB', 'OpenSearch', 'S3', 'CDK'],
  },
  {
    slug: 'insights-store',
    spanId: 'insights-store',
    title: 'Insights store',
    role: 'Designer and owner',
    when: '2023 to 2024 (approx.)',
    summary:
      'The storage and serving layer behind the Insights API. A new insight is onboarded with a config file, not code.',
    problem: [
      'The old store had grown around one-off integrations. Adding a new insight meant writing custom code, and stale data was hard to trace.',
    ],
    built: [
      'A redesign of the store and its serving layer, based on the failures we had seen in the old one.',
      'Onboarding by configuration: an insight owner registers content with a config file instead of new code.',
      'An ingestion layer for several upstream data providers, with dependency signals that keep data fresh.',
      'Runbooks and operational tools so other engineers could troubleshoot it themselves.',
    ],
    diagram: {
      cols: 5,
      rows: 2,
      nodes: [
        { id: 'providers', label: 'Data providers', col: 0, row: 1 },
        { id: 'ingest', label: 'Ingestion', col: 1, row: 1 },
        { id: 'config', label: 'Owner configs', col: 2, row: 0 },
        { id: 'store', label: 'Insights store', col: 2, row: 1 },
        { id: 'serve', label: 'Serving layer', col: 3, row: 1 },
        { id: 'products', label: 'Products', col: 4, row: 1 },
      ],
      edges: [
        { from: 'providers', to: 'ingest' },
        { from: 'ingest', to: 'store' },
        { from: 'config', to: 'store', label: 'registers' },
        { from: 'store', to: 'serve' },
        { from: 'serve', to: 'products' },
      ],
    },
    decisions: [
      {
        title: 'Config over code',
        body: 'Owners describe their insight in a config file and the store does the rest, so onboarding stopped waiting on the store team.',
      },
      {
        title: 'Design from the old failures',
        body: 'I started the redesign from what had gone wrong in the legacy store and wrote it up so the team could own it after me.',
      },
    ],
    impact: [],
    stack: ['Java', 'Lambda', 'DynamoDB', 'S3', 'API Gateway', 'CDK'],
  },
  {
    slug: 'identity-cache',
    spanId: 'identity-cache',
    title: 'Cross-VPC identity cache',
    role: 'Designer and builder',
    when: '2022 to 2023 (approx.)',
    summary:
      'A DynamoDB cache that lets pipelines in many VPCs share pseudonymized identity lookups, with 97–99% hit rates in three regions.',
    problem: [
      'A privacy change moved our advertising pipelines to pseudonymized identifiers.',
      'The default cache was a Redis cluster inside one VPC. Our pipelines run across many.',
    ],
    built: [
      'A DynamoDB cache shared across VPCs, built with another team by extending their implementation.',
      'A warm-up order: smaller jobs fill the cache first, then the largest jobs read from it on staggered schedules so the table is never overloaded.',
      'A four-phase rollout: shadow mode on 20% of traffic, then 25%, 50%, and 100%, then removal of the old path. All traffic moved in 3.5 weeks.',
      'Support for GDPR deletion.',
    ],
    diagram: {
      cols: 4,
      rows: 3,
      nodes: [
        { id: 'warm', label: 'Warm-up jobs', col: 0, row: 0 },
        { id: 'large', label: 'Large jobs', col: 0, row: 2 },
        { id: 'cache', label: 'DynamoDB cache', col: 1, row: 1 },
        { id: 'service', label: 'Pseudonymizer', col: 2, row: 1 },
        { id: 'regions', label: '3 regions', col: 3, row: 1 },
      ],
      edges: [
        { from: 'warm', to: 'cache', label: 'fill' },
        { from: 'large', to: 'cache', label: 'read' },
        { from: 'cache', to: 'service', label: 'on miss' },
        { from: 'service', to: 'regions' },
      ],
    },
    decisions: [
      {
        title: 'DynamoDB over Redis',
        body: 'DynamoDB access is controlled by IAM, not network placement, so pipelines in any VPC could share one table without peering.',
      },
      {
        title: 'Warm first, then stagger',
        body: 'Filling the cache with the smaller jobs and staggering the large ones kept hit rates high without overloading the table.',
      },
      {
        title: 'Shadow before switching',
        body: 'The new path ran in shadow, and we compared its output with the old path’s before any customer-facing report used it.',
      },
    ],
    impact: [
      { value: '97–99%', label: 'cache hit rate in 3 regions' },
      { value: '3B+', label: 'pseudonymized records a month' },
      { value: '3.5 weeks', label: 'to move all traffic' },
    ],
    stack: ['DynamoDB', 'Spark', 'EMR', 'Scala', 'Java', 'CloudWatch'],
  },
  {
    slug: 'oauth-oidc',
    spanId: 'oauth-oidc',
    title: 'OAuth and OIDC sign-in',
    role: 'Full-stack developer',
    when: 'Jul 2021 to Jul 2022',
    summary:
      'Security applications for internal AT&T teams, and a move from each app’s own login to OAuth 2.0 and OpenID Connect.',
    problem: [
      'Every internal security app carried its own legacy login flow. They were hard to maintain and behind current security standards.',
    ],
    built: [
      'Full-stack security applications in AngularJS, Express, and MySQL, built from what the stakeholder teams asked for.',
      'A shared OAuth 2.0 and OpenID Connect sign-in that replaced the per-app login flows.',
    ],
    diagram: {
      cols: 3,
      rows: 3,
      nodes: [
        { id: 'user', label: 'Employee', col: 0, row: 1 },
        { id: 'app', label: 'Security app', col: 1, row: 1 },
        { id: 'db', label: 'MySQL', col: 1, row: 2 },
        { id: 'idp', label: 'OIDC provider', col: 2, row: 1 },
      ],
      edges: [
        { from: 'user', to: 'app' },
        { from: 'app', to: 'idp', label: 'sign in' },
        { from: 'app', to: 'db' },
      ],
    },
    decisions: [
      {
        title: 'Standards over custom auth',
        body: 'With OAuth 2.0 and OIDC, the apps hand sign-in to an identity provider instead of checking passwords themselves, so there is one login path to secure.',
      },
    ],
    impact: [{ value: 'OIDC', label: 'in place of per-app logins' }],
    stack: ['AngularJS', 'Express', 'MySQL', 'OAuth 2.0', 'OpenID Connect'],
  },
  {
    slug: 'behavioral-syllables',
    spanId: 'behavioral-syllables',
    title: 'Behavioral syllables',
    role: 'Lead developer and data analyst',
    when: 'Sep 2018 to May 2021',
    summary:
      'Computer-vision tools for a Tourette syndrome study that split recorded behavior into discrete “syllables” with an autoregressive hidden Markov model.',
    problem: [
      'Researchers needed to turn hours of video into behavior they could measure. Doing it by eye was slow and subjective.',
    ],
    built: [
      'I led five developers across four universities building tools for the lab’s researchers in Electron and Python.',
      'Workflows that use an autoregressive hidden Markov model to segment behavior into syllables.',
      'TensorFlow and PyTorch experiments on a 100-node SLURM GPU cluster.',
    ],
    diagram: {
      cols: 4,
      rows: 3,
      nodes: [
        { id: 'video', label: 'Video', col: 0, row: 1 },
        { id: 'features', label: 'Features', col: 1, row: 1 },
        { id: 'hmm', label: 'AR-HMM', col: 2, row: 1 },
        { id: 'cluster', label: 'GPU cluster', col: 2, row: 2 },
        { id: 'syllables', label: 'Syllables', col: 3, row: 1 },
      ],
      edges: [
        { from: 'video', to: 'features' },
        { from: 'features', to: 'hmm' },
        { from: 'cluster', to: 'hmm', label: 'trains' },
        { from: 'hmm', to: 'syllables' },
      ],
    },
    decisions: [
      {
        title: 'Syllables instead of raw motion',
        body: 'A small vocabulary of behavioral syllables made behavior countable and comparable across subjects.',
      },
      {
        title: 'Tools researchers run themselves',
        body: 'We built desktop apps so researchers could run the pipeline without a developer in the room.',
      },
    ],
    impact: [
      { value: '5', label: 'developers led, across 4 universities' },
      { value: '100-node', label: 'GPU cluster' },
    ],
    stack: ['Python', 'Electron', 'TensorFlow', 'PyTorch', 'SLURM'],
  },
];

export function caseFileBySlug(slug: string): CaseFile | undefined {
  return caseFiles.find((c) => c.slug === slug);
}
