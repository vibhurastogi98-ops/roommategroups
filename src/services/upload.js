/**
 * Upload service to handle file uploads to the server.
 */

export async function uploadImage(fileOrBlob, filename = 'image.webp') {
    const formData = new FormData();
    formData.append('image', fileOrBlob, filename);
    
    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });
        
        if (!res.ok) {
            throw new Error(`Upload failed with status ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
            return data.url;
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (err) {
        console.error('[UPLOAD SERVICE ERROR]', err);
        throw err;
    }
}
