/**
 * Branded transactional emails: HTML (table layout + inline styles for every
 * mail client) and a plain-text twin. Keep copy short, warm and plain.
 */

export type EmailContent = { subject: string; html: string; text: string };

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const C = {
  night: "#0E0B1F",
  card: "#1B1426",
  gold: "#C9A24B",
  goldText: "#E2BF6A",
  saffron: "#E8891C",
  cream: "#F3E7CF",
  muted: "#CBBD9F",
  ink: "#1A0F05",
};

function layout({ preheader, heading, body, cta, footnote }: { preheader: string; heading: string; body: string; cta: { label: string; url: string }; footnote: string }) {
  const url = escapeHtml(cta.url);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${C.night};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.night};padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${C.card};border:1px solid ${C.gold};border-radius:20px;">
      <tr><td style="padding:36px 32px 8px;text-align:center;">
        <div style="font-size:30px;line-height:1;">🪔</div>
        <div style="margin-top:10px;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:${C.cream};letter-spacing:0.5px;">Vedic<span style="color:${C.goldText};">Slokas</span></div>
      </td></tr>
      <tr><td style="padding:16px 32px 0;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.3;color:${C.cream};">${escapeHtml(heading)}</td></tr>
      <tr><td style="padding:14px 32px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:${C.muted};">${body}</td></tr>
      <tr><td align="center" style="padding:28px 32px 8px;">
        <a href="${url}" style="display:inline-block;background:${C.saffron};color:${C.ink};font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:999px;">${escapeHtml(cta.label)}</a>
      </td></tr>
      <tr><td style="padding:12px 32px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${C.muted};">
        Button not working? Copy this link into your browser:<br>
        <a href="${url}" style="color:${C.goldText};word-break:break-all;">${url}</a>
      </td></tr>
      <tr><td style="padding:24px 32px 32px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${C.muted};border-top:1px solid #3a2c45;">${footnote}</td></tr>
    </table>
    <div style="padding-top:16px;font-family:Georgia,serif;font-size:14px;color:${C.goldText};">असतो मा सद्गमय</div>
  </td></tr>
</table>
</body>
</html>`;
}

export function signInLinkEmail({ url, email, minutes }: { url: string; email: string; minutes: number }): EmailContent {
  const subject = "Your VedicSlokas sign-in link";
  const safeEmail = escapeHtml(email);
  return {
    subject,
    html: layout({
      preheader: `Your sign-in link for ${email}. It works once, for ${minutes} minutes.`,
      heading: "Your sign-in link",
      body: `Tap the button to sign in as <strong style="color:${C.cream};">${safeEmail}</strong>.<br>The link works once and expires in ${minutes} minutes.`,
      cta: { label: "Sign in to VedicSlokas", url },
      footnote: "You can open this link on any device. If you didn't ask to sign in, you can ignore this email: nobody can sign in without it.",
    }),
    text: [
      "Your VedicSlokas sign-in link",
      "",
      `Sign in as ${email}:`,
      url,
      "",
      `The link works once and expires in ${minutes} minutes. You can open it on any device.`,
      "If you didn't ask to sign in, you can ignore this email: nobody can sign in without it.",
    ].join("\n"),
  };
}

export function noAccountEmail({ signupUrl, email }: { signupUrl: string; email: string }): EmailContent {
  const subject = "Sign in to VedicSlokas";
  const safeEmail = escapeHtml(email);
  return {
    subject,
    html: layout({
      preheader: "We couldn't find an account for this address. You can create one in a minute.",
      heading: "No account yet",
      body: `We could not find an account for <strong style="color:${C.cream};">${safeEmail}</strong>.<br>Create one here: it takes a minute and there's no password to remember.`,
      cta: { label: "Create my account", url: signupUrl },
      footnote: "If you didn't try to sign in, you can ignore this email.",
    }),
    text: [
      "Sign in to VedicSlokas",
      "",
      `We could not find an account for ${email}.`,
      "Create one here (it takes a minute, and there's no password to remember):",
      signupUrl,
      "",
      "If you didn't try to sign in, you can ignore this email.",
    ].join("\n"),
  };
}
