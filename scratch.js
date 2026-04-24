const routes = {
  '/cities/:slug': {},
  '/listing/:id': {},
  '/fb-groups/:slug': {}
};

const cleanPath = '/listing/list_123';
let route = routes[cleanPath];
let params = {};

if (!route) {
    for (const routePath in routes) {
        if (routePath.includes(':')) {
            const pathParts = routePath.split('/').filter(p => p !== '');
            const targetParts = cleanPath.split('/').filter(p => p !== '');
            
            console.log('Trying pattern:', routePath, 'parts:', pathParts, 'target:', targetParts);
            
            if (pathParts.length === targetParts.length) {
                const match = pathParts.every((part, i) => part.startsWith(':') || part === targetParts[i]);
                console.log('Match:', match);
                if (match) {
                    route = routes[routePath];
                    console.log('Matched Route:', routePath);
                    break;
                }
            }
        }
    }
}
