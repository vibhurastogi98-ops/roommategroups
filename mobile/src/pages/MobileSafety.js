/**
 * src/mobile/pages/MobileSafety.js
 * Safety tips and trust guidelines for mobile.
 */

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container, params = {}) {
  const { updateHeader } = await getMobile();
  updateHeader({ title: 'Safety Tips', showBack: true });

  const tips = [
    { 
      title: 'Stay on the Platform', 
      text: 'Always use our in-app messaging to communicate. Avoid sharing your personal phone number or email early on.', 
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>' 
    },
    { 
      title: 'Never Pay Upfront', 
      text: 'Do not send money or deposits before viewing the property and meeting the roommate in person.', 
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>' 
    },
    { 
      title: 'Trust Your Gut', 
      text: 'If an offer seems too good to be true, it probably is. If you feel uncomfortable, walk away.', 
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1 0-4.88 2.5 2.5 0 0 1 0-4.88A2.5 2.5 0 0 1 9.5 2Z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 0-4.88 2.5 2.5 0 0 0 0-4.88A2.5 2.5 0 0 0 14.5 2Z"></path></svg>' 
    },
    { 
      title: 'Meet in Public', 
      text: 'When viewing a room or meeting a roommate for the first time, try to meet in a public place or bring a friend.', 
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>' 
    },
    { 
      title: 'Check Verifications', 
      text: 'Look for the "Verified" badge on profiles. It means the user has confirmed their identity with us.', 
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' 
    }
  ];
  const meetupSpots = [
    { icon: 'fa-building-shield', title: 'Police station lobby', text: 'Best for high-value items or first-time meetups.' },
    { icon: 'fa-book-open-reader', title: 'Public library', text: 'Staffed, well-lit, and easy to leave from.' },
    { icon: 'fa-mug-saucer', title: 'Busy coffee shop', text: 'Good for small items and quick inspections.' },
    { icon: 'fa-store', title: 'Retail entrance', text: 'Use a visible entrance or pickup counter.' },
  ];

  container.innerHTML = `
    <div style="padding: 24px 20px; background: #f8fafc; min-height: 100%;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; background: #fff; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #1a1a1a; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <h2 style="font-size: 1.6rem; font-weight: 900; color: #1e293b; margin-bottom: 8px; letter-spacing: -0.02em;">Your Safety First</h2>
        <p style="font-size: 0.9rem; color: #64748b; line-height: 1.5;">We want your experience to be safe and successful. Follow these guidelines to stay protected.</p>
      </div>

      <div id="safe-meetup" style="background:#fff;border-radius:20px;padding:20px;border:1px solid #f1f5f9;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <div style="width:42px;height:42px;border-radius:12px;background:#111827;color:#fff;display:flex;align-items:center;justify-content:center;">
            <i class="fa-solid fa-location-dot"></i>
          </div>
          <div style="font-size:1.05rem;font-weight:900;color:#1e293b;">Safe meetup spots</div>
        </div>
        <p style="font-size:0.85rem;color:#64748b;line-height:1.55;margin:0 0 14px;">For marketplace handoffs, keep contact in chat, meet somewhere public, inspect first, then pay.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          ${meetupSpots.map(spot => `
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px;display:grid;gap:6px;">
              <i class="fa-solid ${spot.icon}" style="color:#111827;"></i>
              <strong style="font-size:0.78rem;color:#0f172a;line-height:1.25;">${spot.title}</strong>
              <small style="font-size:0.7rem;color:#64748b;line-height:1.35;">${spot.text}</small>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px;">
        ${tips.map(tip => `
          <div style="background: #fff; border-radius: 20px; padding: 20px; border: 1px solid #f1f5f9; display: flex; gap: 16px; align-items: flex-start;">
            <div style="font-size: 1.6rem; flex-shrink: 0; background: #f8fafc; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              ${tip.icon}
            </div>
            <div>
              <div style="font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 4px;">${tip.title}</div>
              <div style="font-size: 0.85rem; color: #64748b; line-height: 1.5;">${tip.text}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="background: #1e293b; border-radius: 20px; padding: 24px; color: #fff; text-align: center;">
        <div style="font-size: 1.1rem; font-weight: 800; margin-bottom: 8px;">See Something Suspicious?</div>
        <p style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 20px; line-height: 1.5;">Help us keep the community safe by reporting any suspicious listings or users.</p>
        <button id="report-safety-btn" class="mobile-btn" style="background: #fff; color: #1e293b; font-weight: 800;">Report an Issue</button>
      </div>
    </div>
  `;

  container.querySelector('#report-safety-btn')?.addEventListener('click', async () => {
    const { navigate } = await getMobile();
    navigate('contact');
  });

  if (params.section === 'safe-meetup') {
    setTimeout(() => container.querySelector('#safe-meetup')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  }
}
