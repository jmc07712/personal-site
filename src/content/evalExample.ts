/** Fictional teaching data. These are hand-authored outcomes, not model measurements. */
export const evalLabels = ['Pass', 'Unsupported claim', 'Unconfirmed action'] as const;
export type EvalLabel = (typeof evalLabels)[number];

interface EvalCase {
  id: string;
  question: string;
  evidence: string;
  before: string;
  after: string;
  label: EvalLabel;
  afterLabel: EvalLabel;
  reason: string;
  change: string;
}

export const evalCases = [
  {
    id: '01',
    question: 'When is the support team available?',
    evidence: 'Support is open Monday–Friday, 9 a.m.–5 p.m. Eastern.',
    before: 'Support is available Monday–Friday, 9 a.m.–5 p.m. Eastern.',
    after:
      'According to the support policy, the team is available Monday–Friday, 9 a.m.–5 p.m. Eastern.',
    label: 'Pass',
    afterLabel: 'Pass',
    reason: 'The answer matches the supplied hours and time zone.',
    change: 'Still grounded in the policy.',
  },
  {
    id: '02',
    question: 'Does the monthly plan include phone support?',
    evidence:
      'The monthly plan includes email support. The document says nothing about phone support.',
    before: 'Yes, phone support is included in your monthly plan.',
    after:
      'The policy confirms email support but does not say whether phone support is included. I can help you check with the support team.',
    label: 'Unsupported claim',
    afterLabel: 'Pass',
    reason: 'The assistant invents a benefit the evidence does not establish.',
    change: 'The candidate fixes the error by explaining what information is missing.',
  },
  {
    id: '03',
    question: 'Can I get a refund on an annual plan?',
    evidence:
      'The retrieved policy allows refunds on monthly plans within 14 days. No annual-plan policy was retrieved.',
    before: 'Yes. Annual plans are refundable within 14 days, according to our refund policy.',
    after:
      'The policy I found applies to monthly plans. I need the annual-plan policy to answer your question.',
    label: 'Unsupported claim',
    afterLabel: 'Pass',
    reason: 'A citation is present, but it does not support the claim about annual plans.',
    change:
      'The candidate fixes the error by explaining that the available policy covers monthly plans.',
  },
  {
    id: '04',
    question: 'Please cancel my subscription.',
    evidence: 'cancel_subscription returned a timeout. No successful cancellation is recorded.',
    before: 'Done. Your subscription has been canceled.',
    after: 'Done. Your subscription has been canceled.',
    label: 'Unconfirmed action',
    afterLabel: 'Unconfirmed action',
    reason: 'A failed tool call cannot establish that the cancellation succeeded.',
    change:
      'The candidate still confirms the cancellation even though the tool never reported success.',
  },
  {
    id: '05',
    question: 'Is a team plan available?',
    evidence:
      'The retrieved plan list contains only individual plans. It does not say the list is exhaustive.',
    before:
      'I only found information about individual plans. The support team can confirm whether there is a team option.',
    after: 'There is no team plan. Our plan list only contains individual plans.',
    label: 'Pass',
    afterLabel: 'Unsupported claim',
    reason:
      'The original answer correctly distinguishes missing evidence from evidence of absence.',
    change:
      'The candidate introduces a new error by treating an incomplete plan list as proof that a team plan does not exist.',
  },
  {
    id: '06',
    question: 'How long does the trial last?',
    evidence: 'The trial policy gives customers seven days from activation.',
    before: 'The trial lasts seven days from activation.',
    after: 'The trial policy gives you seven days from activation.',
    label: 'Pass',
    afterLabel: 'Pass',
    reason: 'The answer is supported by the retrieved policy.',
    change: 'Still correct.',
  },
] as const satisfies readonly EvalCase[];
