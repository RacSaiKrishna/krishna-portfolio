/**
 * Contact form in a modal <dialog>, opened by every [data-contact-open] link (nav "Contact",
 * the "Send a message" button in 06). Those links keep real hrefs (#contact, mailto:) so the page
 * still works with JavaScript off.
 *
 * Delivery, two options:
 *  1. APPS_SCRIPT_URL set (preferred): the form posts to the owner's Google Apps Script web app
 *     (docs/contact-mailer.gs), which emails the message from the owner's Google account.
 *  2. Otherwise FormSubmit's AJAX endpoint emails it. FormSubmit only delivers after its one-time
 *     "Activate Form" email has been clicked; until then it answers "This form needs Activation".
 * If delivery fails, the visitor gets a pre-filled mailto: link instead.
 */
import { sfx } from "./sound.js";
import { revealDialog } from "./animations/contact.js";

const TO = "support@atharvionics.ca";
// Paste the Apps Script web app URL (ends in /exec) here; see docs/contact-mailer.gs.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxTuxidQBqWMhOkGRetByHStrwjVN5nJsHfqFVfjEDI0esy4HRcgJ8lQOi54_bUBZzQ/exec";
const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${TO}`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function setupContactForm() {
  const dialog = document.getElementById("contact-dialog");
  if (!dialog || typeof dialog.showModal !== "function") return; // very old browsers: links fall back

  const form = dialog.querySelector(".cf-form");
  const status = dialog.querySelector(".cf-status");
  const submit = dialog.querySelector(".cf-submit");
  const f = (name) => form.elements[name];
  let quietFocus = false; // focus moved by code (open, error): its own sound already plays
  const focusQuietly = (el) => { quietFocus = true; el.focus(); quietFocus = false; };

  const open = (e) => {
    e.preventDefault();
    e.stopPropagation(); // keep Lenis from also smooth-scrolling to #contact
    if (dialog.open) return;
    dialog.showModal();
    setTimeout(() => sfx.open(), 60); // engine roar, just after the click chime
    revealDialog(dialog.querySelector(".cf-panel"));
    focusQuietly(f("name"));
  };
  for (const link of document.querySelectorAll("[data-contact-open]")) link.addEventListener("click", open);

  dialog.querySelector(".cf-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); // backdrop
  dialog.addEventListener("close", () => sfx.close()); // ×, Esc or backdrop

  // The page behind can't scroll while the panel is open, so wheel and swipe inside the
  // panel drive the engine instead (speed in px/s, like page scrolling).
  let lastT = 0;
  const rev = (dy) => {
    const now = performance.now();
    const dt = Math.max(8, Math.min(100, now - lastT));
    lastT = now;
    sfx.setVelocity((Math.abs(dy) / dt) * 1000);
  };
  dialog.addEventListener("wheel", (e) => rev(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY), { passive: true });
  let touchY = null;
  dialog.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; lastT = performance.now(); }, { passive: true });
  dialog.addEventListener("touchmove", (e) => {
    const y = e.touches[0].clientY;
    if (touchY !== null) rev(y - touchY);
    touchY = y;
  }, { passive: true });

  // Sounds while filling the form in.
  form.addEventListener("focusin", (e) => { if (!quietFocus && e.target.matches("input, textarea")) sfx.focus(); });
  form.addEventListener("input", (e) => { if (e.target.matches("input, textarea")) sfx.key(); });

  const setStatus = (msg, kind = "") => {
    status.textContent = "";
    status.className = `cf-status${kind ? ` is-${kind}` : ""}`;
    if (typeof msg === "string") status.textContent = msg;
    else if (msg) status.append(...msg);
  };

  const validate = () => {
    const errors = [];
    const mark = (el, bad) => el.setAttribute("aria-invalid", String(bad));
    const name = f("name").value.trim();
    const email = f("email").value.trim();
    const phone = f("phone").value.trim();
    const message = f("message").value.trim();

    mark(f("name"), !name); if (!name) errors.push([f("name"), "Please add your name."]);
    const badEmail = email && !EMAIL_RE.test(email);
    const noReach = !email && !phone;
    mark(f("email"), badEmail || noReach);
    mark(f("phone"), noReach);
    if (badEmail) errors.push([f("email"), "That email address doesn't look right."]);
    if (noReach) errors.push([f("email"), "Add a phone number or an email so I can reply."]);
    mark(f("message"), !message); if (!message) errors.push([f("message"), "Please add a short message."]);
    return errors;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errors = validate();
    if (errors.length) {
      setStatus(errors.map(([, msg]) => msg).join(" "), "error");
      sfx.error();
      focusQuietly(errors[0][0]);
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    if (data._honey) { done(); return; } // bot filled the hidden field: pretend it worked

    submit.disabled = true;
    submit.textContent = "Sending…";
    setStatus("Sending your message…");
    sfx.scan();
    try {
      const res = APPS_SCRIPT_URL
        // Form-encoded "simple" request: Apps Script can't answer a CORS preflight.
        ? await fetch(APPS_SCRIPT_URL, { method: "POST", body: new URLSearchParams(data) })
        : await fetch(FORMSUBMIT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ...data, _replyto: data.email || undefined }),
        });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || String(body.success) !== "true") throw new Error(body.message || res.statusText);
      done();
    } catch (err) {
      // e.g. "This form needs Activation…" until the activation email to TO has been clicked.
      console.warn("Contact form: the message was not delivered:", err.message);
      failed(data);
    } finally {
      submit.disabled = false;
      submit.textContent = "Send message";
    }
  });

  function done() {
    form.reset();
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    setStatus("Message sent. Thanks, I'll get back to you soon.", "ok");
    sfx.warp();
  }

  function failed(data) {
    const subject = encodeURIComponent("Message from krishna.atharvionics.ca");
    const lines = [data.message, "", `Name: ${data.name}`, data.company && `Company: ${data.company}`, data.phone && `Phone: ${data.phone}`, data.email && `Email: ${data.email}`];
    const mail = document.createElement("a");
    mail.href = `mailto:${TO}?subject=${subject}&body=${encodeURIComponent(lines.filter((l) => l !== undefined && l !== "").join("\n"))}`;
    mail.textContent = "send it by email instead";
    setStatus(["The message couldn't be sent just now. Please try again, or ", mail, "."], "error");
    sfx.error();
  }
}
