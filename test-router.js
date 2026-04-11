const routes = {
    '/cities/:slug': 'h1',
    '/cities/:country/:slug': 'h2'
};
const hash = '/cities/us/austin';

let handler = null;
let params = {};

for (const path in routes) {
    if (path.includes(':')) {
        const pathParts = path.split('/');
        const hashParts = hash.split('/');

        if (pathParts.length === hashParts.length) {
            const match = pathParts.every((part, i) => part.startsWith(':') || part === hashParts[i]);
            if (match) {
                handler = routes[path];
                pathParts.forEach((part, i) => {
                    if (part.startsWith(':')) {
                        params[part.slice(1)] = hashParts[i];
                    }
                });
                break;
            }
        }
    }
}
console.log(handler, params);
