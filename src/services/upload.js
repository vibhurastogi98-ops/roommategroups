import { db } from './db.js';
import { getCurrentUser } from './auth.js';

/**
 * Upload service to handle file uploads to the server.
 */

const API_URL = window.location.hostname === 'localhost' 
    ? '/api' 
    : 'https://roommategroups.vibhurastogi98.workers.dev';

export async function uploadImage(fileOrBlob, filename = 'image.webp') {
    const formData = new FormData();
    formData.append('image', fileOrBlob, filename);
    
    try {
        const endpoint = `${API_URL}/upload`;
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
