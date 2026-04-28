import { db } from './db.js';

export function getCategories() {
    try {
        const cats = db.categories.findAll();
        if (cats && cats.length > 0) {
            return ['All', ...cats.map(c => c.name)];
        }
    } catch (e) {
        console.warn('Error reading categories from db.categories', e);
    }
    return ['All', 'City Guides', 'Roommate Tips', 'Market Reports', 'Moving Guides', 'Student Housing'];
}

// Keep CATEGORIES as a backwards-compatible alias (computed once at import time)
export const CATEGORIES = getCategories();

export function getBlogPosts() {
    try {
        const posts = db.posts.findAll();
        if (posts && posts.length > 0) {
            return posts;
        }
    } catch (e) {
        console.warn('Error reading blogs from db.posts', e);
    }
    return [];
}

export function getPostBySlug(slug) {
    return getBlogPosts().find(post => post.slug === slug);
}

export function getRelatedPosts(category, currentId) {
    return getBlogPosts().filter(post => post.category === category && String(post.post_id || post.id) !== String(currentId)).slice(0, 3);
}

/**
 * Simple Markdown-to-HTML parser to support structured blog content.
 * Enhanced with "Smart Detection" to automatically structure plain text.
 */
export function parseMarkdown(text) {
    if (!text) return '';
    
    // 1. If it already looks like fully formatted HTML, return as is
    if (text.trim().startsWith('<') && (text.includes('<p>') || text.includes('<h2>'))) {
        return text;
    }

    // 2. Pre-process standard markdown and common symbols
    let processed = text
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        // Handle various bullet point styles: *, -, •, +
        .replace(/^\s*[\*\-\•\+] (.*$)/gim, '<li>$1</li>')
        // Handle numbered lists: 1. , 2. , etc.
        .replace(/^\s*[0-9]+\. (.*$)/gim, '<li class="num-list">$1</li>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 3. Smart Structure Detection
    const lines = processed.split('\n');
    let finalLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) {
            finalLines.push('');
            continue;
        }

        // Already tagged? skip
        if (line.startsWith('<h') || line.startsWith('<li') || line.startsWith('<ul') || line.startsWith('<p')) {
            finalLines.push(line);
            continue;
        }

        // HEURISTIC: Does this line look like a heading?
        // Strip bold markers for detection
        const cleanLine = line.replace(/\*\*/g, '').trim();
        const words = cleanLine.split(/\s+/);
        
        const isTitleCase = words.length > 0 && words.every(w => 
            w.length === 0 || 
            /^[A-Z0-9\W]/.test(w) || 
            ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'with', 'in', 'of'].includes(w.toLowerCase())
        );
        const isShort = cleanLine.length > 3 && cleanLine.length < 90;
        const noEndPunct = !/[.\?\!]$/.test(cleanLine);
        const prevEmpty = (i === 0 || lines[i-1].trim() === '');
        const isFirstLine = (i === 0);
        
        // If it's bolded, short, and on its own line, it's ALMOST CERTAINLY a heading
        const isBoldedLine = line.startsWith('**') && line.endsWith('**');
        
        const isLikelyHeading = (isShort && noEndPunct && (isTitleCase || isBoldedLine)) && (prevEmpty || isFirstLine);
        
        if (isLikelyHeading) {
            if (cleanLine.length < 55) {
                finalLines.push(`<h2>${line}</h2>`);
            } else {
                finalLines.push(`<h3>${line}</h3>`);
            }
        } else {
            finalLines.push(line);
        }
    }
    
    let html = finalLines.join('\n');

    // 4. Group List Items into <ul> or <ol>
    html = html.replace(/(<li class="num-list">(?:.|\n)*?<\/li>)/gim, '<ol>$1</ol>')
               .replace(/(<li>(?:.|\n)*?<\/li>)/gim, '<ul>$1</ul>')
               .replace(/<\/ul>\s*<ul>/gim, '')
               .replace(/<\/ol>\s*<ol>/gim, '');
    
    // Cleanup internal class
    html = html.replace(/ class="num-list"/g, '');

    // 5. Paragraph Wrapping
    // Split by double newlines to create paragraphs
    const blocks = html.split(/\n\n+/);
    return blocks.map(block => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        
        // If it's already a structural tag, don't wrap it
        if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('<blockquote')) {
            return trimmed;
        }
        
        // HEURISTIC: Auto-bold "Keyword: Description" or "Step 1: ..." patterns
        let content = trimmed;
        if (content.includes(':') && content.indexOf(':') < 45 && !content.startsWith('<')) {
             content = content.replace(/^(.*?):/, '<strong>$1:</strong>');
        }
        
        // Convert internal single newlines to <br> for poem-like spacing
        return `<p>${content.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
}
