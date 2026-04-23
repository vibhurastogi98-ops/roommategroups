import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

export function renderAboutPage(app) {
    app.innerHTML = `
    ${renderNavbar()}
    <style>
        .about-hero { background: #f2f2f2; color: #1a1a1a; border-bottom: 1px solid #e2e8f0; padding: 100px 0 80px; text-align: center; }
        .about-hero h1 { font-size: clamp(2.2rem, 5vw, 3.5rem); font-weight: 800; margin-bottom: 20px; }
        .about-hero p { font-size: 1.2rem; opacity: 0.85; max-width: 600px; margin: 0 auto; }
        .about-section { padding: 80px 0; }
        .about-section.alt { background: #f8fafc; }
        .about-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        .about-mission { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .about-mission img { border-radius: 20px; width: 100%; object-fit: cover; }
        .about-mission h2 { font-size: 2rem; font-weight: 800; margin-bottom: 16px; color: #1a1a1a; }
        .about-mission p { color: #475569; line-height: 1.8; font-size: 1.05rem; }
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 60px; }
        .stat-card { text-align: center; padding: 32px 20px; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 140px; }
        .stat-card .num { font-size: 2rem; font-weight: 800; color: #1a1a1a; line-height: 1; margin-bottom: 8px; }
        .stat-card .label { font-size: 0.85rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.4; max-width: 120px; }
        .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 28px; margin-top: 48px; }
        .team-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); transition: transform 0.2s; }
        .team-card:hover { transform: translateY(-4px); }
        .team-card-avatar { height: 200px; display: flex; align-items: center; justify-content: center; font-size: 4rem; }
        .team-card-body { padding: 20px; text-align: center; }
        .team-card-body h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; }
        .team-card-body p { font-size: 0.85rem; color: #64748b; }
        .values-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; margin-top: 48px; }
        .value-card { padding: 28px; border-radius: 16px; background: white; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .value-card .icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 16px; }
        .value-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
        .value-card p { color: #64748b; font-size: 0.92rem; line-height: 1.7; }
        .section-label { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #1a1a1a; margin-bottom: 12px; }
        .section-title { font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 800; color: #1a1a1a; margin-bottom: 16px; }
        .section-sub { color: #64748b; font-size: 1.05rem; max-width: 600px; }
        @media (max-width: 992px) {
            .stats-row { grid-template-columns: repeat(2, 1fr); }
            .about-mission { grid-template-columns: 1fr; }
        }
        @media (max-width: 576px) {
            .stats-row { grid-template-columns: 1fr; }
        }
    </style>

    <div class="about-hero">
        <div class="about-container">
            <div class="section-label" style="color:rgba(167,139,250,1);margin-bottom:16px;">Our Story</div>
            <h1>Built for the Modern Renter</h1>
            <p>RoommateGroups was founded in 2018 with one mission: make finding a home and a great roommate simple, safe, and human.</p>
        </div>
    </div>

    <!-- Mission -->
    <section class="about-section">
        <div class="about-container">
            <div class="about-mission">
                <div>
                    <div class="section-label">Our Mission</div>
                    <h2>Making Home Finding Human Again</h2>
                    <p style="margin-bottom:16px;">We believe everyone deserves a safe, affordable, and fulfilling place to live. Whether you're a student moving to a new city, a young professional looking for your first apartment, or a host with a spare room — RoommateGroups connects real people with real homes.</p>
                    <p>Every feature we build is designed to reduce the stress, scams, and uncertainty in the rental process. Verified IDs, real reviews, and transparent pricing — because you deserve nothing less.</p>
                </div>
                <div style="border-radius:20px;height:350px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.15);">
                    <img src="/assets/mission.png" style="width:100%;height:100%;object-fit:cover;" alt="Modern living room with roommates">
                </div>
            </div>

            <div class="stats-row">
                <div class="stat-card"><div class="num">1,500,000+</div><div class="label">Community Members</div></div>
                <div class="stat-card"><div class="num">30+</div><div class="label">Cities Worldwide</div></div>
                <div class="stat-card"><div class="num">98%</div><div class="label">Scam-Free Listings</div></div>
                <div class="stat-card"><div class="num">4.9★</div><div class="label">Average App Rating</div></div>
            </div>
        </div>
    </section>

    <!-- Values -->
    <section class="about-section alt">
        <div class="about-container">
            <div class="section-label">What We Stand For</div>
            <div class="section-title">Our Core Values</div>
            <p class="section-sub">These aren't just words. They're the principles behind every decision we make.</p>
            <div class="values-grid">
                <div class="value-card">
                    <div class="icon" style="background:#f5f5f5;color:#333333;">🛡️</div>
                    <h3>Trust & Safety</h3>
                    <p>Multi-level ID verification, background checks, and community reviews ensure you always know who you're dealing with.</p>
                </div>
                <div class="value-card">
                    <div class="icon" style="background:#f5f5f5;color:#333333;">🤝</div>
                    <h3>Community First</h3>
                    <p>We're building more than a platform — we're building a global community of verified, respectful neighbors.</p>
                </div>
                <div class="value-card">
                    <div class="icon" style="background:#f0f0f0;color:#2563eb;">💎</div>
                    <h3>Transparency</h3>
                    <p>No hidden fees, no fake listings, no bait-and-switch. What you see is exactly what you get.</p>
                </div>
                <div class="value-card">
                    <div class="icon" style="background:#f5f5f5;color:#555555;">🚀</div>
                    <h3>Innovation</h3>
                    <p>We continuously improve our platform based on real user feedback. Your voice shapes our roadmap.</p>
                </div>
                <div class="value-card">
                    <div class="icon" style="background:#f5f5f5;color:#1a1a1a;">❤️</div>
                    <h3>Inclusivity</h3>
                    <p>Everyone is welcome on RoommateGroups. We have a zero-tolerance policy for discrimination of any kind.</p>
                </div>
                <div class="value-card">
                    <div class="icon" style="background:#f5f5f5;color:#333333;">🌍</div>
                    <h3>Global Reach</h3>
                    <p>From Austin to Amsterdam, we're expanding to help people find great homes in every corner of the world.</p>
                </div>
            </div>
        </div>
    </section>


    <!-- CTA -->
    <section style="background:#f2f2f2;padding:80px 0;text-align:center;color:#1a1a1a;border-top:1px solid #e2e8f0;">
        <div class="about-container">
            <h2 style="font-size:2rem;font-weight:800;margin-bottom:16px;">Ready to Find Your Perfect Match?</h2>
            <p style="color:#64748b;margin-bottom:32px;font-size:1.05rem;">Join over 1.5 million members who've already found their home through RoommateGroups.</p>
            <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
                <a href="/auth/register" style="background:#1a1a1a;color:white;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;font-size:1rem;">Get Started Free</a>
                <a href="/search/rooms" style="background:white;color:#1a1a1a;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;font-size:1rem;border:1px solid #e2e8f0;">Browse Listings</a>
            </div>
        </div>
    </section>

    ${renderFooter()}
    `;
    initNavbar();
}

