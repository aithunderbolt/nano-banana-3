# SSO Login Popup Troubleshooting Guide

## Current Status
✅ Server is running correctly
✅ Browser configuration is applied
✅ IE Trusted Sites configured
✅ Chrome Authentication configured

## If you're still seeing login popups:

### 1. Browser Restart (Most Important)
```cmd
# Run this to restart browser with proper SSO settings
restart-browser.bat
```

### 2. Clear Browser Cache
- **Chrome**: Ctrl+Shift+Delete → Clear browsing data
- **Edge**: Ctrl+Shift+Delete → Clear browsing data
- **Firefox**: Ctrl+Shift+Delete → Clear recent history

### 3. Verify URL
Make sure you're accessing: `http://srv-hq-ai01:5173`
NOT: `http://localhost:5173` or `http://127.0.0.1:5173`

### 4. Manual Browser Configuration

#### Chrome Manual Setup:
1. Close Chrome completely
2. Start Chrome with: 
   ```cmd
   chrome.exe --auth-server-whitelist="srv-hq-ai01" --auth-negotiate-delegate-whitelist="srv-hq-ai01"
   ```

#### Edge Manual Setup:
1. Open Edge
2. Go to Settings → System → Open your computer's proxy settings
3. Click "LAN settings"
4. Advanced → Add `srv-hq-ai01` to Local intranet sites

#### Firefox Manual Setup:
1. Type `about:config` in address bar
2. Set these preferences:
   - `network.negotiate-auth.trusted-uris` = `srv-hq-ai01`
   - `network.automatic-ntlm-auth.trusted-uris` = `srv-hq-ai01`

### 5. Windows Authentication Check
Verify you're logged into the domain:
```cmd
whoami
# Should show: ASHARQIA\yourusername
```

### 6. Test Authentication
```cmd
# Test if server recognizes your credentials
curl -u : --negotiate http://srv-hq-ai01:5200/api/me
```

### 7. Group Policy Override
If in a corporate environment, Group Policy might override settings.
Contact your IT administrator to add:
- `srv-hq-ai01` to Local Intranet zone
- Chrome AuthServerWhitelist policy

## Quick Fix Commands

Run these in order:
```cmd
# 1. Apply browser configuration (as Administrator)
fix-browser-auth.bat

# 2. Restart browser with SSO
restart-browser.bat

# 3. Test configuration
test-config.bat
```

## Still Having Issues?

1. **Check Windows Event Logs**: Look for authentication errors
2. **Verify Domain Trust**: Ensure server trusts your domain
3. **Check Firewall**: Windows Firewall might block authentication
4. **Try Different Browser**: Test with Edge, Chrome, and Firefox
5. **Contact IT**: Domain authentication policies might need adjustment

## Expected Behavior
When working correctly:
- No login popup appears
- User info shows in top-right corner of the app
- Browser automatically uses Windows credentials
- Access is seamless within the domain

## Debug Information
- Server: `http://srv-hq-ai01:5200`
- Client: `http://srv-hq-ai01:5173`
- Health Check: `http://srv-hq-ai01:5200/health`
- User Info: `http://srv-hq-ai01:5200/api/me`