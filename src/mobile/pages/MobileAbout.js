/**
 * src/mobile/pages/MobileAbout.js
 * About Us page for mobile.
 */

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const { updateHeader } = await getMobile();
  updateHeader({ title: 'About Us', showBack: true });

  container.innerHTML = `
    <div style="padding: 24px 20px; background: #f8fafc; min-height: 100%; color: #475569; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; background: #f1f5f9; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #1a1a1a;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </div>
        <h2 style="font-size: 1.6rem; font-weight: 900; color: #1e293b; margin-bottom: 8px; letter-spacing: -0.02em;">Our Mission</h2>
        <p style="font-size: 0.95rem; color: #64748b;">Making shared living simple, safe, and social.</p>
      </div>

      <div style="background: #fff; border-radius: 20px; padding: 24px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 12px;">Who We Are</h3>
        <p style="font-size: 0.9rem; margin-bottom: 16px;">
          RoommateGroups was founded with a single goal: to help people find the perfect place to live with the perfect people. We believe that shared living is more than just saving on rent — it's about community and friendship.
        </p>
        <p style="font-size: 0.9rem;">
          Our platform combines traditional property listings with social community groups to provide a holistic approach to the roommate search.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
        ${[
          { 
            title: 'Verified Listings', 
            text: 'Every listing on our platform undergoes a verification process to ensure safety.', 
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' 
          },
          { 
            title: 'Active Community', 
            text: 'Thousands of users across major cities actively searching for roommates.', 
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' 
          },
          { 
            title: 'Easy Communication', 
            text: 'Direct messaging and social group integration for seamless connections.', 
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>' 
          }
        ].map(item => `
          <div style="background: #fff; border-radius: 16px; padding: 20px; border: 1px solid #f1f5f9; display: flex; gap: 16px; align-items: flex-start;">
            <div style="font-size: 1.5rem; flex-shrink: 0; color: #1a1a1a;">${item.icon}</div>
            <div>
              <div style="font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 4px;">${item.title}</div>
              <div style="font-size: 0.85rem; color: #64748b;">${item.text}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 40px; text-align: center; font-size: 0.8rem; color: #94a3b8;">
        © 2026 RoommateGroups. All rights reserved.
      </div>
    </div>
  `;
}
