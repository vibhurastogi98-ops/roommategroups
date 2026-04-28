// ── Listing Details Page ──────────────────────────────────────

import { db } from '../services/db.js';
import { renderFooter } from '../components/footer.js';
import { getCurrentUser, getVerificationBadge } from '../services/auth.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { navigate } from '../router.js';
import { setSEO } from '../seo.js'; // SEO Update

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(iso) {
    if (!iso) return 'Flexible';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function showToast(message, type = 'success') {
    const existing = document.getElementById('rg-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'rg-toast';
    toast.className = 'rg-toast rg-toast-' + type;
    toast.innerHTML = '<i class="fa-solid ' + (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check') + '"></i> ' + message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 3500);
}

// Accepts both legacy string photos and new { thumb, medium, full } objects.
function getPhotoSrc(photo, size) {
    if (!photo) return '';
    if (typeof photo === 'string') return photo;
    return photo[size] || photo.medium || photo.full || photo.thumb || '';
}

// Holds cleanup ref for keyboard listener so re-renders don't stack handlers.
let _lbKeyCleanup = null;

export function renderListingDetailPage(app, params) {
    const listingId = params.id;
    // console.log('[Listing] Rendering ID:', listingId);
    const listing = db.listings.findById(listingId);

    if (!listing) {
        app.innerHTML = `
            ${renderNavbar()}
            <div style="max-width:800px;margin:100px auto;text-align:center;padding:40px;">
                <div style="font-size:4rem;margin-bottom:20px;">🕵️</div>
                <h1 style="font-size:2rem;font-weight:800;color:#1e293b;margin-bottom:16px;">Listing Not Found</h1>
                <p style="color:#64748b;margin-bottom:32px;">The listing you're looking for may have been removed or rented.</p>
                <a href="/search/rooms" style="background:#1a1a1a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Back to Search</a>
            </div>
            ${renderFooter()}
        `;
        return;
    }

    // SEO Update — dynamic per-listing meta, OG image, and RealEstateListing schema
    const _listingPhotos = (() => { let p = listing.images || listing.photos || []; if (typeof p === 'string') { try { p = JSON.parse(p); } catch(e) { p = []; } } return p; })();
    const _firstPhoto = (typeof _listingPhotos[0] === 'object' ? (_listingPhotos[0]?.medium || _listingPhotos[0]?.full) : _listingPhotos[0]) || 'https://roommategroups.com/logo.png';
    const _cityName = db.cities.findById(listing.city)?.name || listing.city || '';
    setSEO({
        title: `${listing.title} | RoommateGroups`.substring(0, 60),
        description: (listing.description || `Room for rent in ${_cityName}. $${listing.rent ?? listing.price}/mo.`).slice(0, 150),
        canonical: `https://roommategroups.com/listing/${listing.listing_id}`,
        ogImage: _firstPhoto,
        schema: {
            '@context': 'https://schema.org',
            '@type': 'RealEstateListing',
            name: listing.title,
            url: `https://roommategroups.com/listing/${listing.listing_id}`,
            description: listing.description || '',
            image: _firstPhoto,
            offers: {
                '@type': 'Offer',
                price: listing.rent ?? listing.price ?? 0,
                priceCurrency: 'USD',
            },
        },
    });

    // Increment view count (skip for listing owner)
    const viewingUser = getCurrentUser();
    if (!viewingUser || viewingUser.id !== listing.user_id) {
        db.listings.update(listingId, { views_count: (listing.views_count || 0) + 1 });
    }

    const isRoommate = listing.category === 'roommate_wanted' || listing.category === 'room_wanted';
    // images can be a JSON string (from D1) or an array (from localStorage)
    let _imgs = listing.images || listing.photos || [];
    if (typeof _imgs === 'string') { try { _imgs = JSON.parse(_imgs); } catch(e) { _imgs = []; } }
    const photos = _imgs.length > 0
        ? _imgs
        : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop'];

    // Ensure amenities is an array (handle cached D1 JSON strings)
    let _amenities = listing.amenities || [];
    if (typeof _amenities === 'string') { try { _amenities = JSON.parse(_amenities); } catch(e) { _amenities = []; } }

    // Poster Info
    let user = listing.user_details;
    if (!user && listing.user_id) user = db.users.findById(listing.user_id);
    const posterName = user ? user.display_name : 'Unknown User';
    const avatar = (user && user.profile_photo) ? user.profile_photo : ('https://ui-avatars.com/api/?name=' + encodeURIComponent(posterName) + '&background=6366f1&color=fff');
    const verifiedIcon = user ? getVerificationBadge(user) : '';

    // Amenities Map
    const allAmenities = {
        'amen_wifi': { icon: 'fa-wifi', label: 'Fast WiFi' },
        'amen_laundry': { icon: 'fa-jug-detergent', label: 'In-unit Laundry' },
        'amen_gym': { icon: 'fa-dumbbell', label: 'Fitness Center' },
        'amen_ac': { icon: 'fa-snowflake', label: 'Air Conditioning' },
        'amen_parking': { icon: 'fa-car', label: 'Parking Available' },
        'amen_pool': { icon: 'fa-water-ladder', label: 'Swimming Pool' },
        'amen_pets': { icon: 'fa-paw', label: 'Pet Friendly' },
        'amen_tv': { icon: 'fa-tv', label: 'Smart TV' },
        'amen_balcony': { icon: 'fa-umbrella-beach', label: 'Balcony/Patio' },
        'amen_kitchen': { icon: 'fa-kitchen-set', label: 'Full Kitchen' },
        'amen_elevator': { icon: 'fa-elevator', label: 'Elevator' }
    };

    // Check if saved & if current user owns this listing
    const currentUser = getCurrentUser();
    const isOwner = !!(currentUser && listing.user_id && currentUser.id === listing.user_id);
    let isSaved = false;
    if (currentUser && !isOwner) {
        const dbUser = db.users.findById(currentUser.id);
        if (dbUser && dbUser.saved_listings && dbUser.saved_listings.includes(listing.listing_id)) {
            isSaved = true;
        }
    }

    app.innerHTML = `
    <style>
        .ld-body { background: #f8fafc; min-height: 100vh; padding-bottom: 80px; }
        
        /* ── Gallery ── */
        .ld-gallery-wrap { max-width: 1200px; margin: 24px auto; padding: 0 24px; position: relative; }
        .ld-gallery-grid { display: grid; grid-template-columns: 3fr 2fr; height: 500px; gap: 6px; border-radius: 16px; overflow: hidden; }
        .ld-gallery-thumbs { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 6px; }
        .ld-gallery-slot { position: relative; overflow: hidden; background: #e2e8f0; cursor: pointer; }
        .ld-thumb-empty { background: #f1f5f9; cursor: default; }
        .ld-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s ease; }
        .ld-gallery-slot:not(.ld-thumb-empty):hover .ld-img { transform: scale(1.04); }
        .ld-img-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.8rem; opacity: 0; transition: all 0.28s; z-index: 2; pointer-events: none; }
        .ld-gallery-slot:not(.ld-thumb-empty):hover .ld-img-overlay { background: rgba(0,0,0,0.22); opacity: 1; }
        .ld-img-skeleton { position: absolute; inset: 0; background: linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%); background-size: 200% 100%; animation: ld-shimmer 1.6s ease-in-out infinite; z-index: 1; transition: opacity 0.35s; pointer-events: none; }
        @keyframes ld-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .ld-gallery-more-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.52); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: 700; z-index: 3; }
        .ld-view-all-btn { position: absolute; bottom: 18px; right: 44px; background: white; color: #1a1a1a; border: 1.5px solid #e2e8f0; padding: 9px 16px; border-radius: 10px; font-size: 0.88rem; font-weight: 700; cursor: pointer; box-shadow: 0 2px 12px rgba(0,0,0,0.1); transition: background 0.2s; display: flex; align-items: center; gap: 7px; z-index: 10; }
        .ld-view-all-btn:hover { background: #f8fafc; }
        /* ── Lightbox ── */
        .ld-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.94); z-index: 9999; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.25s; }
        .ld-lightbox.open { opacity: 1; pointer-events: all; }
        .ld-lb-img-wrap { max-width: 90vw; max-height: 88vh; display: flex; align-items: center; justify-content: center; }
        #ld-lb-img { max-width: 90vw; max-height: 88vh; object-fit: contain; border-radius: 6px; transition: opacity 0.18s; display: block; user-select: none; }
        .ld-lb-close { position: absolute; top: 20px; right: 22px; background: rgba(255,255,255,0.12); border: none; color: white; width: 46px; height: 46px; border-radius: 50%; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; transition: background 0.2s; z-index: 1; }
        .ld-lb-close:hover,.ld-lb-prev:hover,.ld-lb-next:hover { background: rgba(255,255,255,0.22); }
        .ld-lb-prev,.ld-lb-next { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.12); border: none; color: white; width: 54px; height: 54px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; transition: background 0.2s; z-index: 1; }
        .ld-lb-prev { left: 22px; } .ld-lb-next { right: 22px; }
        .ld-lb-counter { position: absolute; bottom: 26px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.85); font-size: 0.9rem; font-weight: 600; background: rgba(0,0,0,0.38); padding: 6px 16px; border-radius: 20px; white-space: nowrap; }
        
        /* Main Layout */
        .ld-container { max-width: 1200px; margin: 40px auto; padding: 0 24px; display: grid; grid-template-columns: 2fr 1fr; gap: 64px; align-items: start; }
        
        /* Left Column - Details */
        .ld-header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
        .ld-title { font-size: clamp(1.8rem, 4vw, 2.4rem); font-weight: 800; color: #1e293b; margin-bottom: 12px; line-height: 1.2; }
        .ld-location { font-size: 1.1rem; color: #64748b; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .ld-badges { display: flex; gap: 10px; flex-wrap: wrap; }
        .ld-badge { background: #f5f5f5; color: #1a1a1a; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        
        .ld-section { margin-bottom: 40px; padding-bottom: 40px; border-bottom: 1px solid #e2e8f0; }
        .ld-section h2 { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .ld-desc { color: #475569; font-size: 1.05rem; line-height: 1.8; white-space: pre-wrap; }
        
        .ld-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .ld-fact { display: flex; align-items: center; gap: 16px; }
        .ld-fact-icon { width: 44px; height: 44px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #64748b; }
        .ld-fact-text strong { display: block; font-size: 0.9rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
        .ld-fact-text span { font-size: 1.05rem; font-weight: 600; color: #1e293b; }
        
        .ld-amenities { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
        .ld-amenity { display: flex; align-items: center; gap: 12px; color: #475569; font-size: 1rem; }
        .ld-amenity i { font-size: 1.2rem; color: #64748b; width: 24px; text-align: center; }
        
        /* Right Column - Sticky Sidebar */
        .ld-sidebar { position: sticky; top: 100px; }
        .ld-price-card { background: white; border-radius: 24px; padding: 32px; box-shadow: 0 12px 40px rgba(0,0,0,0.08); border: 1px solid #f1f5f9; margin-bottom: 24px; }
        .ld-price { font-size: 2.5rem; font-weight: 800; color: #1e293b; margin-bottom: 4px; display: flex; align-items: baseline; gap: 8px; }
        .ld-price span { font-size: 1.1rem; color: #64748b; font-weight: 500; }
        .ld-deposit { font-size: 0.95rem; color: #64748b; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
        
        .ld-btn-primary { width: 100%; background: linear-gradient(135deg, #1a1a1a, #333333); color: white; border: none; padding: 16px; border-radius: 12px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .ld-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99,102,241,0.25); }
        .ld-btn-outline { width: 100%; background: white; color: #1e293b; border: 1.5px solid #e2e8f0; padding: 16px; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .ld-btn-outline:hover { background: #f8fafc; }
        
        .ld-host-card { background: white; border-radius: 20px; padding: 24px; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: background 0.2s; }
        .ld-host-card:hover { background: #f8fafc; }
        .ld-host-avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
        .ld-host-info h4 { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
        .ld-host-info p { font-size: 0.9rem; color: #64748b; margin-bottom: 4px; }
        
        /* Mobile logic */
        @media (max-width: 992px) {
            .ld-container { grid-template-columns: 1fr; gap: 40px; }
            .ld-sidebar { position: static; }
        }
        @media (max-width: 768px) {
            .ld-gallery-grid { grid-template-columns: 1fr; height: 280px; border-radius: 0; }
            .ld-gallery-thumbs { display: none; }
            .ld-gallery-wrap { padding: 0; margin-top: 0; }
            .ld-view-all-btn { bottom: 12px; right: 12px; font-size: 0.8rem; padding: 7px 12px; }
            .ld-grid-2 { grid-template-columns: 1fr; }
        }
    </style>
    
    <div class="ld-body">
        ${renderNavbar()}

        <!-- Photo Gallery — Airbnb-style: main image + 2×2 thumbnail grid -->
        <div class="ld-gallery-wrap">
            <div class="ld-gallery-grid">
                <div class="ld-gallery-slot ld-gallery-main" data-lb-idx="0">
                    <img src="${getPhotoSrc(photos[0], 'medium')}" class="ld-img" alt="${escHtml(listing.title)}" loading="eager" onload="var s=this.parentElement.querySelector('.ld-img-skeleton');if(s)s.style.opacity='0'">
                    <div class="ld-img-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
                    <div class="ld-img-skeleton"></div>
                </div>
                ${photos.length > 1 ? `<div class="ld-gallery-thumbs">${[1,2,3,4].map(i=>{const p=photos[i];if(!p)return '<div class="ld-gallery-slot ld-gallery-thumb ld-thumb-empty"></div>';const showMore=i===4&&photos.length>5;return `<div class="ld-gallery-slot ld-gallery-thumb" data-lb-idx="${i}"><img src="${getPhotoSrc(p,'thumb')}" class="ld-img" alt="${escHtml(listing.title)} Thumbnail" loading="lazy" onload="var s=this.parentElement.querySelector('.ld-img-skeleton');if(s)s.style.opacity='0'"><div class="ld-img-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div><div class="ld-img-skeleton"></div>${showMore?`<div class="ld-gallery-more-overlay">+${photos.length-5} more</div>`:''}</div>`;}).join('')}</div>` : ''}
            </div>
            ${photos.length > 1 ? `<button class="ld-view-all-btn" id="ld-view-all-btn"><i class="fa-regular fa-images"></i> All ${photos.length} photos</button>` : ''}
        </div>

        <div class="ld-container">
            <!-- Left Column: Details -->
            <div class="ld-main">
                <div class="ld-header">
                    <h1 class="ld-title">${escHtml(listing.title)}</h1>
                    <div class="ld-location">
                        <i class="fa-solid fa-location-dot"></i>
                        ${escHtml(listing.neighborhood ? listing.neighborhood.replace('nh_', '').replace(/_/g, ' ') + ', ' : '')}
                        ${escHtml(db.cities.findById(listing.city)?.name || (listing.city ? listing.city.replace('city_', '').replace(/_/g, ' ') : 'Unknown City'))}${(() => { const cId = listing.country || db.cities.findById(listing.city)?.country; return cId ? ', ' + escHtml(db.countries.findById(cId)?.name || cId) : ''; })()}
                    </div>
                    <div class="ld-badges">
                        <div class="ld-badge"><i class="fa-solid fa-bed"></i> ${isRoommate ? 'Looking for Room' : (listing.room_type || 'Private Room')}</div>
                        ${listing.furnished === 'yes' ? `<div class="ld-badge" style="background:#f5f5f5;color:#333333;"><i class="fa-solid fa-couch"></i> Furnished</div>` : ''}
                        ${listing.private_bathroom ? `<div class="ld-badge" style="background:#f5f5f5;color:#1a1a1a;"><i class="fa-solid fa-bath"></i> Private Bath</div>` : ''}
                    </div>
                </div>

                <div class="ld-section">
                    <h2><i class="fa-solid fa-circle-info text-primary"></i> Listing Overview</h2>
                    <div class="ld-grid-2">
                        <div class="ld-fact">
                            <div class="ld-fact-icon"><i class="fa-regular fa-calendar-check"></i></div>
                            <div class="ld-fact-text">
                                <strong>Date Available</strong>
                                <span>${formatDate(listing.available_date)}</span>
                            </div>
                        </div>
                        <div class="ld-fact">
                            <div class="ld-fact-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
                            <div class="ld-fact-text">
                                <strong>Min. Stay</strong>
                                <span>${listing.min_stay_months ? listing.min_stay_months + ' months' : 'Flexible'}</span>
                            </div>
                        </div>
                        <div class="ld-fact">
                            <div class="ld-fact-icon"><i class="fa-solid fa-users"></i></div>
                            <div class="ld-fact-text">
                                <strong>Current Cats/Dogs</strong>
                                <span>${listing.pets_allowed === 'yes' ? 'Allowed' : 'Not Allowed'}</span>
                            </div>
                        </div>
                        <div class="ld-fact">
                            <div class="ld-fact-icon"><i class="fa-solid fa-ruler-combined"></i></div>
                            <div class="ld-fact-text">
                                <strong>Property Type</strong>
                                <span>${listing.property_type || 'Apartment'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="ld-section">
                    <h2><i class="fa-solid fa-align-left text-primary"></i> Description</h2>
                    <div class="ld-desc">${escHtml(listing.description || 'No description provided.')}</div>
                </div>

                ${_amenities.length > 0 ? `
                <div class="ld-section" style="border-bottom:none;">
                    <h2><i class="fa-solid fa-wand-magic-sparkles text-primary"></i> Amenities Included</h2>
                    <div class="ld-amenities">
                        ${_amenities.map(key => {
                            const a = allAmenities[key] || { icon: 'fa-circle-check', label: String(key).replace('amen_', '') };
                            return `<div class="ld-amenity"><i class="fa-solid ${a.icon}"></i> ${a.label}</div>`;
                        }).join('')}
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Right Column: Stick Sidebar -->
            <div class="ld-sidebar">
                <div class="ld-price-card">
                    <div class="ld-price">$${listing.rent ?? listing.price ?? '?'} <span>/ month</span></div>
                    <div class="ld-deposit">Includes utilities: ${listing.utilities_included ? 'Yes' : 'No'} • Deposit: $${listing.deposit || 0}</div>
                    
                    ${isOwner ? `
                    <a href="/dashboard/listings" class="ld-btn-primary" style="text-decoration:none;">
                        <i class="fa-solid fa-pen-to-square"></i> Edit Listing
                    </a>
                    <a href="/dashboard/listings" class="ld-btn-outline" style="text-decoration:none;color:#ef4444;border-color:#fecaca;">
                        <i class="fa-solid fa-eye"></i> Manage in Dashboard
                    </a>
                    ` : `
                    <button class="ld-btn-primary" id="msg-host-btn">
                        <i class="fa-solid fa-paper-plane"></i> Message ${posterName.split(' ')[0]}
                    </button>
                    <button class="ld-btn-outline" id="active-save-btn" data-id="${listing.listing_id}">
                        <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart" ${isSaved ? 'style="color:#1a1a1a;"' : ''}></i>
                        <span class="save-text">${isSaved ? 'Saved to Favorites' : 'Save to Favorites'}</span>
                    </button>
                    `}
                    <button class="ld-btn-outline" onclick="window.openShareModal('${listing.listing_id}', event)" style="margin-top:12px; color:#1e293b;">
                        <i class="fa-solid fa-share-nodes"></i>
                        <span>Share Listing</span>
                    </button>
                </div>

                <div class="ld-host-card" id="view-profile-card" data-uid="${user ? user.user_id : ''}">
                    <img src="${avatar}" class="ld-host-avatar" alt="Avatar for ${escHtml(posterName)}" loading="lazy">
                    <div class="ld-host-info">
                        <h4>${escHtml(posterName)} ${verifiedIcon}</h4>
                        <p>Listed ${formatDate(listing.created_at)}</p>
                        <span style="font-size:0.85rem;color:#1a1a1a;font-weight:600;">${isOwner ? 'Your Listing' : 'View Profile'} <i class="fa-solid fa-chevron-right" style="font-size:0.75rem;"></i></span>
                    </div>
                </div>

                ${!isOwner ? `
                <div style="text-align:center;margin-top:20px;">
                    <button id="report-listing-btn" style="background:none;border:none;color:#94a3b8;font-size:0.9rem;text-decoration:underline;cursor:pointer;"><i class="fa-solid fa-flag"></i> Report this listing</button>
                </div>
                ` : ''}
            </div>
        </div>
        
        ${renderFooter()}
    </div>
    <!-- Lightbox modal -->
    <div class="ld-lightbox" id="ld-lightbox">
        <button class="ld-lb-close" id="ld-lb-close"><i class="fa-solid fa-xmark"></i></button>
        <button class="ld-lb-prev" id="ld-lb-prev"><i class="fa-solid fa-chevron-left"></i></button>
        <div class="ld-lb-img-wrap"><img id="ld-lb-img" src="" alt="Full size photo" loading="lazy"></div>
        <button class="ld-lb-next" id="ld-lb-next"><i class="fa-solid fa-chevron-right"></i></button>
        <div class="ld-lb-counter" id="ld-lb-counter">1 / ${photos.length}</div>
    </div>
    `;

    // Add Event Listeners dynamically
    setTimeout(() => {
        // Message Button
        const msgBtn = app.querySelector('#msg-host-btn');
        if (msgBtn) {
            msgBtn.addEventListener('click', async () => {
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    navigate('/auth/login');
                    return;
                }
                if (!user) return; // No host info

                // Start thread logic
                let thread = db.threads.findOne(t => {
                    const parts = typeof t.participants === 'string' ? JSON.parse(t.participants || '[]') : (t.participants || []);
                    return parts.includes(currentUser.id) && 
                           parts.includes(user.user_id) &&
                           (listing.listing_id ? t.listing_id === listing.listing_id : true);
                });

                if (!thread) {
                    thread = await db.threads.create({
                        listing_id: listing.listing_id,
                        participants: [currentUser.id, user.user_id],
                        last_message_at: new Date().toISOString(),
                        last_message_preview: 'Interested in this listing.',
                        ['unread_count_' + user.user_id]: 1,
                        ['unread_count_' + currentUser.id]: 0,
                        is_archived: false,
                        blocked_by: null
                    });
                    // Create first system message
                    await db.messages.create({
                        thread_id: thread.thread_id,
                        sender_id: currentUser.id,
                        content: 'Hi! I am interested in your listing: ' + listing.title,
                        is_read: false,
                        created_at: new Date().toISOString()
                    });
                } else {
                    // Update timestamp to bring to top
                    await db.threads.update(thread.thread_id, { last_message_at: new Date().toISOString() });
                }

                navigate('/dashboard/messages?threadId=' + thread.thread_id);
            });
        }

        // View Profile
        const profileCard = app.querySelector('#view-profile-card');
        if (profileCard) {
            profileCard.addEventListener('click', () => {
                const uid = profileCard.dataset.uid;
                if (uid) navigate('/profile/' + uid);
            });
        }

        // Report Listing
        const reportBtn = app.querySelector('#report-listing-btn');
        if (reportBtn) {
            reportBtn.addEventListener('click', () => {
                const reason = prompt('Why are you reporting this listing?');
                if (reason) {
                    db.reports.create({
                        type: 'listing',
                        target_id: listing.listing_id,
                        target_name: listing.title,
                        reporter_id: getCurrentUser()?.id || 'anonymous',
                        reason: reason,
                        status: 'pending',
                        priority: 'medium'
                    });
                    showToast('Report submitted. Thank you.');
                }
            });
        }

        const saveBtn = app.querySelector('#active-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const listingId = saveBtn.dataset.id;
                const userObj = getCurrentUser();
                
                if (!userObj) {
                    navigate('/auth/login');
                    return;
                }
                
                const dbUser = db.users.findById(userObj.id);
                if (!dbUser) return;
                if (!dbUser.saved_listings) dbUser.saved_listings = [];
                
                const idx = dbUser.saved_listings.indexOf(listingId);
                if (idx > -1) {
                    dbUser.saved_listings.splice(idx, 1);
                    saveBtn.querySelector('i').className = 'fa-regular fa-heart';
                    saveBtn.querySelector('i').style.color = '';
                    saveBtn.querySelector('.save-text').textContent = 'Save to Favorites';
                } else {
                    dbUser.saved_listings.push(listingId);
                    saveBtn.querySelector('i').className = 'fa-solid fa-heart';
                    saveBtn.querySelector('i').style.color = '#1a1a1a';
                    saveBtn.querySelector('.save-text').textContent = 'Saved to Favorites';
                }
                await db.users.update(userObj.id, { saved_listings: dbUser.saved_listings });
            });
        }

        // ── Gallery & Lightbox ────────────────────────────────────
        const lb      = app.querySelector('#ld-lightbox');
        const lbImg   = app.querySelector('#ld-lb-img');
        const lbCounter = app.querySelector('#ld-lb-counter');
        let lbIndex   = 0;

        function openLb(idx) {
            lbIndex = Math.max(0, Math.min(idx, photos.length - 1));
            lbImg.style.opacity = '0';
            lbImg.src = getPhotoSrc(photos[lbIndex], 'full');
            lbImg.onload = () => { lbImg.style.opacity = '1'; };
            if (lbImg.complete && lbImg.naturalWidth) lbImg.style.opacity = '1';
            lbCounter.textContent = `${lbIndex + 1} / ${photos.length}`;
            const showNav = photos.length > 1;
            app.querySelector('#ld-lb-prev').style.display = showNav ? '' : 'none';
            app.querySelector('#ld-lb-next').style.display = showNav ? '' : 'none';
            lb.classList.add('open');
            document.body.style.overflow = 'hidden';
        }

        function closeLb() {
            lb.classList.remove('open');
            document.body.style.overflow = '';
        }

        function lbGo(dir) {
            lbIndex = (lbIndex + dir + photos.length) % photos.length;
            lbImg.style.opacity = '0';
            setTimeout(() => {
                lbImg.src = getPhotoSrc(photos[lbIndex], 'full');
                lbImg.onload = () => { lbImg.style.opacity = '1'; };
                if (lbImg.complete && lbImg.naturalWidth) lbImg.style.opacity = '1';
                lbCounter.textContent = `${lbIndex + 1} / ${photos.length}`;
            }, 160);
        }

        // Gallery slot clicks → open lightbox at that index
        app.querySelectorAll('[data-lb-idx]').forEach(slot => {
            slot.addEventListener('click', () => openLb(parseInt(slot.dataset.lbIdx)));
        });

        app.querySelector('#ld-lb-close').addEventListener('click', closeLb);
        app.querySelector('#ld-lb-prev').addEventListener('click', () => lbGo(-1));
        app.querySelector('#ld-lb-next').addEventListener('click', () => lbGo(1));
        lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });

        const viewAllBtn = app.querySelector('#ld-view-all-btn');
        if (viewAllBtn) viewAllBtn.addEventListener('click', () => openLb(0));

        // Keyboard navigation — cleaned up on re-render to prevent stacking
        if (_lbKeyCleanup) { _lbKeyCleanup(); _lbKeyCleanup = null; }
        function lbKeyHandler(e) {
            if (!lb.classList.contains('open')) return;
            if (e.key === 'ArrowLeft')  lbGo(-1);
            if (e.key === 'ArrowRight') lbGo(1);
            if (e.key === 'Escape')     closeLb();
        }
        document.addEventListener('keydown', lbKeyHandler);
        _lbKeyCleanup = () => document.removeEventListener('keydown', lbKeyHandler);

        initNavbar();
    }, 0);
}

