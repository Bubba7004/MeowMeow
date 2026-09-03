// blocker.js - Save to GitHub, serve via jsDelivr
(function() {
    'use strict';
    
    // Block Plausible/Senty analytics completely
    const BLOCKED_ORIGINS = ['stats.senty.com.au', 'senty.com.au'];
    
    // ===== 1. NEUTRALIZE PLAUSIBLE GLOBAL =====
    // This prevents the script from ever functioning
    window.plausible = function() {
        console.log('[BLOCKED] Plausible event blocked:', arguments);
        // Still call callback if provided (so UI doesn't break)
        var args = Array.prototype.slice.call(arguments);
        var lastArg = args[args.length - 1];
        if (lastArg && typeof lastArg.callback === 'function') {
            setTimeout(lastArg.callback, 0);
        }
        return true;
    };
    window.plausible.q = [];
    
    // ===== 2. BLOCK FETCH TO SENTY =====
    const origFetch = window.fetch;
    window.fetch = function() {
        var url = arguments[0];
        var urlStr = typeof url === 'string' ? url : (url && url.url ? url.url : String(url));
        for (var i = 0; i < BLOCKED_ORIGINS.length; i++) {
            if (urlStr.includes(BLOCKED_ORIGINS[i])) {
                console.log('[BLOCKED] fetch:', urlStr);
                return Promise.resolve(new Response('', { status: 204 }));
            }
        }
        return origFetch.apply(this, arguments);
    };
    
    // ===== 3. BLOCK XHR TO SENTY =====
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        var urlStr = String(url);
        for (var i = 0; i < BLOCKED_ORIGINS.length; i++) {
            if (urlStr.includes(BLOCKED_ORIGINS[i])) {
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
            var self = this;
            setTimeout(function() {
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
    
    // ===== 4. BLOCK THE PLAUSIBLE SCRIPT FROM LOADING =====
    // Override createElement to block script tags with senty src
    const origCreateElement = document.createElement;
    document.createElement = function(tagName) {
        var el = origCreateElement.call(document, tagName);
        if (tagName.toLowerCase() === 'script') {
            var origSetAttribute = el.setAttribute;
            el.setAttribute = function(name, value) {
                if (name === 'src' && value) {
                    for (var i = 0; i < BLOCKED_ORIGINS.length; i++) {
                        if (value.includes(BLOCKED_ORIGINS[i])) {
                            console.log('[BLOCKED] Script src blocked:', value);
                            // Don't set the src, but return normally so page doesn't break
                            return;
                        }
                    }
                }
                return origSetAttribute.call(this, name, value);
            };
            
            // Also intercept direct src property setting
            var srcDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
            if (srcDescriptor && srcDescriptor.set) {
                Object.defineProperty(el, 'src', {
                    set: function(value) {
                        for (var i = 0; i < BLOCKED_ORIGINS.length; i++) {
                            if (value && value.includes(BLOCKED_ORIGINS[i])) {
                                console.log('[BLOCKED] Script src property blocked:', value);
                                return;
                            }
                        }
                        srcDescriptor.set.call(this, value);
                    },
                    get: function() {
                        return srcDescriptor.get.call(this);
                    }
                });
            }
        }
        return el;
    };
    
    // ===== 5. REMOVE EXISTING PLAUSIBLE SCRIPTS =====
    function removePlausibleScripts() {
        var scripts = document.querySelectorAll('script[src*="senty.com.au"], script[src*="plausible"]');
        scripts.forEach(function(script) {
            console.log('[BLOCKED] Removed existing Plausible script:', script.src);
            script.remove();
        });
    }
    removePlausibleScripts();
    
    // ===== 6. MUTATION OBSERVER TO CATCH DYNAMICALLY ADDED PLAUSIBLE SCRIPTS =====
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType !== 1) return;
                
                // Block script tags
                if (node.tagName && node.tagName.toLowerCase() === 'script') {
                    var src = node.src || node.getAttribute('src') || '';
                    for (var i = 0; i < BLOCKED_ORIGINS.length; i++) {
                        if (src.includes(BLOCKED_ORIGINS[i])) {
                            console.log('[BLOCKED] Dynamic Plausible script removed:', src);
                            node.remove();
                            return;
                        }
                    }
                }
            });
        });
    });
    
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    
    // ===== 7. BLOCK BEACON API TO SENTY =====
    const origBeacon = navigator.sendBeacon;
    navigator.sendBeacon = function(url, data) {
        for (var i = 0; i < BLOCKED_ORIGINS.length; i++) {
            if (url.includes(BLOCKED_ORIGINS[i])) {
                console.log('[BLOCKED] beacon:', url);
                return true;
            }
        }
        return origBeacon.apply(this, arguments);
    };
    
    // ===== 8. BLOCK OUTBOUND LINK TRACKING =====
    // Plausible adds click listeners that redirect through their tracker
    // We remove those specific listeners by cloning and replacing elements
    function cleanPlausibleListeners() {
        var links = document.querySelectorAll('a[href]');
        links.forEach(function(link) {
            // Check if Plausible has attached its click handler
            // We can't directly remove it, but we can clone the element
            // which strips all event listeners
            var clone = link.cloneNode(true);
            link.parentNode.replaceChild(clone, link);
        });
    }
    
    // Run after page load and periodically
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cleanPlausibleListeners);
    } else {
        cleanPlausibleListeners();
    }
    setInterval(cleanPlausibleListeners, 3000);
    
    console.log('[BLOCKER] Plausible/Senty analytics neutralized');
})();
