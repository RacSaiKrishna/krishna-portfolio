/**
 * Contact form mailer for krishna.atharvionics.ca (Google Apps Script web app).
 * Emails each contact-form message to TO (a Gmail inbox), sent from the Google account that deploys it.
 * No sheet, no third party, and no Microsoft 365 filtering (support@atharvionics.ca's Microsoft 365
 * quarantines these as "High Confidence Phish", so they are deliberately NOT sent there).
 *
 * Setup (one time, ~3 minutes):
 *  1. Go to https://script.google.com → New project. Replace the code with this file. Save.
 *  2. Deploy → New deployment → type "Web app".
 *       Execute as: Me        Who has access: Anyone
 *  3. Click Deploy, allow the permissions it asks for (it needs "send email as you").
 *  4. Copy the Web app URL (ends in /exec) into APPS_SCRIPT_URL in src/contact-form.js.
 * After editing this script later: Deploy → Manage deployments → edit → Version: New version.
 *
 * Limit: a personal Google account can send about 100 emails a day this way.
 */
// Where portfolio enquiries are delivered. The live script on script.google.com holds the real
// address; it is kept out of this public repo so it can't be harvested for spam.
const TO = "YOUR_INBOX@gmail.com";
const SUBJECT = "New message from krishna.atharvionics.ca";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p._honey) return json({ success: true }); // bot filled the hidden field: drop it quietly

  const field = (k, max) => String(p[k] || "").trim().slice(0, max);
  const name = field("name", 200);
  const company = field("company", 200);
  const phone = field("phone", 60);
  const email = field("email", 200);
  const message = field("message", 5000);
  if (!name || !message || (!email && !phone)) return json({ success: false, message: "Missing required fields" });

  const body = [
    "Name:    " + name,
    company ? "Company: " + company : "",
    phone ? "Phone:   " + phone : "",
    email ? "Email:   " + email : "",
    "",
    message,
  ].filter((line, i) => line !== "" || i === 4).join("\n");

  const options = { to: TO, subject: SUBJECT + " (" + name + ")", body: body, name: "Portfolio contact form" };
  if (EMAIL_RE.test(email)) options.replyTo = email; // "Reply" goes straight to the visitor
  MailApp.sendEmail(options);
  return json({ success: true });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
