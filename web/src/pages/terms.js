import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { setSEO } from '../seo.js'; // SEO Update

export function renderTermsPage(app) {
    // SEO Update
    setSEO({
        title: 'Terms of Service | RoommateGroups',
        description: 'Read the RoommateGroups Terms of Service. Learn about your rights and responsibilities when using our roommate-finding platform.',
        canonical: 'https://roommategroups.com/terms',
    });
    app.innerHTML = `
    <style>
        .legal-hero { background: linear-gradient(135deg, #1a1a1a 0%, #0f172a 100%); color: white; padding: 80px 24px; text-align: center; }
        .legal-hero h1 { font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 800; margin-bottom: 12px; }
        .legal-hero p { opacity: 0.8; font-size: 1.05rem; }
        .legal-container { max-width: 800px; margin: 0 auto; padding: 60px 24px; color: #1a1a1a; line-height: 1.8; }
        .legal-container h2 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 40px 0 16px; }
        .legal-container h3 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 24px 0 12px; }
        .legal-container p { margin-bottom: 16px; font-size: 0.95rem; }
        .legal-container ul { margin-bottom: 16px; padding-left: 24px; font-size: 0.95rem; }
        .legal-container li { margin-bottom: 8px; }
        .last-updated { font-size: 0.85rem; color: #64748b; margin-bottom: 32px; font-weight: 600; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
    </style>

    ${renderNavbar()}

    <div class="legal-hero">
        <h1>Terms of Service</h1>
        <p>Please read these terms carefully before using RoommateGroups.</p>
    </div>

    <div class="legal-container">
        <div class="last-updated">Last Updated: October 15, 2023</div>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using the RoommateGroups platform (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to all of the terms and conditions, you may not access the Service. The Service is offered subject to your acceptance without modification of all of the terms and conditions contained herein.</p>

        <h2>2. User Accounts</h2>
        <p>To access certain features of the Service, you must register for an account. You agree to:</p>
        <ul>
            <li>Provide accurate, current, and complete information during the registration process.</li>
            <li>Maintain and promptly update your account information.</li>
            <li>Maintain the security of your password and accept all risks of unauthorized access to your account.</li>
            <li>Immediately notify us of any unauthorized use of your account.</li>
        </ul>
        <p>You must be at least 18 years old to use the Service.</p>

        <h2>3. Acceptable Use and Community Standards</h2>
        <p>You agree not to use the Service in any way that is unlawful, harmful, or violates our community standards. Specifically, you agree not to:</p>
        <ul>
            <li>Post false, inaccurate, misleading, or deceptive listings.</li>
            <li>Post discriminatory content or preferences based on race, color, national origin, religion, sex, familial status, or disability.</li>
            <li>Harass, stalk, or abuse other users.</li>
            <li>Attempt to circumvent our messaging platform to avoid fees or verification.</li>
            <li>Scrape, crawl, or mass-download data from the Service without express written permission.</li>
        </ul>

        <h2>4. Listings and Transactions</h2>
        <p>RoommateGroups acts as a venue for users to connect. We are not a real estate broker, agent, or property manager. We do not own, manage, or control any of the properties listed on the Service.</p>
        <p><strong>We do not guarantee the accuracy, quality, safety, or legality of any listings.</strong> Any agreements entered into between users are solely between the users. RoommateGroups is not a party to any lease or rental agreement.</p>

        <h2>5. Premium Subscriptions</h2>
        <p>Some features of the Service are billed on a subscription basis ("Premium Services"). You will be billed in advance on a recurring, periodic basis. You may cancel your subscription at any time, but we do not provide refunds for partial billing periods unless explicitly stated otherwise.</p>

        <h2>6. Termination</h2>
        <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms of Service. Upon termination, your right to use the Service will immediately cease.</p>

        <h2>7. Disclaimer of Warranties</h2>
        <p>The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, whether express or implied. RoommateGroups specifically disclaims any implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>

        <h2>8. Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us at <a href="mailto:legal@roommategroups.com" style="color:#1a1a1a;">legal@roommategroups.com</a> or via our <a href="/contact" style="color:#1a1a1a;">Contact Page</a>.</p>
    </div>

    ${renderFooter()}
    `;

    initNavbar();
}

