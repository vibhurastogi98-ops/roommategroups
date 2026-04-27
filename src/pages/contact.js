import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { db } from '../services/db.js';
import { getCurrentUser } from '../services/auth.js';
import { setSEO } from '../seo.js'; // SEO Update

export function renderContactPage(app) {
    // SEO Update
    setSEO({
        title: 'Contact RoommateGroups — Support, Safety & Partnerships',
        description: 'Get in touch with the RoommateGroups support team. We are available 7 days a week for account help, scam reports, billing questions, and partnership inquiries.',
        canonical: 'https://roommategroups.com/contact',
    });
    app.innerHTML = `
    <style>
        .contact-hero { background: #f2f2f2; color: #1a1a1a; border-bottom: 1px solid #e2e8f0; padding: 90px 24px 70px; text-align: center; }
        .contact-hero h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; margin-bottom: 14px; }
        .contact-hero p { opacity: 0.85; font-size: 1.1rem; max-width: 560px; margin: 0 auto; }
        .contact-body { max-width: 1100px; margin: 0 auto; padding: 60px 24px; display: grid; grid-template-columns: 1fr 1.5fr; gap: 48px; align-items: start; }
        .contact-info h2 { font-size: 1.4rem; font-weight: 800; color: #1a1a1a; margin-bottom: 24px; }
        .contact-channel { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 28px; }
        .contact-channel-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
        .contact-channel-text strong { display: block; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
        .contact-channel-text span { font-size: 0.9rem; color: #64748b; }
        .contact-channel-text a { color: #333333; font-size: 0.9rem; }
        .contact-form-card { background: white; border-radius: 20px; padding: 36px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); }
        .contact-form-card h2 { font-size: 1.3rem; font-weight: 800; color: #1e293b; margin-bottom: 24px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { margin-bottom: 18px; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; outline: none; transition: border-color 0.2s; font-family: inherit; box-sizing: border-box; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #333333; box-shadow: 0 0 0 3px rgba(51,51,51,0.08); }
        .form-group input.field-error, .form-group select.field-error, .form-group textarea.field-error { border-color: #ef4444; }
        .field-error-msg { font-size: 0.78rem; color: #ef4444; margin-top: 4px; display: none; }
        .form-group textarea { resize: vertical; min-height: 120px; }
        .btn-contact { width: 100%; background: linear-gradient(135deg, #333333, #555555); color: white; border: none; padding: 14px; border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
        .btn-contact:hover { opacity: 0.9; }
        .btn-contact:disabled { opacity: 0.7; cursor: not-allowed; }
        .success-msg { display: none; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 18px 20px; border-radius: 10px; margin-top: 16px; font-weight: 600; text-align: center; }
        @media (max-width: 768px) {
            .contact-body { grid-template-columns: 1fr; }
            .form-row { grid-template-columns: 1fr; }
        }
    </style>

    ${renderNavbar()}

    <div class="contact-hero">
        <div style="font-size:3rem;margin-bottom:16px;">💬</div>
        <h1>Get in Touch</h1>
        <p>Our support team is available 7 days a week to help with any questions or concerns you may have.</p>
    </div>

    <div class="contact-body">
        <div class="contact-info">
            <h2>How Can We Help?</h2>

            <div class="contact-channel">
                <div class="contact-channel-icon" style="background:#f5f5f5;color:#333333;">📧</div>
                <div class="contact-channel-text">
                    <strong>Email Support</strong>
                    <span>Typically responds within 2 hours</span>
                    <a href="mailto:hello@roommategroups.com" style="display:block;margin-top:4px;">hello@roommategroups.com</a>
                </div>
            </div>
            <div class="contact-channel">
                <div class="contact-channel-icon" style="background:#f0f0f0;color:#2563eb;">💬</div>
                <div class="contact-channel-text">
                    <strong>Live Chat</strong>
                    <span>Mon–Fri 9am–9pm ET · Sat–Sun 10am–6pm ET</span>
                    <a href="#" id="open-chat" style="display:block;margin-top:4px;">Start a chat</a>
                </div>
            </div>
            <div class="contact-channel">
                <div class="contact-channel-icon" style="background:#f5f5f5;color:#555555;">🛡️</div>
                <div class="contact-channel-text">
                    <strong>Trust & Safety</strong>
                    <span>Report scams, abuse, or urgent issues</span>
                    <a href="mailto:hello@roommategroups.com" style="display:block;margin-top:4px;">hello@roommategroups.com</a>
                </div>
            </div>
            <div class="contact-channel">
                <div class="contact-channel-icon" style="background:#f5f5f5;color:#333333;">🤝</div>
                <div class="contact-channel-text">
                    <strong>Partnerships & Press</strong>
                    <span>Business inquiries and media requests</span>
                    <a href="mailto:hello@roommategroups.com" style="display:block;margin-top:4px;">hello@roommategroups.com</a>
                </div>
            </div>

            <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-top:8px;">
                <h3 style="font-size:0.95rem;font-weight:700;color:#1e293b;margin-bottom:12px;">
                    <i class="fas fa-clock" style="color:#333333;"></i> Support Hours
                </h3>
                <table style="font-size:0.85rem;color:#64748b;width:100%;border-collapse:collapse;">
                    <tr><td style="padding:4px 0;">Monday – Friday</td><td style="text-align:right;font-weight:600;color:#1e293b;">9:00 AM – 9:00 PM ET</td></tr>
                    <tr><td style="padding:4px 0;">Saturday – Sunday</td><td style="text-align:right;font-weight:600;color:#1e293b;">10:00 AM – 6:00 PM ET</td></tr>
                    <tr><td style="padding:4px 0;">Email response</td><td style="text-align:right;font-weight:600;color:#1e293b;">Within 2 hours</td></tr>
                </table>
            </div>
        </div>

        <div class="contact-form-card">
            <h2><i class="fas fa-paper-plane" style="color:#333333;margin-right:8px;"></i>Send a Message</h2>
            <div class="form-row">
                <div class="form-group">
                    <label>First Name *</label>
                    <input type="text" id="contact-fname" placeholder="Alex">
                    <div class="field-error-msg" id="err-fname">Please enter your first name.</div>
                </div>
                <div class="form-group">
                    <label>Last Name *</label>
                    <input type="text" id="contact-lname" placeholder="Rivera">
                    <div class="field-error-msg" id="err-lname">Please enter your last name.</div>
                </div>
            </div>
            <div class="form-group">
                <label>Email Address *</label>
                <input type="email" id="contact-email" placeholder="you@example.com">
                <div class="field-error-msg" id="err-email">Please enter a valid email address.</div>
            </div>
            <div class="form-group">
                <label>Topic *</label>
                <select id="contact-topic">
                    <option value="">Select a topic...</option>
                    <option value="account">Account & Login</option>
                    <option value="listing">Listing Help</option>
                    <option value="safety">Safety & Scam Report</option>
                    <option value="billing">Billing & Subscription</option>
                    <option value="verification">Verification Issues</option>
                    <option value="partnership">Partnership / Press</option>
                    <option value="other">Other</option>
                </select>
                <div class="field-error-msg" id="err-topic">Please select a topic.</div>
            </div>
            <div class="form-group">
                <label>Message *</label>
                <textarea id="contact-message" placeholder="Describe your issue or question in detail..."></textarea>
                <div class="field-error-msg" id="err-message">Please enter a message (at least 10 characters).</div>
            </div>
            <button class="btn-contact" id="btn-contact-submit">
                <i class="fas fa-paper-plane"></i> Send Message
            </button>
            <div class="success-msg" id="contact-success">
                <i class="fas fa-check-circle"></i> Message sent successfully! We'll get back to you within 2 hours.
            </div>
        </div>
    </div>

    ${renderFooter()}
    `;

    const TOPIC_LABELS = {
        account: 'Account & Login',
        listing: 'Listing Help',
        safety: 'Safety & Scam Report',
        billing: 'Billing & Subscription',
        verification: 'Verification Issues',
        partnership: 'Partnership / Press',
        other: 'Other',
    };

    function setFieldError(inputEl, errEl, show) {
        if (show) {
            inputEl.classList.add('field-error');
            errEl.style.display = 'block';
        } else {
            inputEl.classList.remove('field-error');
            errEl.style.display = 'none';
        }
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    const submitBtn = app.querySelector('#btn-contact-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const fnameEl   = app.querySelector('#contact-fname');
            const lnameEl   = app.querySelector('#contact-lname');
            const emailEl   = app.querySelector('#contact-email');
            const topicEl   = app.querySelector('#contact-topic');
            const msgEl     = app.querySelector('#contact-message');

            const fname = fnameEl.value.trim();
            const lname = lnameEl.value.trim();
            const email = emailEl.value.trim();
            const topic = topicEl.value;
            const msg   = msgEl.value.trim();

            // Validate each field
            let valid = true;
            setFieldError(fnameEl, app.querySelector('#err-fname'), !fname);
            if (!fname) valid = false;

            setFieldError(lnameEl, app.querySelector('#err-lname'), !lname);
            if (!lname) valid = false;

            setFieldError(emailEl, app.querySelector('#err-email'), !isValidEmail(email));
            if (!isValidEmail(email)) valid = false;

            setFieldError(topicEl, app.querySelector('#err-topic'), !topic);
            if (!topic) valid = false;

            setFieldError(msgEl, app.querySelector('#err-message'), msg.length < 10);
            if (msg.length < 10) valid = false;

            if (!valid) return;

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            const user = getCurrentUser();

            // Save to database
            await db.user_queries.create({
                user_id: user ? user.user_id : null,
                first_name: fname,
                last_name: lname,
                email,
                topic,
                topic_label: TOPIC_LABELS[topic] || topic,
                message: msg,
                status: 'new',
                is_read: false,
                reply: null,
                replied_at: null,
            });

            setTimeout(() => {
                app.querySelector('#contact-success').style.display = 'block';
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Sent!';
                // Reset form
                fnameEl.value = '';
                lnameEl.value = '';
                emailEl.value = '';
                topicEl.value = '';
                msgEl.value = '';
            }, 800);
        });
    }

    initNavbar();
}
