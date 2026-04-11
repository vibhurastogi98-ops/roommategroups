import { db } from '../services/db.js';

export function renderFooter() {
    const footerCities = db.cities.findAll().filter(c => c.is_active && c.show_in_footer !== false);
    return `
    <footer class="footer" id="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <div class="footer-logo">
                        <span class="logo-badge">
                            <span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span>
                        </span>
                    </div>
                    <p class="footer-desc">The easiest way to find your perfect room or roommate in cities worldwide. Verified listings, real people, no scams.</p>
                    <div class="footer-social">
                        <a href="https://www.facebook.com/Roommategroups" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><i class="fab fa-facebook-f"></i></a>
                        <a href="https://www.instagram.com/roommategroups" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram"></i></a>
                        <a href="https://www.youtube.com/@Roommategroups" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
                <div class="footer-cities-section">
                    <h4>Popular Cities</h4>
                    <div class="footer-cities-grid">
                        ${db.cities.find(c => c.is_active && c.show_in_popular).map(city => `<a href="/cities/${city.slug}">${city.name}</a>`).join('')}
                    </div>
                </div>
                <div class="footer-groups-section">
                    <h4>Popular FB Groups</h4>
                    <div class="footer-cities-grid">
                        ${db.fb_cities.find(c => c.is_footer).sort((a,b) => (a.priority || 0) - (b.priority || 0)).map(g => `<a href="${g.fb_group_link}" target="_blank" rel="noopener noreferrer">${g.city_name} Group</a>`).join('')}
                    </div>
                </div>
                <div class="footer-links-section">
                    <h4>Resources</h4>
                    <ul>
                        <li><a href="/about">About Us</a></li>
                        <li><a href="/blog">Blog</a></li>
                        <li><a href="/faq">FAQ</a></li>
                        <li><a href="/safety">Safety Tips</a></li>
                        <li><a href="/terms">Terms of Service</a></li>
                        <li><a href="/privacy">Privacy Policy</a></li>
                        <li><a href="/contact">Contact Us</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                &copy; ${new Date().getFullYear()} RoommateGroups. All rights reserved.
            </div>
        </div>
    </footer>`;
}
