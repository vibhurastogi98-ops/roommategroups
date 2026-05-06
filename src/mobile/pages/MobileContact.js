/**
 * src/mobile/pages/MobileContact.js
 * Contact Us page for mobile.
 */

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const { updateHeader, goBack } = await getMobile();
  updateHeader({ title: 'Contact Us', showBack: true });

  container.innerHTML = `
    <div style="padding: 24px 20px; background: #f8fafc; min-height: 100%;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 3rem; margin-bottom: 12px;">✉️</div>
        <h2 style="font-size: 1.6rem; font-weight: 900; color: #1e293b; margin-bottom: 8px; letter-spacing: -0.02em;">Get in Touch</h2>
        <p style="font-size: 0.9rem; color: #64748b;">Have a question or feedback? We'd love to hear from you.</p>
      </div>

      <div style="background: #fff; border-radius: 20px; padding: 24px; border: 1px solid #f1f5f9; margin-bottom: 24px; display: flex; flex-direction: column; gap: 20px;">
        <div>
          <label style="font-size: 0.75rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase;">SUBJECT</label>
          <select class="mobile-input" style="margin-top: 6px;">
            <option>General Inquiry</option>
            <option>Support Request</option>
            <option>Feedback</option>
            <option>Business Partnership</option>
          </select>
        </div>
        <div>
          <label style="font-size: 0.75rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase;">MESSAGE</label>
          <textarea class="mobile-textarea" placeholder="How can we help?" style="margin-top: 6px; min-height: 120px;"></textarea>
        </div>
        <button id="send-msg-btn" class="mobile-btn mobile-btn-accent" style="height: 52px; font-weight: 800;">Send Message</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <a href="mailto:support@roommategroups.com" style="text-decoration: none; background: #fff; border-radius: 16px; padding: 16px; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.2rem;">📧</span>
          <div style="flex: 1;">
            <div style="font-size: 0.9rem; font-weight: 800; color: #1e293b;">Email Us</div>
            <div style="font-size: 0.75rem; color: #94a3b8;">support@roommategroups.com</div>
          </div>
          <span style="color: #cbd5e1;">›</span>
        </a>
        <div style="background: #fff; border-radius: 16px; padding: 16px; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.2rem;">📍</span>
          <div style="flex: 1;">
            <div style="font-size: 0.9rem; font-weight: 800; color: #1e293b;">Location</div>
            <div style="font-size: 0.75rem; color: #94a3b8;">Global Support HQ</div>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#send-msg-btn')?.addEventListener('click', () => {
    alert('Thank you! Your message has been sent.');
    goBack();
  });
}
