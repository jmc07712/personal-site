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
      'I designed an AI agent that researches an advertiser’s account and drafts a full pitch deck in about five minutes. Sellers used to spend about two hours on each one. It now serves 5,000 sellers and saves more than 100,000 hours a year.',
    problem: [
      'Building a pitch meant pulling metrics from several tools and choosing the insights that mattered. Then someone had to write the story and make the slides.',
      'The insights already existed in our platforms. Nothing could turn them into a story on demand.',
    ],
    built: [
      'A conversational agent on Claude through Amazon Bedrock. Its container runtime keeps each session’s history and generated files, so a conversation picks up where it left off.',
      'An MCP gateway that gives the model more than 40 tools. They cover SQL analysis, insight lookups through the Insights API, charting and customer-feedback analysis.',
      'A generation flow that researches the account and writes the narrative, then renders a slide deck of charts and recommendations.',
      'Runtime guardrails, plus the governance review it took to put an AI agent in front of sellers.',
    ],
    diagram: {
      cols: 5,
      rows: 5,
      nodes: [
        { id: 'user', label: 'Seller', col: 0, row: 1, kind: 'actor' },
        { id: 'agent', label: 'Agent runtime', col: 1, row: 1, kind: 'agent' },
        { id: 'llm', label: 'Claude', col: 2, row: 0, kind: 'model' },
        { id: 'deck', label: 'Pitch deck', col: 4, row: 1, kind: 'doc' },
        { id: 'mcp', label: 'MCP gateway', col: 2, row: 3, kind: 'service' },
        { id: 'api', label: 'Insights API', col: 3, row: 2, kind: 'service' },
        { id: 'sql', label: 'SQL analysis', col: 3, row: 3, kind: 'store' },
        { id: 'charts', label: 'Charts', col: 3, row: 4, kind: 'service' },
      ],
      groups: [{ label: 'MCP tools', nodes: ['api', 'sql', 'charts'] }],
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
        title: 'Tools behind MCP',
        body: 'Each data team publishes its capability as MCP tools behind one gateway. A new capability reaches the agent through the gateway, and the agent’s code stays the same.',
      },
      {
        title: 'Load context per step',
        body: 'The first version sent a 16,000-token prompt on every call. I split it so each step loads only the context it needs, which made every call cheaper and faster.',
      },
      {
        title: 'Guardrails in code',
        body: 'I put the agent’s limits in the runtime’s code. The prompt states them too, but users can talk a model past its prompt, so the code is what holds.',
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
    slug: 'domain-agent',
    spanId: 'domain-agent',
    title: 'Domain agent',
    role: 'Architect, with Principal Engineers',
    when: '2026 to now (approx.)',
    summary:
      'I designed one agent that sits in front of four teams’ AI tools. A product integrates once and gets research, charts, narrative and search. It’s live in production.',
    problem: [
      'Four teams were each building their own agent. A product that wanted research and a chart had to call each agent and stitch the answers together itself.',
      'Each team was also solving routing and security on its own.',
    ],
    built: [
      'The design has three layers. Each capability runs as an MCP server, and a domain agent in front routes each request by intent and chains capabilities together. A registration layer holds each capability’s interface contract and latency budget.',
      'Trust zones that keep each tool’s permissions inside its own capability.',
      'A plan to grow the existing Pitching Agent into the domain agent.',
      'I set the direction with Principal Engineers and took it through review with org leadership.',
    ],
    diagram: {
      cols: 5,
      rows: 4,
      nodes: [
        { id: 'caller', label: 'Calling app', col: 0, row: 1, kind: 'service' },
        { id: 'core', label: 'Domain agent', col: 1, row: 1, kind: 'agent' },
        { id: 'registry', label: 'Contracts', col: 1, row: 3, kind: 'doc' },
        { id: 'research', label: 'Research', col: 3, row: 0, kind: 'service' },
        { id: 'charts', label: 'Charts', col: 3, row: 1, kind: 'service' },
        { id: 'narrative', label: 'Narrative', col: 3, row: 2, kind: 'service' },
        { id: 'search', label: 'Search', col: 3, row: 3, kind: 'service' },
      ],
      groups: [{ label: 'MCP servers', nodes: ['research', 'charts', 'narrative', 'search'] }],
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
        title: 'Integrate once',
        body: 'Callers talk to one agent. A team adds a capability by registering MCP tools, and the products calling the agent keep their code as it is.',
      },
      {
        title: 'Contracts and latency budgets',
        body: 'Each capability registers an interface contract and a latency budget, so teams can ship on their own schedules and still trust each other’s interfaces.',
      },
      {
        title: 'Built on the Pitching Agent',
        body: 'I built the domain agent on the Pitching Agent’s runtime, which was already serving sellers in production.',
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
      'I started my org’s GenAI talk series and co-wrote its adoption plan. I also shared two AI tools across the org, an LLM code reviewer and a knowledge base that gives coding agents the team’s design docs.',
    problem: ['Engineers wanted to use GenAI, and each of them was figuring it out alone.'],
    built: [
      'A recurring GenAI tech talk series that I started and run, with speakers from across the org.',
      'The org’s GenAI adoption plan, which I co-wrote, and the working group that carries it out.',
      'An LLM code reviewer that reads a git diff and comments on it.',
      'A knowledge base that gives coding agents the team’s existing design docs, so the code they write follows decisions the team already made.',
    ],
    diagram: {
      cols: 3,
      rows: 3,
      nodes: [
        { id: 'docs', label: 'Design docs', col: 0, row: 0, kind: 'doc' },
        { id: 'kb', label: 'Knowledge base', col: 1, row: 0, kind: 'store' },
        { id: 'agents', label: 'Coding agents', col: 2, row: 0, kind: 'agent' },
        { id: 'diff', label: 'Git diff', col: 0, row: 2, kind: 'doc' },
        { id: 'judge', label: 'LLM reviewer', col: 1, row: 2, kind: 'model' },
        { id: 'comments', label: 'Review notes', col: 2, row: 2, kind: 'doc' },
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
        title: 'Reuse existing docs',
        body: 'The knowledge base indexes design docs the team already writes, so it stays current on its own.',
      },
      {
        title: 'A talk series',
        body: 'I chose talks because one talk reaches more people than one-on-one help. Talks also surface tools that other teams can pick up.',
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
      'I built a service that starts 2,000+ Spark jobs over tens of petabytes a month the moment their inputs are ready. It replaced cron jobs and manual runs. Compute cost fell by about 40%, and a full refresh went from two weeks to under one.',
    problem: [
      'Metric pipelines ran on a mix of cron jobs and manual runs, and a full refresh took about two weeks.',
      'When upstream data landed, nobody could easily tell which downstream jobs needed to run.',
    ],
    built: [
      'An orchestration service on the company’s internal workflow engine that tracks dependencies and retries failed jobs.',
      'Dependency resolution from upstream success markers. When data lands, the service works out which jobs can run next and starts them.',
      'A migration of every metric provider onto the service. It also caught jobs that wrote their success markers to the wrong place, and I fixed them.',
    ],
    diagram: {
      cols: 5,
      rows: 3,
      nodes: [
        { id: 'upstream', label: 'Upstream data', col: 0, row: 1, kind: 'store' },
        { id: 'markers', label: 'Ready markers', col: 1, row: 1, kind: 'doc' },
        { id: 'orch', label: 'Orchestrator', col: 2, row: 1, kind: 'service' },
        { id: 'retry', label: 'Retries/alarms', col: 2, row: 2, kind: 'service' },
        { id: 'spark', label: 'Spark on EMR', col: 3, row: 1, kind: 'service' },
        { id: 'metrics', label: 'Metric stores', col: 4, row: 1, kind: 'store' },
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
        title: 'Run when data lands',
        body: 'Jobs start when their inputs land. Each job runs once, and its cluster starts only when its data is ready. That’s where most of the 40% compute saving came from.',
      },
      {
        title: 'Migrate every provider',
        body: 'I moved every provider over. Leaving some on cron would have meant two different answers to whether data was ready.',
      },
    ],
    impact: [
      { value: '2,000+', label: 'Spark/EMR jobs' },
      { value: '10s of PB', label: 'processed a month' },
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
      'My team of four built a tool that recommends the right third-party measurement study in under two minutes. Each pick comes with a plain-language reason. Doing it by hand took about four hours.',
    problem: [
      'Choosing a third-party measurement study meant working through vendors and eligibility rules by hand.',
      'The eligibility rules change often, so hard-coding them would have meant a deploy for every change.',
    ],
    built: [
      'A configurable rules engine for study eligibility, plus a store for vendor metadata.',
      'A SageMaker model that ranks the eligible studies, with an LLM-written explanation for each recommendation.',
      'React UIs built from UX mocks I designed myself. The mocks are what got the partner org on board.',
      'I led four engineers and planned the product alongside UX, sales and Salesforce teams.',
    ],
    diagram: {
      cols: 5,
      rows: 3,
      nodes: [
        { id: 'user', label: 'Requester', col: 0, row: 1, kind: 'actor' },
        { id: 'ui', label: 'React UI', col: 1, row: 1, kind: 'service' },
        { id: 'api', label: 'Recommender', col: 2, row: 1, kind: 'service' },
        { id: 'rules', label: 'Rules engine', col: 3, row: 0, kind: 'service' },
        { id: 'model', label: 'SageMaker', col: 3, row: 1, kind: 'model' },
        { id: 'llm', label: 'Explanations', col: 3, row: 2, kind: 'model' },
        { id: 'vendors', label: 'Vendor data', col: 4, row: 0, kind: 'store' },
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
        body: 'Eligibility rules live in a rules engine the business can change without a deploy. The model only ranks what the rules allow, so every recommendation is an eligible study.',
      },
      {
        title: 'Explain each pick',
        body: 'Every recommendation comes with a plain-language reason, so people can check the reasoning for themselves.',
      },
      {
        title: 'Mocks first',
        body: 'I designed the UX mocks before the APIs. The partner org agreed on requirements faster from mocks than from design docs.',
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
      'I designed and led one API for advertising insights, shared by product UIs, backend services and AI agents. It serves 1.2 billion records a month, and moving search to OpenSearch made it 1,000 times faster.',
    problem: [
      'Insights came out of many pipelines and were served in many one-off ways, so every new product rebuilt the same plumbing.',
      'Search over a billion records was too slow for interactive use or for agents.',
    ],
    built: [
      'A layered model where metrics combine into insight types and types group into families. Consumers ask for an insight by name.',
      'Freshness signals with dependency resolution. When upstream data refreshes, the API works out which insights are stale and starts the pipelines that rebuild them.',
      'OpenSearch indexes over 1.2 billion records, which made search 1,000 times faster.',
      'It grew into a shared platform for three UIs, more than 12 backend services, recommenders and GenAI workflows. I then handed ownership to the team.',
    ],
    diagram: {
      cols: 4,
      rows: 3,
      nodes: [
        { id: 'uis', label: 'Product UIs', col: 0, row: 0, kind: 'service' },
        { id: 'services', label: 'Services', col: 0, row: 1, kind: 'service' },
        { id: 'agents', label: 'AI agents', col: 0, row: 2, kind: 'agent' },
        { id: 'api', label: 'Insights API', col: 1, row: 1, kind: 'service' },
        { id: 'signals', label: 'Signals', col: 2, row: 0, kind: 'service' },
        { id: 'store', label: 'Insight store', col: 2, row: 1, kind: 'store' },
        { id: 'index', label: 'OpenSearch', col: 2, row: 2, kind: 'store' },
        { id: 'pipelines', label: 'Pipelines', col: 3, row: 0, kind: 'service' },
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
        title: 'A vocabulary of insights',
        body: 'New insights reuse existing metrics, and agents get a clear vocabulary of insights to ask for.',
      },
      {
        title: 'Signals for freshness',
        body: 'Rebuilds start from upstream signals, so fresh data reaches consumers on its own.',
      },
      {
        title: 'Index for search',
        body: 'At 1,000 times faster, search became fast enough for interactive UIs and for agents.',
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
      'I redesigned the storage and serving layer behind the Insights API. A team adds a new insight by writing a config file, and dependency signals keep its data fresh.',
    problem: [
      'The old store had grown around one-off integrations. Every new insight meant custom code, and stale data was hard to trace.',
    ],
    built: [
      'A redesign of the store and its serving layer, based on the failures we had seen in the old one.',
      'Config-based onboarding for new insights.',
      'An ingestion layer for several upstream data providers, with dependency signals that keep data fresh.',
      'Runbooks and operational tools so other engineers can troubleshoot it themselves.',
    ],
    diagram: {
      cols: 5,
      rows: 2,
      nodes: [
        { id: 'providers', label: 'Data providers', col: 0, row: 1, kind: 'store' },
        { id: 'ingest', label: 'Ingestion', col: 1, row: 1, kind: 'service' },
        { id: 'config', label: 'Owner configs', col: 2, row: 0, kind: 'doc' },
        { id: 'store', label: 'Insights store', col: 2, row: 1, kind: 'store' },
        { id: 'serve', label: 'Serving layer', col: 3, row: 1, kind: 'service' },
        { id: 'products', label: 'Products', col: 4, row: 1, kind: 'service' },
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
        body: 'Owners describe an insight in a config file and ship it themselves, on their own schedule.',
      },
      {
        title: 'Start from what broke',
        body: 'I started from what had gone wrong in the old store and documented the new design for the team.',
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
      'I built a DynamoDB cache that let pipelines in any VPC look up pseudonymized identities after a privacy change. It handles more than 3 billion records a month with a 97–99% hit rate in three regions.',
    problem: [
      'A privacy change moved our advertising pipelines to pseudonymized identifiers.',
      'The standard cache was a Redis cluster inside one VPC, and our pipelines run across many.',
    ],
    built: [
      'A DynamoDB cache shared across VPCs, built with another team by extending their implementation.',
      'A warm-up order. Smaller jobs fill the cache first, and the largest jobs then read from it on staggered schedules so the table stays within its capacity.',
      'A shadow test followed by a gradual dial-up to 100% of traffic. All traffic moved over in 3.5 weeks, and then the old path was removed.',
      'Support for GDPR deletion.',
    ],
    diagram: {
      cols: 4,
      rows: 3,
      nodes: [
        { id: 'warm', label: 'Warm-up jobs', col: 0, row: 0, kind: 'service' },
        { id: 'large', label: 'Large jobs', col: 0, row: 2, kind: 'service' },
        { id: 'cache', label: 'DynamoDB cache', col: 1, row: 1, kind: 'store' },
        { id: 'service', label: 'Pseudonymizer', col: 2, row: 1, kind: 'service' },
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
        body: 'I chose DynamoDB because IAM governs its access, so pipelines in any VPC could share one table without network peering.',
      },
      {
        title: 'Warm first, then stagger',
        body: 'Letting the smaller jobs fill the cache first kept hit rates high once the large jobs started reading.',
      },
      {
        title: 'Shadow before switching',
        body: 'The new path ran in shadow first. We compared its output to the old path’s before any customer-facing report depended on it.',
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
      'I built internal security apps at AT&T and moved them from per-app logins to one shared OAuth 2.0 and OpenID Connect sign-in.',
    problem: [
      'Every internal security app carried its own legacy login flow. They were hard to maintain and behind current security standards.',
    ],
    built: [
      'Full-stack security applications in AngularJS, Express and MySQL, built from what the stakeholder teams asked for.',
      'A shared OAuth 2.0 and OpenID Connect sign-in that replaced the per-app login flows.',
    ],
    diagram: {
      cols: 3,
      rows: 3,
      nodes: [
        { id: 'user', label: 'Employee', col: 0, row: 1, kind: 'actor' },
        { id: 'app', label: 'Security app', col: 1, row: 1, kind: 'service' },
        { id: 'db', label: 'MySQL', col: 1, row: 2, kind: 'store' },
        { id: 'idp', label: 'OIDC provider', col: 2, row: 1, kind: 'service' },
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
        body: 'With OAuth 2.0 and OIDC, the apps hand sign-in to an identity provider. That leaves one login path to secure.',
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
      'I led five developers building computer-vision tools for a Tourette syndrome study. An autoregressive hidden Markov model splits hours of video into discrete “syllables” of behavior that researchers can count.',
    problem: [
      'The researchers needed numbers from hours of video, and scoring it by eye was slow and subjective.',
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
        { id: 'video', label: 'Video', col: 0, row: 1, kind: 'store' },
        { id: 'features', label: 'Features', col: 1, row: 1, kind: 'service' },
        { id: 'hmm', label: 'AR-HMM', col: 2, row: 1, kind: 'model' },
        { id: 'cluster', label: 'GPU cluster', col: 2, row: 2, kind: 'service' },
        { id: 'syllables', label: 'Syllables', col: 3, row: 1, kind: 'doc' },
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
        title: 'Discrete syllables',
        body: 'A small vocabulary of behaviors made them countable and comparable across subjects.',
      },
      {
        title: 'Tools researchers run',
        body: 'Desktop apps let researchers run the pipeline themselves without waiting on a developer.',
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
