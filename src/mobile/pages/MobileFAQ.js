/**
 * src/mobile/pages/MobileFAQ.js
 */

async function getMobile() { return await import('../mobile-main.js'); }

const FAQ_DATA = [
    {
        category: 'Getting Started',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>',
        faqs: [
            { q: 'Is RoommateGroups free to use?', a: 'Our basic plan is completely free — you can browse listings, create a profile, and contact other members. Premium plans unlock advanced features like featured listings, unlimited messages, and priority search placement.' },
            { q: 'How do I create an account?', a: 'Click "Get Started" or "Sign Up" on any page. You only need a valid email address. After registering, we recommend completing your profile and verifying your identity to build trust with other members.' },
            { q: 'Can I list my room or entire apartment?', a: 'Yes! You can list a private room in a shared home, an entire apartment, or a room in a coliving space. Use the "Post a Listing" button from your dashboard to get started.' },
            { q: 'Is RoommateGroups available outside the US?', a: 'Yes! We currently operate in 30+ cities globally. We\'re expanding internationally every quarter.' },
        ]
    },
    {
        category: 'Safety & Trust',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        faqs: [
            { q: 'How does ID verification work?', a: 'Our 4-level verification system starts with email, then phone, then Government ID (passport or driver\'s license matched with a live selfie), and finally Community Verification from peer reviews.' },
            { q: 'Are listings screened for scams?', a: 'Yes. Our AI-powered scam detection flags suspicious listings before they go live. All reported listings are reviewed within 24 hours.' },
            { q: 'What if someone contacts me inappropriately?', a: 'Use the "Report" button on any message or profile. Our Trust & Safety team reviews all reports within 24 hours.' },
            { q: 'Are my personal details shared publicly?', a: 'No. Your exact address and phone number are never shared publicly. Only your display name and verification badges are visible.' },
        ]
    },
    {
        category: 'Listings & Pricing',
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
        faqs: [
            { q: 'How do I make my listing stand out?', a: 'Upload high-quality photos, write a detailed description, complete your ID verification, and consider upgrading to a Featured Listing.' },
            { q: 'Can I edit or deactivate my listing?', a: 'Yes, you can edit, pause, or delete your listing anytime from your Dashboard → My Listings section.' },
            { q: 'How does pricing work?', a: 'Free accounts post 1 listing. Premium ($4.99/mo) gets 3 listings and boosted visibility. Pro ($8.99/mo) gets 5 listings and top ranking.' },
        ]
    }
];

export async function init(container) {
  const { updateHeader } = await getMobile();
  updateHeader({ title: 'FAQ', showBack: true });

  container.innerHTML = `
    <style>
      .faq-search-box {
        margin: 0 20px 24px;
        background: #fff;
        border: 1.5px solid #f1f5f9;
        border-radius: 14px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.03);
      }
      .faq-search-box input {
        border: none;
        outline: none;
        width: 100%;
        font-size: 0.9rem;
        font-weight: 500;
        color: #1e293b;
      }
      .faq-cat-title {
        font-size: 0.95rem;
        font-weight: 900;
        color: #1e293b;
        margin: 24px 20px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .faq-item-mobile {
        background: #fff;
        margin: 0 20px 12px;
        border-radius: 16px;
        border: 1px solid #f1f5f9;
        overflow: hidden;
        transition: all 0.2s;
      }
      .faq-q-btn {
        width: 100%;
        padding: 18px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-align: left;
        background: none;
        border: none;
        font-size: 0.9rem;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.4;
      }
      .faq-ans {
        padding: 0 20px 18px;
        font-size: 0.85rem;
        color: #64748b;
        line-height: 1.6;
        display: none;
      }
      .faq-item-mobile.active .faq-ans {
        display: block;
      }
      .faq-item-mobile.active .chevron {
        transform: rotate(180deg);
      }
      .chevron {
        transition: transform 0.2s;
        color: #94a3b8;
      }
    </style>

    <div style="background: #f8fafc; min-height: 100%; padding-top: 20px; padding-bottom: 40px;">
      
      <div class="faq-search-box">
        <i class="fa-solid fa-magnifying-glass" style="color: #94a3b8; font-size: 0.9rem;"></i>
        <input type="text" id="faq-search" placeholder="Search for help...">
      </div>

      <div id="faq-list-container">
        ${FAQ_DATA.map(cat => `
          <div class="faq-cat-title">
            <span>${cat.icon}</span> ${cat.category}
          </div>
          ${cat.faqs.map(faq => `
            <div class="faq-item-mobile">
              <button class="faq-q-btn">
                <span>${faq.q}</span>
                <i class="fa-solid fa-chevron-down chevron" style="font-size: 0.8rem;"></i>
              </button>
              <div class="faq-ans">${faq.a}</div>
            </div>
          `).join('')}
        `).join('')}
      </div>

      <div style="margin: 40px 20px 20px; padding: 24px; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 20px; text-align: center; color: #fff;">
        <div style="font-size: 1rem; font-weight: 900; margin-bottom: 8px;">Still have questions?</div>
        <p style="font-size: 0.8rem; opacity: 0.8; margin-bottom: 20px;">Our support team is here to help you 24/7.</p>
        <button id="contact-btn" style="width: 100%; height: 48px; border-radius: 12px; background: #fff; color: #1e293b; border: none; font-weight: 800; font-size: 0.9rem;">Contact Support</button>
      </div>
    </div>
  `;

  // Accordion Logic
  container.querySelectorAll('.faq-q-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isActive = item.classList.contains('active');
      
      if (!isActive) item.classList.add('active');
      else item.classList.remove('active');
    });
  });

  // Search Logic
  const searchInput = container.querySelector('#faq-search');
  searchInput?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    container.querySelectorAll('.faq-item-mobile').forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? 'block' : 'none';
    });
    // Hide categories if no items visible
    container.querySelectorAll('.faq-cat-title').forEach(title => {
        let next = title.nextElementSibling;
        let hasVisible = false;
        while(next && next.classList.contains('faq-item-mobile')) {
            if(next.style.display !== 'none') hasVisible = true;
            next = next.nextElementSibling;
        }
        title.style.display = hasVisible ? 'flex' : 'none';
    });
  });

  container.querySelector('#contact-btn')?.addEventListener('click', async () => {
    const { navigate } = await getMobile();
    navigate('contact');
  });
}
