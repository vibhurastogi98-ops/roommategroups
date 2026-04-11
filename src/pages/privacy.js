import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

export function renderPrivacyPage(app) {
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
        .highlight-box { background: #f8fafc; border-left: 4px solid #1a1a1a; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 0.95rem; }
    </style>

    ${renderNavbar()}

    <div class="legal-hero">
        <h1>Privacy Policy</h1>
        <p>How we collect, use, and protect your personal data.</p>
    </div>

    <div class="legal-container">
        <div class="last-updated">Last Updated: October 15, 2023</div>

        <div class="highlight-box">
            <strong>TL;DR:</strong> We only collect data needed to make the platform work and keep you safe. We never sell your personal data to third parties. Your exact address and phone number are hidden until you choose to share them.
        </div>

        <h2>1. Information We Collect</h2>
        <p>We collect information to provide better services to all our users. Information we collect includes:</p>
        <ul>
            <li><strong>Information you provide to us:</strong> Account details (name, email, password), profile information (bio, photos, preferences), and ID verification documents (which are handled securely by our verification partners and not stored permanently on our servers).</li>
            <li><strong>Information we get from your use of our services:</strong> Device information, log data, location information (at the city level), and usage statistics.</li>
            <li><strong>Communications:</strong> Messages sent through our platform to other users or to our support team.</li>
        </ul>

        <h2>2. How We Use Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
            <li>Provide, maintain, and improve our Service.</li>
            <li>Verify your identity and prevent fraud, scams, and abuse.</li>
            <li>Connect you with potential roommates or housing matches based on your preferences.</li>
            <li>Process transactions and send related information, including confirmations and receipts.</li>
            <li>Send technical notices, updates, security alerts, and administrative messages.</li>
        </ul>

        <h2>3. How We Share Information</h2>
        <p>We do not share your personal information with companies, organizations, or individuals outside of RoommateGroups except in the following cases:</p>
        <ul>
            <li><strong>With your consent:</strong> When you choose to share your profile or listing with others.</li>
            <li><strong>For external processing:</strong> We provide personal information to trusted service providers (like Stripe for payments) to process it for us, based on our instructions and in compliance with our Privacy Policy.</li>
            <li><strong>For legal reasons:</strong> We will share personal information if we have a good-faith belief that access, use, preservation, or disclosure of the information is reasonably necessary to meet any applicable law, regulation, legal process, or enforceable governmental request.</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>We work hard to protect RoommateGroups and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold. In particular:</p>
        <ul>
            <li>We encrypt many of our services using SSL.</li>
            <li>We review our information collection, storage, and processing practices to guard against unauthorized access to systems.</li>
            <li>We restrict access to personal information to RoommateGroups employees, contractors, and agents who need to know that information in order to process it for us.</li>
        </ul>

        <h2>5. Your Rights</h2>
        <p>Depending on your location (such as under GDPR or CCPA), you may have the right to access, correct, delete, or restrict the processing of your personal data. You can exercise many of these rights directly through your Account Settings. For further assistance, contact our privacy team.</p>

        <h2>6. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact our Data Protection Officer at <a href="mailto:privacy@roommategroups.com" style="color:#1a1a1a;">privacy@roommategroups.com</a>.</p>
    </div>

    ${renderFooter()}
    `;

    initNavbar();
}

