import { db, getLiveListingCount } from '../services/db.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { navigate } from '../router.js';

// ── Data ───────────────────────────────────────────


// ── Removed static listings data array ──

const testimonials = [
  { name: 'Sarah K.', city: 'Austin, TX', quote: 'Found my perfect roommate within a week! The verified profiles gave me peace of mind during the whole process.', rating: 5, initials: 'SK', color: '#1a1a1a' },
  { name: 'Marcus T.', city: 'Berlin, Germany', quote: 'Moving to a new city was scary, but RoommateGroups made finding a room so easy. I was settled within days.', rating: 5, initials: 'MT', color: '#333333' },
  { name: 'Emily R.', city: 'San Francisco, CA', quote: "I've used other platforms before, but this one actually had real, verified listings. No scams, no fake posts.", rating: 5, initials: 'ER', color: '#555555' },
];



// ── Helper functions ────────────────────────────────


function renderListingCard(listing, index) {
  const gradient = ['linear-gradient(135deg, #1a1a1a 0%, #444444 100%)', 'linear-gradient(135deg, #1a1a1a 0%, #444444 100%)', 'linear-gradient(135deg, #1a1a1a 0%, #444444 100%)', 'linear-gradient(135deg, #1a1a1a 0%, #444444 100%)'][index % 4];
  const photo = listing.photos?.[0] || '';
  const isRoommate = listing.category === 'roommate_wanted' || listing.category === 'room_wanted';

  return `
    <div class="listing-card">
      <div class="listing-card-image" style="background: ${photo ? `url('${photo}') center/cover` : gradient}">
        ${!photo ? `<div class="listing-card-image-icon"><i class="fas fa-home"></i></div>` : ''}
        <div class="listing-type-badge">${isRoommate ? 'Looking for Room' : listing.room_type || 'Private Room'}</div>
      </div>
      <div class="listing-card-body">
        <div class="listing-price">$${listing.price}<span>/mo</span></div>
        <div class="listing-title">${listing.title}</div>
        <div class="listing-location">
          <i class="fas fa-location-dot"></i>
          ${db.cities.findById(listing.city)?.name || (listing.city ? listing.city.replace('city_', '').replace(/_/g, ' ') : 'Unknown City')}${(() => { const cId = listing.country || db.cities.findById(listing.city)?.country; return cId ? ', ' + (db.countries.findById(cId)?.name || cId) : ''; })()}
        </div>
        <a href="/listing/${listing.listing_id}" class="btn btn-outline">View Listing</a>
      </div>
    </div>
  `;
}

// ── Helper functions deleted (moved to component) ──

// ── Render ──────────────────────────────────────────

export function renderHomePage(app) {
  const dbCities = db.cities.findAll().filter(c => c.is_active);
  const mapCity = c => ({
    name: c.name,
    slug: c.slug,
    count: getLiveListingCount(c.city_id),
    country: db.countries.findById(c.country)?.name || c.country,
    state: c.state_province || '',
    image: c.hero_image || '',
    avg_rent: c.avg_rent || 0,
    members: c.member_count || 0,
  });
  const homeCities = db.cities.findAll()
    .filter(c => c.is_active && c.show_in_popular !== false)
    .map(mapCity);
  const popularCities = db.cities.findAll()
    .filter(c => c.is_active && (c.show_in_popular_section === true || (c.show_in_popular_section === undefined && c.show_in_popular === true)))
    .map(mapCity);
  const fbGroups = db.fb_cities.findAll()
    .filter(g => g.is_popular !== false)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0));
  const countries = db.countries.findAll().filter(c => c.is_active);

  app.innerHTML = `
    <!-- Navigation -->
    ${renderNavbar()}

    <!-- Hero Section -->
    <section class="hero" id="hero">
      <div class="hero-content">
        <div class="hero-badge">
          <i class="fas fa-star"></i>
          Trusted by 1,500,000+ community members
        </div>
        <h1 class="hero-title animate-reveal floating-text">
          Easily Find Compatible <span class="gradient-text">Roommates</span><br>
          & List Your <span class="gradient-text">Property</span>
        </h1>
        <p class="hero-subtitle">Use our thriving community to find your ideal roommate or attract tenants to your property.</p>
        <div class="hero-search" id="hero-search">
          <div class="search-field">
            <select id="search-country" aria-label="Select country">
              <option value="">🌍 Search Country</option>
              ${countries.map(c => `<option value="${c.country_id}">${c.flag_emoji} ${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="search-field">
            <select id="search-city" aria-label="Select city">
              <option value="">🏙️ Find a City...</option>
              ${dbCities.map(c => `<option value="${c.slug}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="search-field">
            <select id="search-type" aria-label="Search types">
              <option value="">🏠 Rooms & More</option>
              <option value="room">Room for Rent</option>
              <option value="apartment">Apartment for Rent</option>
              <option value="sublet">Sublet</option>
              <option value="roommate_wanted">Roommate Wanted</option>
              <option value="coliving">Co-living Space</option>
              <option value="house">House for Rent</option>
              <option value="student_housing">Student Housing</option>
              <option value="room_wanted">Room Wanted</option>
            </select>
          </div>
          <button class="search-btn" id="search-btn">
            <i class="fas fa-bolt"></i>
            Find Matches
          </button>
        </div>
      </div>
    </section>
    <section class="section home-cities-section" id="cities">
      <div class="container">
        <div class="section-header animate-on-scroll" style="text-align: center; margin-bottom: 48px;">
          <h2>Popular Cities</h2>
          <p>Find your next home in these top locations</p>
        </div>
        ${homeCities.length === 0
      ? `<div class="home-cities-empty"><i class="fas fa-city"></i><p>No cities available yet. Check back soon!</p></div>`
      : `<div class="home-cities-grid">
              ${homeCities.map(c => `
                <a href="/cities/${c.slug}" class="hc-card animate-on-scroll">
                  <div class="hc-img-wrap" style="${c.image ? `background-image: url('${c.image}');` : ''}">
                    ${!c.image ? `<div class="hc-placeholder"><i class="fas fa-city"></i></div>` : ''}
                    <div class="hc-overlay"></div>
                  </div>
                  <div class="hc-body">
                    <div class="hc-name">${c.name}</div>
                    <div class="hc-meta">
                      <span class="hc-country">${c.state ? `${c.state}, ` : ''}${c.country}</span>
                    </div>
                    <div class="hc-stats">
                      <span><i class="fas fa-home"></i> ${c.count.toLocaleString()} listings</span>
                      ${c.avg_rent ? `<span><i class="fas fa-tag"></i> ~$${c.avg_rent.toLocaleString()}/mo</span>` : ''}
                    </div>
                  </div>
                </a>
              `).join('')}
            </div>`
    }
      </div>
    </section>


    <!-- Popular Facebook Groups -->
    <section class="section popular-fb-groups-section" id="popular-groups">
      <div class="container">
        <div class="section-header-row animate-on-scroll">
          <div class="section-header-text">
            <h2>Popular FB Groups</h2>
            <p>Helping tenants & landlords connect for hassle-free renting</p>
          </div>
          <a href="/fb-groups" class="section-explore-link">Explore all groups <i class="fas fa-arrow-right"></i></a>
        </div>
        ${fbGroups.length === 0
      ? `<div class="home-cities-empty"><i class="fab fa-facebook"></i><p>No featured groups available. Check back soon!</p></div>`
      : `<div class="home-cities-grid">
              ${fbGroups.map(g => {
                const slug = g.city_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const memberLabel = g.total_members >= 1000000
                  ? (g.total_members / 1000000).toFixed(1) + 'M'
                  : g.total_members >= 1000
                    ? Math.round(g.total_members / 1000) + 'K'
                    : (g.total_members || 0).toString();
                return `
                <a href="/fb-groups/${slug}" class="hc-card animate-on-scroll" style="text-decoration:none;color:inherit;">
                  <div class="hc-img-wrap" style="display:block;">
                    ${g.city_image
                      ? `<img src="${g.city_image}" alt="${g.fb_group_name}" loading="lazy" onerror="this.onerror=null;this.parentElement.classList.add('hc-no-img');this.remove();">`
                      : `<div class="hc-placeholder"><i class="fab fa-facebook"></i></div>`}
                    <div class="hc-overlay"></div>
                  </div>
                  <div class="hc-body">
                    <div class="hc-name">${g.fb_group_name}</div>
                    <div class="hc-meta">
                      <span class="hc-country"><i class="fas fa-location-dot"></i> ${g.city_name}</span>
                    </div>
                    <div style="display:inline-flex;align-items:center;gap:6px;background:#F1F5F9;color:#475569;font-size:0.78rem;font-weight:700;padding:5px 12px;border-radius:100px;margin-top:10px;width:fit-content;">
                      <i class="fas fa-users" style="color:#7c3aed;font-size:0.7rem;"></i>
                      ${memberLabel}+ Members
                    </div>
                  </div>
                </a>
              `}).join('')}
            </div>
            <div class="view-more-container animate-on-scroll" style="text-align: center; margin-top: 48px;">
              <a href="/fb-groups" class="btn btn-primary btn-lg">View All FB Groups <i class="fas fa-arrow-right" style="margin-left: 8px;"></i></a>
            </div>`

    }
      </div>
    </section>

    <section class="stats-section" id="stats">
      <div class="container">
        <div class="stats-container">
          <div class="stat-card" data-target="31" data-suffix="+">
            <div class="stat-icon-box">
              <i class="fas fa-globe"></i>
            </div>
            <div class="stat-text">
              <div class="stat-number-wrapper">
                <span class="stat-number">0</span><span class="stat-suffix">+</span>
              </div>
              <div class="stat-label">CITIES</div>
            </div>
          </div>

          <div class="stat-card" data-target="1500000" data-suffix="+">
            <div class="stat-icon-box">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-text">
              <div class="stat-number-wrapper">
                <span class="stat-number">0</span><span class="stat-suffix">+</span>
              </div>
              <div class="stat-label">COMMUNITY MEMBERS</div>
            </div>
          </div>

          <div class="stat-card" data-target="10000" data-suffix="+">
            <div class="stat-icon-box">
              <i class="fas fa-shield-halved"></i>
            </div>
            <div class="stat-text">
              <div class="stat-number-wrapper">
                <span class="stat-number">0</span><span class="stat-suffix">+</span>
              </div>
              <div class="stat-label">VERIFIED MEMBERS</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Feature Highlights -->
    <section class="feature-highlight-section">
      <!-- Section 1: Community -->
      <div class="feature-block">
        <div class="container">
          <div class="feature-row">
            <div class="feature-content animate-on-scroll">
              <span class="feature-tagline">
                <i class="fas fa-shield-halved"></i> SAFE & TRUSTED COMMUNITY
              </span>
              <h2 class="feature-heading">Find your perfect roommate with complete peace of mind.</h2>
              <p class="feature-subtext">We know finding a roommate can feel overwhelming. That's why every listing and profile on RoommateGroups is carefully moderated to keep you safe from scams and fraud.</p>
              
              <ul class="feature-checklist">
                <li><i class="fas fa-check-circle"></i> All listings manually moderated</li>
                <li><i class="fas fa-check-circle"></i> Scam-free verified environment</li>
                <li><i class="fas fa-check-circle"></i> Secure chat via Facebook Messenger</li>
                <li><i class="fas fa-check-circle"></i> Active in 31+ cities worldwide</li>
              </ul>
              
              <a href="/safety" class="feature-cta">Learn more about our community →</a>
            </div>
            <div class="feature-image animate-on-scroll">
              <div class="image-wrapper">
                <img src="/assets/img/community.png" alt="Happy roommates in a shared living space">
                <div class="image-accent-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Listings -->
      <div class="feature-block section-light">
        <div class="container">
          <div class="feature-row reverse">
            <div class="feature-content animate-on-scroll">
              <span class="feature-tagline">
                <i class="fas fa-list-check"></i> LISTINGS & CONNECTIONS
              </span>
              <h2 class="feature-heading">Connect with 1,500,000+ community members looking for the same thing.</h2>
              <p class="feature-subtext">Whether you're a student, a working professional, or a landlord — our platform connects you with genuine, relevant matches fast. No endless scrolling, no wasted time.</p>
              
              <ul class="feature-checklist grid-2-col">
                <li><i class="fas fa-check-circle"></i> 10,000+ verified members</li>
                <li><i class="fas fa-check-circle"></i> Students & professionals</li>
                <li><i class="fas fa-check-circle"></i> Furnished room options</li>
                <li><i class="fas fa-check-circle"></i> Budget-friendly matches</li>
                <li><i class="fas fa-check-circle"></i> Landlord-friendly tools</li>
                <li><i class="fas fa-check-circle"></i> Global city coverage</li>
              </ul>
              
              <a href="/search/rooms" class="feature-cta">Explore listings →</a>
            </div>
            <div class="feature-image animate-on-scroll">
              <div class="image-wrapper">
                <img src="/assets/img/mockup.png" alt="RoommateGroups Dashboard and Map Mockup">
                <div class="image-accent-glow-secondary"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="section section-light" id="how-it-works">
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>How It Works</h2>
          <p>Finding your next room or roommate is as easy as 1-2-3</p>
        </div>
        <div class="steps-grid">
          <div class="step-card animate-on-scroll">
            <div class="step-icon">
              <i class="fas fa-magnifying-glass"></i>
              <div class="step-number">1</div>
            </div>
            <h3>Search</h3>
            <p>Browse rooms and roommate profiles in your desired city. Filter by price, location, and preferences.</p>
          </div>
          <div class="step-card animate-on-scroll">
            <div class="step-icon">
              <i class="fas fa-comments"></i>
              <div class="step-number">2</div>
            </div>
            <h3>Connect</h3>
            <p>Message verified members directly through our secure platform. Get to know potential roommates.</p>
          </div>
          <div class="step-card animate-on-scroll">
            <div class="step-icon">
              <i class="fas fa-house-circle-check"></i>
              <div class="step-number">3</div>
            </div>
            <h3>Move In</h3>
            <p>Find your perfect match and move in with confidence. Join thousands of happy renters worldwide.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Listings -->
    <section class="section" id="listings">
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>Listings</h2>
          <p>Hand-picked rooms and apartments from our verified hosts</p>
        </div>
        ${db.listings.find(l => l.status === 'active').length > 0 ? `
        <div class="listings-wrapper">
          <div class="listings-track" id="listings-track">
            ${db.listings.find(l => l.status === 'active').slice(0, 6).map((l, i) => renderListingCard(l, i)).join('')}
          </div>
        </div>
        <div class="carousel-controls">
          <button class="carousel-btn" id="carousel-prev" aria-label="Previous listings">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="carousel-btn" id="carousel-next" aria-label="Next listings">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        ` : `
        <div style="text-align:center;padding:60px 20px;color:#64748b;">
          <i class="fas fa-home" style="font-size:2.5rem;margin-bottom:16px;display:block;opacity:0.4;"></i>
          <p style="font-size:1.1rem;margin-bottom:16px;">No listings available yet. Be the first to list!</p>
          <a href="/post-listing" class="btn btn-primary">Post a Listing</a>
        </div>
        `}
      </div>
    </section>

    <!-- Testimonials -->
    <section class="section section-light" id="testimonials">
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>What Our Members Say</h2>
          <p>Hear from real people who found their perfect living situation</p>
        </div>
        <div class="testimonials-carousel-container">
          <div class="testimonials-marquee marquee-ltr">
            ${[...testimonials, ...testimonials, ...testimonials, ...testimonials].map(t => `
              <div class="testimonial-card glass-card">
                <div class="glass-orb"></div>
                <i class="fas fa-quote-right quote-icon"></i>
                <div class="testimonial-stars">
                  ${Array(t.rating).fill('<i class="fas fa-star"></i>').join('')}
                </div>
                <p class="testimonial-quote">"${t.quote}"</p>
                <div class="testimonial-author">
                  <div class="testimonial-avatar" style="background: linear-gradient(45deg, ${t.color}, ${t.color}dd)">
                    ${t.initials}
                  </div>
                  <div class="author-info">
                    <div class="testimonial-name">${t.name}</div>
                    <div class="testimonial-city">${t.city}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section" id="cta">
      <div class="container">
        <div class="cta-content animate-on-scroll">
          <h2>List Your Room for Free</h2>
          <p>Reach thousands of verified renters looking for their next home. No fees, no hassle.</p>
          <a href="/post-listing" class="btn btn-white btn-lg">
            <i class="fas fa-plus"></i>
            Post a Listing
          </a>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="section home-faq-section" id="faq">
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about RoommateGroups</p>
        </div>
        <div class="home-faq-list">
          ${[
      { q: 'How do I join a group?', a: 'Click on the city you\'re interested in, then click the link to join the corresponding Facebook group.' },
      { q: 'Can I find roommates for short-term stays?', a: 'Yes, many groups cater to both short-term and long-term housing needs.' },
      { q: 'How does Roommate Groups help me find roommates?', a: 'Roommate Groups is a membership platform that connects you with potential roommates through dedicated Facebook groups. Once you join, you\'ll gain access to these groups where you can interact with other members, post about your roommate search, and browse listings from others looking for roommates in your area.' },
      { q: 'Is there a fee to use Roommate Groups?', a: 'Yes, Roommate Groups operates on a membership model. By paying a fee, you gain access to our curated Facebook groups where you can connect with potential roommates. This membership helps ensure that all users are serious about finding roommates and maintains the quality of our community.' },
      { q: 'How do I make a payment for subscription services?', a: 'Follow the call-to-action link for payment on each group\'s page, and the information will be processed accordingly.' },
    ].map(item => `
            <div class="home-faq-item animate-on-scroll">
              <div class="home-faq-icon"><i class="fas fa-question-circle"></i></div>
              <div class="home-faq-content">
                <div class="home-faq-q">${item.q}</div>
                <div class="home-faq-a">${item.a}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    ${renderFooter()}
  `;

  // ── Interactivity ───────────────────────────────────
  initNavbar();

  // Carousel controls
  const track = document.getElementById('listings-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const scrollAmount = 320;

  if (prevBtn && track) prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  if (nextBtn && track) nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  // Scroll-triggered animations (Intersection Observer)
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    // Skip hash-route links (e.g., #/auth/login)
    const href = anchor.getAttribute('href');
    if (href.startsWith('#/')) return;

    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Country → City filter
  const countrySelect = document.getElementById('search-country');
  const citySelect = document.getElementById('search-city');

  countrySelect.addEventListener('change', () => {
    const selectedCountry = countrySelect.value;
    const filtered = selectedCountry
      ? dbCities.filter(c => c.country === selectedCountry)
      : dbCities;
    citySelect.innerHTML =
      '<option value="">Select City</option>' +
      filtered.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
  });

  // Home Page Search
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const countryQuery = countrySelect.value;
      const cityQuery = citySelect.value;
      const typeQuery = document.getElementById('search-type').value;

      if (cityQuery || countryQuery) {
        const params = new URLSearchParams();
        if (countryQuery) params.set('country', countryQuery);
        if (cityQuery) params.set('city', cityQuery);
        if (typeQuery) params.set('type', typeQuery);
        navigate('/search/rooms?' + params.toString());
      } else {
        citySelect.focus();
        citySelect.classList.add('error-shake');
        setTimeout(() => citySelect.classList.remove('error-shake'), 500);
      }
    });
  }

  // ── Stats Counting Animation ──────────────────────
  const animateValue = (el, start, end, duration, prefix = '', suffix = '') => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);

      const current = (ease * (end - start) + start);

      el.textContent = Math.floor(current).toLocaleString();

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = entry.target.querySelectorAll('.stat-card');
        cards.forEach(card => {
          const numEl = card.querySelector('.stat-number');
          const target = parseFloat(card.dataset.target);
          const prefix = card.dataset.prefix || '';
          const suffix = card.dataset.suffix || '';
          const startVal = prefix === '1.' ? 0 : 0;

          animateValue(numEl, startVal, target, 1800, prefix, suffix);

          // Animate progress bar
          const bar = card.querySelector('.stat-progress-bar');
          if (bar) {
            bar.style.width = bar.style.getPropertyValue('--width');
          }
        });
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.getElementById('stats');
  if (statsSection) statObserver.observe(statsSection);

}
