export function showToast(message, type = 'info') {
    const stack = ensureToastStack();
    const toast = document.createElement('div');
    toast.className = `rg-global-toast rg-global-toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.innerHTML = `
        <i class="fa-solid ${getToastIcon(type)}" aria-hidden="true"></i>
        <span>${escapeHtml(message || 'Something happened.')}</span>
        <button type="button" class="rg-global-toast-close" aria-label="Dismiss notification">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
    `;
    stack.appendChild(toast);

    const close = () => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 220);
    };

    toast.querySelector('.rg-global-toast-close')?.addEventListener('click', close);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(close, 3000);
}

export function installGlobalErrorBoundary() {
    if (window.__rgGlobalErrorBoundaryInstalled) return;
    window.__rgGlobalErrorBoundaryInstalled = true;

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        showToast('Something went wrong. Please try again.', 'error');
    });

    window.addEventListener('error', (event) => {
        console.error('Unhandled runtime error:', event.error || event.message);
        showToast('Something went wrong. Please refresh and try again.', 'error');
    });
}

function ensureToastStack() {
    let stack = document.getElementById('rg-global-toast-stack');
    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'rg-global-toast-stack';
        document.body.appendChild(stack);
    }
    return stack;
}

function getToastIcon(type) {
    if (type === 'success') return 'fa-circle-check';
    if (type === 'error') return 'fa-circle-exclamation';
    if (type === 'warning') return 'fa-triangle-exclamation';
    return 'fa-circle-info';
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
