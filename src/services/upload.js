import { db } from './db.js';
import { getCurrentUser } from './auth.js';

/**
 * Upload service to handle file uploads to the server.
 */

import { API_URL } from './config.js';


const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadImage(fileOrBlob, filename = 'image.webp') {
    if (fileOrBlob.type && !ALLOWED_MIME_TYPES.has(fileOrBlob.type)) {
        throw new Error(`Invalid file type: ${fileOrBlob.type}. Only images are allowed.`);
    }
    if (fileOrBlob.size > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${(fileOrBlob.size / 1024 / 1024).toFixed(1)}MB. Maximum is 5MB.`);
    }

    const formData = new FormData();
    formData.append('image', fileOrBlob, filename);

    try {
        const endpoint = `${API_URL}/r2/upload`;
        const res = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });
        
        if (!res.ok) {
            throw new Error(`Upload failed with status ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
            // Record the upload in our local database
            try {
                const user = getCurrentUser();
                db.images.create({
                    url: data.url,
                    filename: data.filename || filename,
                    size: fileOrBlob.size,
                    type: fileOrBlob.type,
                    uploader_id: user?.user_id || 'anonymous',
                    source: 'server'
                });
            } catch (dbErr) {
                console.warn('[UPLOAD SERVICE] Failed to record in DB:', dbErr);
            }
            
            return data.url;
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (err) {
        console.error('[UPLOAD SERVICE ERROR]', err);
        throw err;
    }
}
