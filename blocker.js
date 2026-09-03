// blocker.js - Save this file to your GitHub repo
(function() {
    'use strict';
    
    const BLOCKED = ['stats.senty.com.au', 'player.avplayer.com', 'avplayer.com'];
    
    // ===== 1. BLOCK FETCH =====
    const origFetch = window.fetch;
    window.fetch = function() {
        const url = arguments[0];
        const urlStr = typeof url === 'string' ? url : (url && url.url ? url.url : String(url));
        for (const b of BLOCKED) {
            if (urlStr.includes(b)) {
                console.log('[BLOCKED] fetch:', urlStr);
                return Promise.resolve(new Response('', { status: 204 }));
            }
        }
        return origFetch.apply(this, arguments);
    };
    
    // ===== 2. BLOCK XHR =====
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        const urlStr = String(url);
        for (const b of BLOCKED) {
            if (urlStr.includes(b)) {
                console.log('[BLOCKED] XHR:', urlStr);
                this._blocked = true;
                return origOpen.call(this, method, 'data:text/plain,blocked');
            }
        }
        this._blocked = false;
        return origOpen.apply(this, arguments);
    };
    
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
        if (this._blocked) {
            const self = this;
            setTimeout(() => {
                self.readyState = 4;
                self.status = 204;
                self.statusText = 'Blocked';
                if (self.onreadystatechange) self.onreadystatechange();
                if (self.onload) self.onload();
                if (self.onloadend) self.onloadend();
            }, 0);
            return;
        }
        return origSend.apply(this, arguments);
    };
    
    // ===== 3. BLOCK WINDOW.OPEN =====
    const origOpen = window.open;
    window.open = function(url, target, features) {
        if (typeof url === 'string') {
            for (const b of BLOCKED) {
                if (url.includes(b)) {
                    console.log('[BLOCKED] window.open:', url);
                    return null;
                }
            }
        }
        return origOpen.apply(this, arguments);
    };
    
    // ===== 4. BLOCK LOCATION CHANGES =====
    const origAssign = window.location.assign;
    window.location.assign = function(url) {
        for (const b of BLOCKED) {
            if (url.includes(b)) {
                console.log('[BLOCKED] location.assign:', url);
                return;
            }
        }
        return origAssign.call(this, url);
    };
    
    const origReplace = window.location.replace;
    window.location.replace = function(url) {
        for (const b of BLOCKED) {
            if (url.includes(b)) {
                console.log('[BLOCKED] location.replace:', url);
                return;
            }
        }
        return origReplace.call(this, url);
    };
    
    // ===== 5. BLOCK BEACON =====
    const origBeacon = navigator.sendBeacon;
    navigator.sendBeacon = function(url, data) {
        for (const b of BLOCKED) {
            if (url.includes(b)) {
                console.log('[BLOCKED] beacon:', url);
                return true;
            }
        }
        return origBeacon.apply(this, arguments);
    };
    
    // ===== 6. BLOCK WEBSOCKET =====
    const OrigWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
        for (const b of BLOCKED) {
            if (url.includes(b)) {
                console.log('[BLOCKED] WebSocket:', url);
                const fake = {};
                setTimeout(() => {
                    if (fake.onclose) fake.onclose({ code: 1000, reason: 'Blocked' });
                }, 0);
                return fake;
            }
        }
        return new OrigWebSocket(url, protocols);
    };
    
    // ===== 7. BLOCK CLICKS TO BLOCKED DOMAINS =====
    document.addEventListener('click', function(e) {
        let el = e.target;
        while (el && el !== document.body) {
            const tag = el.tagName ? el.tagName.toLowerCase() : '';
            const href = el.href || el.getAttribute('href') || '';
            const onclick = el.getAttribute('onclick') || '';
            const dataHref = el.getAttribute('data-href') || '';
            const dataUrl = el.getAttribute('data-url') || '';
            
            const allUrls = [href, onclick, dataHref, dataUrl].join(' ');
            
            for (const b of BLOCKED) {
                if (allUrls.includes(b)) {
                    console.log('[BLOCKED] Click intercepted:', allUrls);
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                }
            }
            
            // Remove invisible overlays
            if (tag === 'div' || tag === 'span' || tag === 'a') {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                const isFullPage = rect.width >= window.innerWidth * 0.8 && 
                                   rect.height >= window.innerHeight * 0.8;
                const isInvisible = parseFloat(style.opacity) === 0 || 
                                    style.visibility === 'hidden' ||
                                    style.display === 'none' ||
                                    style.pointerEvents === 'none' ||
                                    (style.backgroundColor && style.backgroundColor.includes('0, 0, 0, 0'));
                
                if (isFullPage && isInvisible && el !== document.documentElement) {
                    console.log('[BLOCKED] Removed invisible overlay:', el);
                    el.remove();
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                }
            }
            
            el = el.parentElement;
        }
    }, true);
    
    // ===== 8. BLOCK FORM SUBMISSIONS =====
    document.addEventListener('submit', function(e) {
        const action = e.target.action || e.target.getAttribute('action') || '';
        for (const b of BLOCKED) {
            if (action.includes(b)) {
                console.log('[BLOCKED] Form submit:', action);
                e.preventDefault();
                return false;
            }
        }
    }, true);
    
    // ===== 9. MUTATION OBSERVER =====
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType !== 1) return;
                
                const tag = node.tagName.toLowerCase();
                let url = null;
                
                if (tag === 'script' || tag === 'iframe' || tag === 'img' || 
                    tag === 'video' || tag === 'audio' || tag === 'source') {
                    url = node.src;
                } else if (tag === 'link') {
                    url = node.href;
                } else if (tag === 'a') {
                    url = node.href;
                }
                
                if (url) {
                    for (const b of BLOCKED) {
                        if (url.includes(b)) {
                            console.log('[BLOCKED] DOM injected:', tag, url);
                            node.remove();
                            return;
                        }
                    }
                }
                
                // Check for invisible overlays
                if (tag === 'div' || tag === 'span') {
                    const style = node.getAttribute('style') || '';
                    if ((style.includes('position:fixed') || style.includes('position: fixed')) &&
                        (style.includes('opacity:0') || style.includes('opacity: 0') || style.includes('transparent'))) {
                        console.log('[BLOCKED] Suspicious overlay removed');
                        node.remove();
                    }
                }
            });
        });
    });
    
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    
    // ===== 10. PERIODIC CLEANUP =====
    setInterval(function() {
        const allElements = document.querySelectorAll('*');
        allElements.forEach(function(el) {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            
            const isFullPage = rect.width >= window.innerWidth * 0.9 && 
                               rect.height >= window.innerHeight * 0.9;
            const isInvisible = parseFloat(style.opacity) === 0 || 
                                style.visibility === 'hidden' ||
                                style.display === 'none' ||
                                style.pointerEvents === 'none';
            
            if (isFullPage && isInvisible && 
                el.tagName !== 'BODY' && el.tagName !== 'HTML' && 
                el.tagName !== 'IFRAME') {
                console.log('[BLOCKED] Periodic cleanup removed overlay:', el);
                el.remove();
            }
        });
    }, 2000);
    
    console.log('[BLOCKER] All protection layers active');
})();