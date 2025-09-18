# Browser Configuration for Windows SSO

## Issue Resolution
The login popup appears because browsers need specific configuration to automatically use Windows credentials for authentication.

## Chrome Configuration

1. **Add to Trusted Sites**:
   - Open Chrome
   - Go to `chrome://settings/`
   - Search for "Security"
   - Click "Security and Privacy" → "Security"
   - Scroll down to "Advanced" → "Manage certificates"
   - OR use Group Policy/Registry:
     ```
     [HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome]
     "AuthServerWhitelist"="srv-hq-ai01,*.yourdomain.com"
     "AuthNegotiateDelegateWhitelist"="srv-hq-ai01,*.yourdomain.com"
     ```

2. **Command Line Method**:
   ```cmd
   chrome.exe --auth-server-whitelist="srv-hq-ai01" --auth-negotiate-delegate-whitelist="srv-hq-ai01"
   ```

## Edge Configuration

1. **Internet Options**:
   - Open Edge
   - Go to `edge://settings/`
   - Search for "Internet Options"
   - Click "Open Internet Options"
   - Go to "Security" tab
   - Select "Local intranet"
   - Click "Sites" → "Advanced"
   - Add: `http://srv-hq-ai01`
   - Ensure "Require server verification (https:) for all sites in this zone" is UNCHECKED

2. **Alternative - Registry**:
   ```reg
   [HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Internet Settings\ZoneMap\Domains\srv-hq-ai01]
   "http"=dword:00000001
   ```

## Firefox Configuration

1. Open Firefox
2. Type `about:config` in address bar
3. Set these preferences:
   - `network.negotiate-auth.trusted-uris` = `srv-hq-ai01`
   - `network.negotiate-auth.delegation-uris` = `srv-hq-ai01`
   - `network.automatic-ntlm-auth.trusted-uris` = `srv-hq-ai01`

## Group Policy (Domain-wide)

For domain administrators, configure via Group Policy:

1. **Computer Configuration** → **Administrative Templates** → **Google Chrome**:
   - `AuthServerWhitelist` = `srv-hq-ai01,*.yourdomain.com`
   - `AuthNegotiateDelegateWhitelist` = `srv-hq-ai01,*.yourdomain.com`

2. **Computer Configuration** → **Administrative Templates** → **Windows Components** → **Internet Explorer**:
   - Add `srv-hq-ai01` to Local Intranet zone

## Testing

1. Run the test script: `powershell -ExecutionPolicy Bypass .\test-sso.ps1`
2. Access the application: `http://srv-hq-ai01:5173`
3. Check browser developer tools for authentication errors

## Troubleshooting

- **Still getting popup**: Clear browser cache and restart browser
- **403 Forbidden**: Check Windows user permissions
- **CORS errors**: Verify server is running on correct port (5200)
- **Network errors**: Check Windows Firewall settings

## Quick Fix Commands

Run as Administrator:
```cmd
# Add to IE trusted sites via registry
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings\ZoneMap\Domains\srv-hq-ai01" /v http /t REG_DWORD /d 1 /f

# Restart services
.\restart-services.bat
```