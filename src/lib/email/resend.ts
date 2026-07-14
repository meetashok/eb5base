import { Resend } from 'resend';
import { SITE_URL } from '@/lib/constants';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM || 'notifications@eb5base.com';

export async function sendImmediateStatusEmail(params: {
  to: string;
  name: string;
  formType: string;
  receiptNumber: string;
  previousStatus: string;
  currentStatus: string;
  updatedAt: string;
}) {
  const resend = getResend();
  const subject = `Status Update - Your ${params.formType} case has a new status`;
  const body = `Hi ${params.name},

Your ${params.formType} case (${params.receiptNumber}) has a new status:

Previous: ${params.previousStatus}
Current: ${params.currentStatus}
Updated: ${params.updatedAt}

View your full timeline: ${SITE_URL}/timeline

- eb5base.com
`;

  if (!resend) {
    console.info('[email:stub]', subject, params.to);
    return { ok: true as const, stub: true };
  }

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject,
    text: body,
  });
  return { ok: true as const, stub: false };
}

export async function sendDigestEmail(params: {
  to: string;
  name: string;
  changeCount: number;
  lines: string[];
}) {
  const resend = getResend();
  const subject = `Daily Status Update - ${params.changeCount} change${params.changeCount === 1 ? '' : 's'} detected`;
  const body = `Hi ${params.name},

Here are today's status changes:

${params.lines.join('\n')}

View your full timeline: ${SITE_URL}/timeline

- eb5base.com
`;

  if (!resend) {
    console.info('[email:stub]', subject, params.to);
    return { ok: true as const, stub: true };
  }

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject,
    text: body,
  });
  return { ok: true as const, stub: false };
}
