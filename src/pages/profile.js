import { db } from '../services/db.js';
import { navigate } from '../router.js';
import { getCurrentUser, getVerificationBadge } from '../services/auth.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';

export function renderProfilePage(app, params) {
    const userId = params.id;
    const user = db.users.findById(userId);

    if (!user) {
        app.innerHTML = `
            ${renderNavbar()}
            <div style="max-width:800px;margin:100px auto;text-align:center;padding:40px;">
                <div style="font-size:4rem;margin-bottom:20px;">👤</div>
                <h1 style="font-size:2rem;font-weight:800;color:#1e293b;margin-bottom:16px;">Profile Not Found</h1>
                <p style="color:#64748b;margin-bottom:32px;">The user you are looking for does not exist or has a private profile.</p>
                <a href="/" style="background:#1a1a1a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Back to Home</a>
            </div>
        `;
        return;
    }

    const avatar = user.profile_photo || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(user.display_name) + '&background=6366f1&color=fff&size=200');
    const verifiedIcon = getVerificationBadge(user);
    const currentUser = getCurrentUser();

    // Get user listings
    const listings = db.listings.find(l => l.user_id === user.user_id && l.status === 'active');

    app.innerHTML = `
    <style>
        .prof-container { max-width: 1000px; margin: 40px auto; padding: 0 24px; display: grid; grid-template-columns: 300px 1fr; gap: 40px; }
        .prof-sidebar { position: sticky; top: 100px; }
        .prof-card { background: white; border-radius: 24px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; text-align: center; }
        .prof-avatar { width: 160px; height: 160px; border-radius: 50%; object-fit: cover; margin-bottom: 24px; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .prof-name { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
        .prof-location { color: #64748b; font-size: 0.95rem; margin-bottom: 24px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        
        .prof-badges { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; text-align: left; }
        .prof-badge-item { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: #475569; padding: 12px; background: #f8fafc; border-radius: 12px; }
        .prof-badge-item i { width: 20px; text-align: center; color: #1a1a1a; }

        .prof-main { }
        .prof-section { background: white; border-radius: 24px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; margin-bottom: 32px; }
        .prof-section h2 { font-size: 1.3rem; font-weight: 800; color: #1e293b; margin-bottom: 20px; }
        .prof-bio { color: #475569; font-size: 1.05rem; line-height: 1.7; white-space: pre-wrap; }
        
        .prof-tags { display: flex; flex-wrap: wrap; gap: 10px; }
        .prof-tag { background: #f1f5f9; color: #475569; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }

        .prof-listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        .prof-listing-card { background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; transition: transform 0.2s; text-decoration: none; color: inherit; }
        .prof-listing-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.05); }
        .plc-img { width: 100%; height: 160px; object-fit: cover; }
        .plc-body { padding: 16px; }
        .plc-price { font-size: 1.1rem; font-weight: 800; color: #1a1a1a; margin-bottom: 4px; }
        .plc-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin-bottom: 8px; }

        @media (max-width: 768px) {
            .prof-container { grid-template-columns: 1fr; }
            .prof-sidebar { position: static; }
        }
    </style>

    <div style="background:#f8fafc; min-height:100vh;">
        ${renderNavbar()}

        <div class="prof-container">
            <div class="prof-sidebar">
                <div class="prof-card">
                    <img src="${avatar}" class="prof-avatar" alt="${user.display_name}">
                    <h1 class="prof-name">${user.display_name} ${verifiedIcon}</h1>
                    <div class="prof-location"><i class="fa-solid fa-location-dot"></i> ${user.city ? user.city.replace('city_', '').replace('_', ' ') : 'Global Citizen'}</div>
                    
                    ${currentUser && currentUser.id !== user.user_id ? `
                        <button class="btn btn-primary" style="width:100%;" id="prof-msg-btn">
                            <i class="fa-solid fa-envelope"></i> Message
                        </button>
                    ` : ''}

                    <div class="prof-badges">
                         <div class="prof-badge-item"><i class="fa-solid fa-check-circle"></i> Identity Verified</div>
                         <div class="prof-badge-item"><i class="fa-solid fa-clock"></i> Joined ${new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            <div class="prof-main">
                <div class="prof-section">
                    <h2>About ${user.display_name.split(' ')[0]}</h2>
                    <div class="prof-bio">${user.bio || 'No bio provided.'}</div>
                </div>

                ${user.lifestyle_tags && user.lifestyle_tags.length > 0 ? `
                <div class="prof-section">
                    <h2>Lifestyle</h2>
                    <div class="prof-tags">
                        ${user.lifestyle_tags.map(t => `<span class="prof-tag">${t.replace('tag_', '')}</span>`).join('')}
                    </div>
                </div>
                ` : ''}

                <div class="prof-section">
                    <h2>Active Listings</h2>
                    ${listings.length > 0 ? `
                        <div class="prof-listings-grid">
                            ${listings.map(l => `
                                <a href="/listing/${l.listing_id}" class="prof-listing-card">
                                    <img src="${(() => { let _i = l.images || l.photos || []; if (typeof _i === 'string') { try { _i = JSON.parse(_i); } catch(e) { _i = []; } } let p = _i[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'; if (typeof p === 'object' && p !== null) return p.medium || p.thumb || p.full || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'; return p; })()}" class="plc-img">
                                    <div class="plc-body">
                                        <div class="plc-price">$${l.rent ?? l.price ?? '?'}/mo</div>
                                        <div class="plc-title">${l.title}</div>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    ` : '<p style="color:#64748b;">No active listings at the moment.</p>'}
                </div>
            </div>
        </div>
    </div>
    `;

    // Add listener for message button in profile
    setTimeout(() => {
        const msgBtn = app.querySelector('#prof-msg-btn');
        if (msgBtn) {
            msgBtn.addEventListener('click', async () => {
                if (!currentUser) {
                    navigate('/auth/login');
                    return;
                }
                
                // For profile-only start, we might not have a listing_id easily, 
                // but let's see if they have any listing or just start a generic thread
                const listingId = listings.length > 0 ? listings[0].listing_id : null;

                let thread = db.threads.findOne(t => 
                    t.participants.includes(currentUser.id) && 
                    t.participants.includes(user.user_id) &&
                    (listingId ? t.listing_id === listingId : true)
                );

                if (!thread) {
                    thread = await db.threads.create({
                        listing_id: listingId,
                        participants: [currentUser.id, user.user_id],
                        last_message_at: new Date().toISOString(),
                        last_message_preview: 'Started a conversation.',
                        ['unread_count_' + user.user_id]: 1,
                        ['unread_count_' + currentUser.id]: 0,
                        is_archived: false,
                        blocked_by: null
                    });
                    await db.messages.create({
                        thread_id: thread.thread_id,
                        sender_id: currentUser.id,
                        content: 'Hi! I saw your profile and wanted to connect.',
                        is_read: false,
                        created_at: new Date().toISOString()
                    });
                } else {
                     await db.threads.update(thread.thread_id, { last_message_at: new Date().toISOString() });
                }

                navigate('/dashboard/messages?threadId=' + thread.thread_id);
            });
        }
        initNavbar();
    }, 0);
}
