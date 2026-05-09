// ── Messaging Service ────────────────────────────────────────
// All business logic for the messaging system.

import { db, syncMessagesAndThreads } from './db.js';

const RATE_LIMIT_MAX = 50;       // messages per hour
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in ms
const POLL_INTERVAL = 10000;     // 10 seconds

// External payment site patterns to warn about
const PAYMENT_LINK_PATTERNS = [
    /venmo\.com/i, /paypal\.com/i, /zelle\.com/i, /cashapp\.com/i,
    /cash\.app/i, /westernunion\.com/i, /moneygram\.com/i, /wise\.com/i,
    /transferwise\.com/i, /revolut\.com/i,
];

let _pollingInterval = null;

// ── Thread Management ─────────────────────────────────────────

/**
 * Find existing thread for a listing between two users, or create one.
 */
export async function getOrCreateThread(senderId, recipientId, listingId) {
    const allThreads = db.threads.findAll();

    // Look for existing thread with same listing + same participants
    const existing = allThreads.find(t => {
        const parts = typeof t.participants === 'string' ? JSON.parse(t.participants || '[]') : (t.participants || []);
        return t.listing_id === listingId && parts.includes(senderId) && parts.includes(recipientId);
    });

    if (existing) return existing;

    // Create new thread
    return await db.threads.create({
        listing_id: listingId,
        participants: [senderId, recipientId],
        last_message_at: new Date().toISOString(),
        last_message_preview: '',
        [`unread_count_${recipientId}`]: 0,
        [`unread_count_${senderId}`]: 0,
        is_archived: false,
        blocked_by: null,
    });
}

// ── Message Sending ───────────────────────────────────────────

/**
 * Send a message in a thread. Returns { success, error, message, warning }.
 */
export function sendMessage(threadId, senderId, content, photoUrl = null) {
    // 1. Rate limit check
    const rateLimitResult = checkRateLimit(senderId);
    if (!rateLimitResult.allowed) {
        const msg = rateLimitResult.errorOverride || `Rate limit exceeded. Try again in ${rateLimitResult.resetIn} ${rateLimitResult.resetUnit || 'minutes'}.`;
        return { success: false, error: msg };
    }

    // 2. Safety check
    const hasPaymentLink = checkPaymentLinks(content);

    // 3. Content validation
    if (!content.trim() && !photoUrl) {
        return { success: false, error: 'Message cannot be empty.' };
    }

    if (content.length > 2000) {
        return { success: false, error: 'Message too long. Max 2000 characters.' };
    }

    // 4. Check if thread is blocked
    const thread = db.threads.findById(threadId);
    if (!thread) return { success: false, error: 'Thread not found.' };

    if (thread.blocked_by) {
        return { success: false, error: 'You cannot send messages in a blocked conversation.' };
    }

    // 5. Create message
    const message = db.messages.create({
        thread_id: threadId,
        sender_id: senderId,
        content: content.trim(),
        photo_url: photoUrl,
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString()
    });

    // 6. Update thread metadata
    const parts = typeof thread.participants === 'string' ? JSON.parse(thread.participants || '[]') : (thread.participants || []);
    const ouId = parts.find(id => id !== senderId);
    db.threads.update(threadId, {
        last_message_at: new Date().toISOString(),
        last_message_preview: content.trim().substring(0, 80),
        [`unread_count_${ouId}`]: (thread[`unread_count_${ouId}`] || 0) + 1,
    });

    // 7. Create notification for recipient
    const sender = db.users.findById(senderId);
    const senderName = sender?.display_name || 'Someone';
    db.notifications.create({
        user_id: ouId,
        type: 'new_message',
        title: 'New Message',
        description: `${senderName} sent you a message: "${content.trim().substring(0, 40)}${content.trim().length > 40 ? '...' : ''}"`,
        thread_id: threadId,
        sender_id: senderId
    }).catch(e => console.error('[MSG] Failed to create notification:', e));

    // 8. Increment rate limit counter
    incrementRateLimit(senderId);

    return {
        success: true,
        message,
        warning: hasPaymentLink ? 'payment_link_detected' : null,
    };
}

// ── Read Receipts ─────────────────────────────────────────────

/**
 * Mark all messages in a thread as read for the given user.
 */
export async function markThreadRead(threadId, userId) {
    const msgs = db.messages.find(m => m.thread_id === threadId && m.sender_id !== userId && !m.is_read);
    const now = new Date().toISOString();

    await Promise.all(msgs.map(m => {
        return db.messages.update(m.message_id, { is_read: true, read_at: now });
    }));

    // Zero the unread count on the thread
    await db.threads.update(threadId, { [`unread_count_${userId}`]: 0 });
}

// ── Thread Actions ────────────────────────────────────────────

export function archiveThread(threadId, userId) {
    db.threads.update(threadId, { is_archived: true, archived_by: userId });
}

export function unarchiveThread(threadId) {
    db.threads.update(threadId, { is_archived: false, archived_by: null });
}

export function blockUser(blockerId, blockedId, threadId) {
    // Record block on the thread
    db.threads.update(threadId, { blocked_by: blockerId, blocked_user: blockedId });

    // Also record in the blocking user's profile
    const bUser = db.users.findById(blockerId);
    const blocked = bUser?.blocked_users || [];
    if (!blocked.includes(blockedId)) {
        db.users.update(blockerId, { blocked_users: [...blocked, blockedId] });
    }
}

export function reportThread(threadId, reporterId, reason = 'inappropriate') {
    // We store reports in localStorage under a 'reports' key
    let rawDB = {};
    try {
        rawDB = JSON.parse(localStorage.getItem('rg_database') || '{}');
    } catch (e) {
        console.error('[MSG] Error parsing DB for report:', e);
    }
    if (!rawDB.reports) rawDB.reports = [];

    rawDB.reports.push({
        report_id: `rpt_${Date.now()}`,
        thread_id: threadId,
        reporter_id: reporterId,
        reason,
        status: 'pending',
        created_at: new Date().toISOString(),
    });

    localStorage.setItem('rg_database', JSON.stringify(rawDB));
    return true;
}

// ── Thread Queries ────────────────────────────────────────────

export function getThreadsForUser(userId, filter = 'all') {
    const allThreads = db.threads.find(t => {
        const parts = typeof t.participants === 'string' ? JSON.parse(t.participants || '[]') : (t.participants || []);
        return parts.includes(userId);
    });

    return allThreads
        .filter(t => {
            if (filter === 'unread') return (t[`unread_count_${userId}`] || 0) > 0;
            if (filter === 'archived') return t.is_archived;
            return !t.is_archived;
        })
        .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
}

export function getMessagesForThread(threadId) {
    return db.messages.find(m => m.thread_id === threadId)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export function getUnreadCountForThread(threadId, userId) {
    return db.messages.find(m => m.thread_id === threadId && m.sender_id !== userId && !m.is_read).length;
}

export function getTotalUnread(userId) {
    // 1. Get IDs of threads the user is a participant in
    const myThreads = db.threads.find(t => {
        const parts = typeof t.participants === 'string' ? JSON.parse(t.participants || '[]') : (t.participants || []);
        return parts.includes(userId);
    });

    const myActiveThreadIds = new Set(
        myThreads.filter(t => !t.is_archived).map(t => t.thread_id)
    );

    // 2. Count unread messages in those active threads
    const unreadMessages = db.messages.find(m => 
        m.sender_id !== userId && 
        !m.is_read && 
        myActiveThreadIds.has(m.thread_id)
    );
    return unreadMessages.length;
}

// ── Safety ───────────────────────────────────────────────────

export function checkPaymentLinks(content) {
    return PAYMENT_LINK_PATTERNS.some(pattern => pattern.test(content));
}

// ── Rate Limiting ─────────────────────────────────────────────

function checkRateLimit(userId) {
    const user = db.users.findById(userId);
    const isFree = !user || user.subscription_tier === 'free';
    
    // Check 1 month validity for Free tier
    if (isFree && user && user.created_at) {
        const createdDate = new Date(user.created_at);
        const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 3600 * 24);
        if (daysSinceCreation > 30) {
            return { allowed: false, errorOverride: 'Your 1-month Free trial has expired. Please upgrade to continue messaging.' };
        }
    }

    const maxLimit = isFree ? 5 : 5000;
    const windowMs = 24 * 3600 * 1000; // 1 day window for all

    const key = `rg_ratelimit_${userId}`;
    const now = Date.now();
    let data = { count: 0, windowStart: 0 };
    try {
        const raw = localStorage.getItem(key);
        if (raw) data = JSON.parse(raw);
    } catch (e) {
        console.error('[MSG] Rate limit parse error:', e);
    }

    // Reset if outside window
    if (now - data.windowStart > windowMs) {
        data = { count: 0, windowStart: now };
    }

    if (data.count >= maxLimit) {
        const resetIn = Math.ceil((data.windowStart + windowMs - now) / 60000); // minutes
        const resetHours = Math.ceil(resetIn / 60);
        return { allowed: false, resetIn: resetHours, resetUnit: 'hours', errorOverride: isFree ? `Free plan allows 5 messages/day. Try again in ${resetHours} hours or upgrade.` : 'Daily rate limit exceeded.' };
    }

    return { allowed: true };
}

function incrementRateLimit(userId) {
    const key = `rg_ratelimit_${userId}`;
    const now = Date.now();
    const windowMs = 24 * 3600 * 1000;
    let data = { count: 0, windowStart: 0 };
    try {
        const raw = localStorage.getItem(key);
        if (raw) data = JSON.parse(raw);
    } catch (e) {
        console.error('[MSG] Rate limit parse error:', e);
    }

    if (now - data.windowStart > windowMs) {
        data = { count: 1, windowStart: now };
    } else {
        data.count++;
    }

    localStorage.setItem(key, JSON.stringify(data));
}

// ── Polling ───────────────────────────────────────────────────

/**
 * Start polling for new messages. Calls onUpdate(newMessages) when new data arrives.
 */
export function startPolling(userId, activeThreadId, onUpdate) {
    if (_pollingInterval) stopPolling();

    _pollingInterval = setInterval(async () => {
        // Sync critical data from D1 before updating UI
        await syncMessagesAndThreads().catch(err => console.log('[POLL] Sync error:', err));

        const threads = getThreadsForUser(userId);
        const msgs = activeThreadId ? getMessagesForThread(activeThreadId) : [];
        const unread = getTotalUnread(userId);
        
        // Mobile notification check
        if (unread > 0) {
            const lastMsg = db.messages.findAll()
                .filter(m => m.sender_id !== userId && !m.is_read)
                .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
            
            if (lastMsg) {
                const sender = db.users.findById(lastMsg.sender_id);
                const senderName = sender?.display_name || 'New Message';
                sendBrowserNotification(senderName, lastMsg.content || 'Sent a message');
            }
        }

        onUpdate({ threads, messages: msgs, unread });
    }, POLL_INTERVAL);
}

export function stopPolling() {
    if (_pollingInterval) {
        clearInterval(_pollingInterval);
        _pollingInterval = null;
    }
}

// ── Browser Push Notifications ────────────────────────────────

export async function requestPushPermission() {
    if (!('Notification' in window)) return 'unsupported';

    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';

    const result = await Notification.requestPermission();
    return result;
}

const _notifiedMsgs = new Set();

export function sendBrowserNotification(title, body, icon = '/logo.png') {
    // Prevent double notification for same content in one session
    const key = `${title}:${body}`;
    if (_notifiedMsgs.has(key)) return;
    _notifiedMsgs.add(key);
    setTimeout(() => _notifiedMsgs.delete(key), 30000);

    if (Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon,
            badge: icon,
            tag: 'rg-message',
        });
    } else if (window.Capacitor) {
        // Fallback for native Capacitor if we had the plugin, 
        // but for now we just log for debugging
        console.log('[MOBILE NOTIF]', title, body);
    }
}

// ── Quick Replies ─────────────────────────────────────────────

export const QUICK_REPLIES = [
    'Is this still available?',
    'When can I schedule a visit?',
    'What is the lease duration?',
    'Are utilities included?',
    'Is it pet-friendly?',
];
