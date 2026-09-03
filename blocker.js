<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Opening Link...</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f4f4f9;
            color: #333;
        }
        .container {
            text-align: center;
            padding: 2rem;
            border-radius: 8px;
            background: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 400px;
        }
        .warning {
            display: none;
            color: #d9534f;
            margin-top: 1rem;
            font-weight: bold;
        }
        button {
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
        }
        button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>

<div class="container">
    <h2>Redirecting...</h2>
    <p>Opening target page in an isolated tab.</p>
    
    <div id="popup-warning" class="warning">
        ⚠️ Pop-up blocked! Please allow pop-ups for this site to continue, then click the button below.
    </div>
    
    <button id="retry-btn" onclick="openInBlank()">Open Manually</button>
</div>

<script>
    const targetUrl = "https://alchemy.echolearning.cfd/";
    const targetIcon = "https://cdn-icons-png.flaticon.com/128/5968/5968523.png";
    
    // REPLACE WITH YOUR ACTUAL JSDELIVR URL
    // Format: https://cdn.jsdelivr.net/gh/USERNAME/REPO@main/blocker.js
    const BLOCKER_SCRIPT_URL = "https://cdn.jsdelivr.net/gh/YOUR_USERNAME/YOUR_REPO@main/blocker.js";

    function openInBlank() {
        const win = window.open('about:blank', '_blank');
        
        if (!win || win.closed || typeof win.closed === 'undefined') {
            document.getElementById('popup-warning').style.display = 'block';
            return false;
        }

        document.getElementById('popup-warning').style.display = 'none';

        win.document.title = "Google Drive";
        win.document.body.style.margin = "0";
        win.document.body.style.height = "100vh";
        
        if (targetIcon) {
            const favicon = win.document.createElement('link');
            favicon.rel = 'icon';
            favicon.type = 'image/x-icon';
            favicon.href = targetIcon;
            win.document.head.appendChild(favicon);
        }

        // Inject blocker script into the new window
        const blockerScript = win.document.createElement('script');
        blockerScript.src = BLOCKER_SCRIPT_URL;
        win.document.head.appendChild(blockerScript);

        // Create iframe
        const iframe = win.document.createElement('iframe');
        iframe.src = targetUrl;
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        iframe.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups";

        win.document.body.appendChild(iframe);
        
        // Try to inject blocker into iframe (will fail cross-origin, but worth trying)
        iframe.onload = function() {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const iframeBlocker = iframeDoc.createElement('script');
                iframeBlocker.src = BLOCKER_SCRIPT_URL;
                iframeDoc.head.appendChild(iframeBlocker);
                console.log('[BLOCKER] Injected into iframe');
            } catch(e) {
                console.log('[BLOCKER] Cannot inject into iframe (cross-origin) - using parent-level interception');
            }
        };

        return true;
    }

    window.onload = function() {
        openInBlank();
    };
</script>

</body>
</html>
