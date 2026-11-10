export type EmailConfig = {
  apiKey: string;
  from: string;
};

export function readEmailConfig(
  env: Record<string, string | undefined>,
): EmailConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.NOTIFY_EMAIL_FROM?.trim();
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

export async function sendNotificationEmail(
  config: EmailConfig,
  message: { to: string; subject: string; text: string },
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider rejected the message (${response.status}).`);
  }
}
