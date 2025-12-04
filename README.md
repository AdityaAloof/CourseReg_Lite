# CourseReg Lite

**A minimal course registration web application (MVP) for students**

A functional course registration web application built with Bootstrap 5 and vanilla JavaScript, allowing students to log in, select, and confirm their courses.
 
## Live Hosting

This project is ready to be hosted via GitHub Pages. the site will be accessible at:

-  URL: `https://adityaaloof.github.io/CourseReg_Lite/`


## Features

 **Authentication**
- Login with hardcoded test credentials
- Session management (clears on logout)
- Protected routes

 "Remember Me"
- When enabled, the app preserves the authenticated session on the device so users don’t need to re-enter credentials on subsequent visits. Passwords are never stored; only a time-bound, signed token or browser storage entry is used and validated. Avoid using “Remember Me” on shared/public devices. Logging out immediately clears stored session data.

 **Course Selection**
- Browse 10 predefined courses
- View course details (code, name, credits, description)
- Responsive card layout

 **Shopping Cart**
- Add/remove courses (maximum 5 courses)
- Real-time cart updates
- Credit total calculation
- Visual indicators for courses in cart

 **Registration Confirmation**
- Summary of selected courses
- Total credits display
- Student information


## How to Use

1. **Open `index.html`** in your web browser
2. **Login** with one of the test credentials above
3. **Browse courses** and click "Add to Cart" (max 5 courses)
4. **Review your cart** in the sidebar
5. **Click "Confirm Registration"** to see the confirmation page

### View the Hosted Site (after Pages is enabled)
- Visit `https://adityaaloof.github.io/CourseReg_Lite/` to use the app online.

## Operational Safeguards

### Automated Backups
- Run the PowerShell helper whenever you need a fresh snapshot of the site directory.

```powershell
pwsh -File scripts/backup.ps1
```

The script zips all runtime files (excluding `backups/`, `scripts/`, and `.git/`) into `backups/CourseRegLite-<timestamp>.zip`.

### Authentication Hardening
- Session inactivity watchers auto-log out users after 15 minutes of no activity.
- Login attempts are throttled (five failures trigger a five-minute lock). Messages surface remaining attempts to the user.
- Security events (lockouts, successes) are retained locally for quick inspection via `window.SecurityEvents.getRecentSecurityEvents()` in the console.

### Catalog Resilience
- Courses load from `assets/data/courses.json` with a 4-second timeout.
- Successful responses are cached for six hours; if the feed is unreachable the app serves the cached snapshot or a baked-in fallback list and surfaces a banner in `courses.html`.

### Feature Flags
- Rapid rollback switches live in `assets/js/featureFlags.js`.
- Toggle them at runtime via the browser console:

```javascript
FeatureFlags.set('dynamicCatalog', false);   // Serve embedded data only
FeatureFlags.set('strictAuthGuards', false); // Disable throttling and idle timeout
FeatureFlags.reset();                        // Restore defaults
```

## Technical Details

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Framework:** Bootstrap 5.3.3
- **Storage:** Browser SessionStorage (no backend)
 - **Hosting:** GitHub Pages (static site)
- **Design:** Brand colors (Blue: #0033A0, Green: #00A651)
- **Accessibility:** ARIA labels, keyboard navigation support

## File Structure

```
index.html               # Login page
courses.html             # Course selection page
confirmation.html        # Registration confirmation
assets/
	css/
		styles.css           # Custom styling
	data/
		courses.json         # Course seed data
	js/
		auth.js              # Authentication logic
		login.js             # Login page handlers
		cart.js              # Cart management
		catalogService.js    # Catalog loading + cache
		courses.js           # Course listing & cart UI
		featureFlags.js      # Runtime feature toggles
		register.js          # Registration flow helpers
scripts/
README.md
```

## Requirements Met

 FR-1: User sign-in with hardcoded credentials  
 FR-2: View 10 predefined courses  
 FR-3: Add to cart (max 5 courses)  
 FR-4: Edit cart (add/remove)  
 FR-5: Confirm registration page  
 FR-6: Display total credits  
 FR-7: Maximum course limit (5)  
 FR-8: Place registration validation  
 FR-9: Reset on logout  
 FR-10: Responsive Bootstrap layout  

## Notes

- All data is stored in browser session storage
- Cart and session clear on logout or browser close
- No backend server required - works with file:// protocol
- Fully responsive for desktop and mobile devices
 - For live hosting, use GitHub Pages as described above

