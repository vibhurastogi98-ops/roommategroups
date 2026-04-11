import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

const SAFETY_TIPS = [
    {
        icon: '🔍',
        color: '#1a1a1a',
        bg: '#f5f5f5',
        title: 'Verify Before You Trust',
        tips: [
            'Always check for the blue verification badges on profiles — ID Verified users have passed a government ID check.',
            'Search for the listing address on Google Maps to confirm it exists and matches the photos.',
            'Ask for a video tour if you cannot visit in person — legitimate hosts are always happy to do this.',
            'Cross-check the profile across social media to verify the person is who they claim to be.',
        ]
    },
    {
        icon: '💬',
        color: '#333333',
        bg: '#f5f5f5',
        title: 'Communicate Safely',
        tips: [
            'Keep all communications within the RoommateGroups platform until you\'ve verified the person\'s identity.',
            'Never share your home address, financial details, or government ID with someone you haven\'t met or verified.',
            'Be wary of anyone who insists on moving off-platform to WhatsApp or email immediately.',
            'Use our messaging system — it creates a paper trail in case anything goes wrong.',
        ]
    },
    {
        icon: '🏠',
        color: '#333333',
        bg: '#f5f5f5',
        title: 'Visiting & Moving In',
        tips: [
            'Always visit the property in person or via live video before paying any money.',
            'Bring a friend or tell someone your plans before visiting a property for the first time.',
            'Meet in a public place first before seeing the property — this is a great safety precaution.',
            'Never hand over cash or deposit before signing a written rental agreement or lease.',
        ]
    },
    {
        icon: '💰',
        color: '#555555',
        bg: '#f5f5f5',
        title: 'Protect Your Money',
        tips: [
            'Never wire money, use gift cards, or send cryptocurrency as payment before signing a lease.',
            'Use a credit card or payment service with buyer protection for any deposits.',
            'A legitimate landlord will never ask for payment before a viewing or before signing a contract.',
            'Government-subsidized or below-market listings that seem too good to be true usually are — trust your instincts.',
        ]
    },
    {
        icon: '🚨',
        color: '#1a1a1a',
        bg: '#f5f5f5',
        title: 'Red Flags to Watch For',
        tips: [
            'The landlord/host claims to be abroad and cannot meet you or show the property.',
            'You\'re asked to pay a large deposit before signing any paperwork or seeing the place.',
            'The photos look too professional — do a reverse image search to check if they\'re stolen.',
            'Prices are dramatically below market rate for the area — scammers use low prices to generate interest.',
        ]
    },
    {
        icon: '📋',
        color: '#333333',
        bg: '#f5f5f5',
        title: 'Document Everything',
        tips: [
            'Always get a signed lease or roommate agreement before moving in.',
            'Document the condition of the property with photos and video before moving your belongings in.',
            'Keep records of all payments — ask for receipts and use traceable payment methods.',
            'Know your local tenant rights — most cities have strong protections for renters.',
        ]
    }
];

export function renderSafetyPage(app) {
    app.innerHTML = `
    <style>
        .safety-hero { background: #f2f2f2; color: #1a1a1a; border-bottom: 1px solid #e2e8f0; padding: 100px 24px 80px; text-align: center; }
        .safety-hero h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; margin-bottom: 16px; }
        .safety-hero p { opacity: 0.85; max-width: 600px; margin: 0 auto; font-size: 1.1rem; }
        .safety-container { max-width: 1000px; margin: 0 auto; padding: 60px 24px; }
        .tips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(460px, 1fr)); gap: 24px; }
        .tip-card { background: white; border-radius: 16px; padding: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .tip-card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .tip-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; flex-shrink: 0; }
        .tip-card-header h3 { font-size: 1.1rem; font-weight: 800; }
        .tip-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .tip-list li { display: flex; gap: 10px; font-size: 0.92rem; color: #475569; line-height: 1.6; }
        .tip-list li::before { content: '✓'; font-weight: 800; flex-shrink: 0; margin-top: 1px; }
        .alert-box { background: linear-gradient(135deg, #1a1a1a, #333333); color: white; border-radius: 16px; padding: 32px; margin-bottom: 40px; }
        .alert-box h2 { font-size: 1.3rem; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
        .alert-box p { opacity: 0.9; line-height: 1.7; }
        .report-cta { background: #f2f2f2; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; text-align: center; color: #1a1a1a; margin-top: 40px; }
        @media (max-width: 768px) { .tips-grid { grid-template-columns: 1fr; } }
    </style>

    ${renderNavbar()}

    <div class="safety-hero">
        <div style="display:inline-flex;background:rgba(255,255,255,0.15);border-radius:50%;width:72px;height:72px;align-items:center;justify-content:center;font-size:2rem;margin-bottom:20px;">🛡️</div>
        <h1>Safety Tips & Scam Prevention</h1>
        <p>Your safety is our top priority. Follow these guidelines to have a secure, worry-free experience on RoommateGroups.</p>
    </div>

    <div class="safety-container">
        <div class="alert-box">
            <h2>⚠️ Golden Rule</h2>
            <p><strong>Never pay any money before you have signed a lease and seen the property in person (or via live video).</strong> Any request for payment before a signed agreement is a major red flag. When in doubt, report the listing and contact our Safety Team.</p>
        </div>

        <div class="tips-grid">
            ${SAFETY_TIPS.map(section => `
                <div class="tip-card">
                    <div class="tip-card-header">
                        <div class="tip-icon" style="background:${section.bg};color:${section.color};">${section.icon}</div>
                        <h3 style="color:${section.color};">${section.title}</h3>
                    </div>
                    <ul class="tip-list">
                        ${section.tips.map(tip => `<li><span style="color:${section.color};">✓</span>${tip}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>

        <div class="report-cta">
            <div style="font-size:2.5rem;margin-bottom:12px;">🚨</div>
            <h2 style="font-size:1.5rem;font-weight:800;margin-bottom:10px;">Report Suspicious Activity</h2>
            <p style="opacity:0.85;margin-bottom:24px;">See a suspicious listing or user? Report it immediately. Our Trust & Safety team reviews all reports within 24 hours.</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                <a href="/contact" style="background:#1a1a1a;color:white;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none;">Report a Listing</a>
                <a href="/faq" style="background:white;color:#1a1a1a;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none;border:1px solid #e2e8f0;">Read FAQ</a>
            </div>
        </div>
    </div>

    ${renderFooter()}
    `;

    initNavbar();
}

