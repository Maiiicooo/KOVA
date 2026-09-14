# AGENTS.md — KOVA

Keep KOVA simple.

Do not create new scripts, config files, abstractions or folders unless absolutely necessary.

For normal feature work:
- edit the existing source files
- do not edit www manually
- do not modify Android native files unless the task truly requires native changes

Always prefer the simplest working solution.

## 1. Project identity

KOVA is a map-first discovery app for finding genuinely good outdoor, chill, water, nature and urban spots.

The main product value is NOT having the largest number of locations.
The main value is having high-quality spots that users would actually want to visit.

Think:
- hidden places
- viewpoints
- chill spots
- swimming/water locations
- unusual urban locations
- nature locations
- micro-adventure destinations

KOVA should feel curated, fast, minimal and premium.

Do not turn KOVA into a generic social network or an overloaded travel app.


## 2. Product priorities

When making technical or UX decisions, prioritize in this order:

1. Map performance and smoothness
2. Quality and usability of spots
3. Extremely simple UX
4. Fast startup
5. Reliable Firebase data handling
6. Good mobile/native feel
7. Visual polish
8. New features

Do not sacrifice map performance for unnecessary features.


## 3. Current architecture

KOVA is primarily a web application packaged as an Android app using Capacitor.

Core technologies currently include:

- HTML / CSS / JavaScript or the existing frontend stack in this repository
- Firebase
- Firestore
- MapTiler
- Capacitor
- Android project generated/maintained through Capacitor

Always inspect the repository before assuming the exact implementation.

Do not rewrite KOVA into React, Vue, Flutter, React Native, Kotlin, Swift or another framework unless the user explicitly asks for a migration.

Prefer improving the current architecture over replacing it.


## 4. Capacitor / Android

KOVA uses Capacitor for Android.

IMPORTANT:

The Android application/package ID is:

app.kova.spot

NEVER change this package ID unless explicitly instructed.

Do not rename it to:
- kova.spot
- com.kova.app
- or anything else.

Treat changing the application ID as a potentially breaking migration.

When working with Capacitor:

- keep all Capacitor packages on compatible major versions
- prefer official @capacitor/* plugins
- do not install plugins that duplicate existing functionality
- inspect package.json before installing anything
- run capacitor sync after relevant web/plugin changes
- preserve the existing Android project
- do not regenerate Android blindly
- do not delete native changes without checking them first

Typical workflow after relevant changes:

1. build the web app using the repository's existing build command
2. npx cap sync android
3. verify Android build
4. fix warnings/errors caused by the change
5. verify existing KOVA functionality still works

Target modern Android devices.

A Samsung XCover 7 is one of the real devices used for testing KOVA.


## 5. Map

The map is the heart of KOVA.

KOVA uses MapTiler.

Do NOT replace MapTiler with:
- Google Maps
- Mapbox
- Leaflet
- a native maps SDK

unless explicitly requested.

Before changing map code, inspect:

- map initialization
- style/theme loading
- marker loading
- Firestore spot loading
- map events
- location handling
- loading screen / progress bar
- mobile gestures

Map interactions must remain smooth.

Avoid unnecessarily recreating markers, listeners or map instances.

Avoid duplicate event listeners.

Avoid unnecessary Firestore reads.

When changing map themes/styles, ensure the map returns to a completely usable state and all KOVA spots are visible again.

Never leave the loading screen or loading bar stuck after a map/style reload.


## 6. Map themes

KOVA has/has experimented with multiple MapTiler themes.

Do not assume all historical themes are still active.

Inspect the current settings implementation before adding/removing themes.

Preserve the user's selected theme when appropriate.

Theme switching should feel intentional and polished rather than like the entire website broke and restarted.


## 7. Spot categories

The core KOVA spot categories are currently:

- Water
- Nature
- Urban

The established color logic is approximately:

- Water = blue
- Nature = green
- Urban = brown

Do not create additional categories without a clear product reason or explicit instruction.

When modifying category logic, search the entire project for category-dependent code first.

This may include:

- marker colors
- filters
- add-spot forms
- Firestore data
- legends
- icons
- descriptions
- validation


## 8. Firestore

Firestore is important production data.

Be conservative when changing Firestore code.

Never:

- rename collections casually
- mass-delete documents
- overwrite production data
- change document schemas without considering existing documents
- assume every document already has newly introduced fields

Code should tolerate older spot documents where reasonable.

Important collections may include:

- spots
- pending_spots

Verify current collection names in the code before making changes.


## 9. User submitted spots

KOVA has a moderation concept for user-submitted spots.

New public/user submissions should not automatically bypass moderation unless that behavior is explicitly requested.

Be careful when modifying:

- pending_spots
- approval scripts
- Firestore security rules
- admin privileges
- client-side spot creation

Never solve a Firebase permission error by simply making the database broadly writable.


## 10. Firebase security

Treat Firebase security rules as security-sensitive code.

Before changing Firestore rules:

1. read the complete rules file
2. understand existing auth/admin logic
3. understand which fields normal users may modify
4. preserve least-privilege access
5. ensure the change does not allow arbitrary spot modification

Never expose admin functionality to normal clients just to make a feature easier to implement.

Do not hardcode new admin credentials or secrets.


## 11. Firebase configuration

Firebase client configuration may be present in frontend code.

Do not confuse normal Firebase client configuration with actual server secrets.

Never expose:

- service account private keys
- private backend credentials
- signing secrets
- private API tokens

Do not commit secret files.


## 12. App Check

KOVA has used Firebase App Check.

Do not disable App Check permanently to bypass a development problem.

If App Check causes an issue, diagnose whether it is:

- development environment configuration
- Android configuration
- domain configuration
- reCAPTCHA configuration
- token/config problem

Fix the actual issue where possible.


## 13. Location

Location is important to KOVA.

Location features must gracefully handle:

- permission granted
- permission denied
- permission permanently denied
- GPS/location services disabled
- timeout
- position unavailable

Never let location failure prevent users from browsing the map.

The app should remain useful without location access.


## 14. Android permissions

Request the minimum permissions necessary.

Do not add permissions "just in case".

Examples that may legitimately be required:

- INTERNET
- ACCESS_NETWORK_STATE
- ACCESS_COARSE_LOCATION
- ACCESS_FINE_LOCATION

Camera/media permissions should only be added when the implemented functionality actually needs them.

Prefer modern Android APIs and photo pickers over broad storage permissions.


## 15. Offline architecture

Offline functionality is a possible/future KOVA feature.

Do not build a large offline architecture unless explicitly requested.

However, new code should avoid making future offline support unnecessarily difficult.

Network failures should not crash the app.


## 16. Native feel

Although KOVA uses web technology + Capacitor, the Android app should feel like a real mobile application.

Pay attention to:

- Android back button
- status bar
- navigation bar
- safe areas
- keyboard
- splash screen
- touch targets
- haptics where appropriate
- native sharing
- location permissions
- external links
- loading states

Avoid interactions that obviously feel like a desktop website inside a WebView.


## 17. Android back button

Be especially careful with the Android back button.

Expected priority is generally:

1. close an open modal/panel
2. close an open spot detail
3. go back within KOVA navigation if appropriate
4. only exit the application when there is nothing meaningful to go back to

Never make Back randomly exit KOVA.


## 18. Performance

Performance matters heavily.

Before adding dependencies, ask whether the functionality can reasonably be implemented with the existing stack.

Avoid:

- huge libraries for tiny features
- repeated Firebase reads
- duplicate map initialization
- duplicate event listeners
- excessive DOM rebuilding
- unnecessarily loading all assets at startup
- blocking startup on non-essential data

Prefer lazy work when possible.


## 19. Startup

KOVA startup should feel fast and deliberate.

Avoid:

- white flashes
- unnecessary blank screens
- multiple loading screens
- loading indicators that never complete
- showing a half-initialized map

If startup logic changes, verify the complete startup sequence.


## 20. Design language

KOVA should feel:

- minimal
- dark
- premium
- outdoors-oriented
- modern
- slightly raw
- intentional

Avoid generic startup/SaaS design.

Avoid:

- excessive gradients
- glassmorphism everywhere
- oversized cards
- unnecessary rounded boxes
- excessive explanatory text
- cluttered menus

The map and the locations should remain visually dominant.


## 21. Mobile-first

KOVA is mobile-first.

Always consider the mobile layout first.

Desktop support is useful but should not degrade mobile UX.

Test changes at realistic mobile widths.

Do not rely on hover for essential functionality.


## 22. Existing design

Preserve KOVA's existing visual identity unless explicitly asked to redesign something.

Before changing:

- logo position
- typography
- map overlay
- marker style
- hamburger menu
- spot cards
- loading screen
- theme selector

inspect the current implementation and maintain consistency.


## 23. Copy

Keep KOVA copy concise.

Prefer short, natural product language over corporate wording.

Do not fill screens with explanations when an icon, short sentence or obvious interaction is enough.

Do not rewrite existing copy throughout the project unless relevant to the requested task.


## 24. Spot descriptions

Spot descriptions should sound human and useful.

They should explain why the place is worth visiting without sounding like tourism-board marketing.

Avoid fake claims about locations.

Never invent factual characteristics of a real-world spot when they are not known.


## 25. Images

Do not replace or delete existing spot images unless explicitly necessary.

Preserve image references when changing spot data structures.

Optimize image loading when possible without visibly damaging image quality.


## 26. Changes to existing code

Before making a significant change:

1. inspect the relevant files
2. trace the current implementation
3. identify dependencies
4. make the smallest coherent change
5. test the affected flow

Do not immediately rewrite a file because the existing implementation looks imperfect.

Working KOVA functionality is more valuable than architectural purity.


## 27. Refactoring

Do not perform unrelated refactors while implementing a feature or fixing a bug.

If you discover technical debt:

- mention it
- only fix it when necessary for the requested task
- keep behavior stable

Large refactors require explicit justification.


## 28. Dependencies

Before installing a dependency:

- verify that KOVA does not already have equivalent functionality
- check compatibility with the current stack
- consider bundle size
- prefer actively maintained packages
- prefer official Capacitor packages for native functionality

Do not blindly install the newest version of every package.

Especially for Capacitor, compatible major versions matter.


## 29. package.json

Never replace package.json wholesale.

Preserve existing:

- dependencies
- scripts
- metadata
- development tooling

Add or update only what is required.


## 30. Existing files

Do not delete files simply because they appear unused.

Search references first.

This is particularly important for:

- assets
- Firebase scripts
- spot images
- Android files
- configuration
- admin scripts


## 31. Git safety

Never run destructive Git operations unless explicitly requested.

Do NOT automatically:

- git reset --hard
- force push
- delete branches
- discard local changes
- rewrite existing commits

Before operations that may affect remote history, explain the consequence.

Normal status/diff operations are encouraged.


## 32. Preserve user work

The repository may contain work that has not yet been pushed or committed.

Never assume uncommitted changes are disposable.

Before making broad changes, inspect:

git status

Do not overwrite unrelated user modifications.


## 33. Testing

After meaningful frontend changes, test/build the project using its existing scripts.

After Capacitor/Android changes, where possible verify:

- web build succeeds
- capacitor sync succeeds
- Android debug build succeeds

If something cannot be tested in the current environment, clearly state that instead of pretending it was verified.


## 34. Bug fixing

When debugging:

Do not treat the visible symptom as proof of the root cause.

Trace the flow first.

For example, if spots do not appear after changing a map style, investigate:

- style load lifecycle
- map load events
- markers/sources
- Firestore data
- listener cleanup
- loading state

Do not add random delays as the first solution.


## 35. Logging

Temporary logs are fine while debugging.

Remove excessive debug logging before completing the task unless those logs are intentionally useful in production.

Never log sensitive data.


## 36. Feature implementation

When asked to implement a feature:

1. understand how it fits KOVA
2. inspect the existing implementation
3. reuse existing patterns where good
4. implement it
5. test it
6. check mobile behavior
7. check for regressions
8. summarize exactly what changed

Do not stop after writing code when verification is possible.


## 37. User preference

The owner of KOVA frequently builds through iterative "vibe coding".

Therefore:

- make concrete changes rather than only explaining theory
- keep explanations concise
- explain important architectural decisions
- do not over-engineer
- when something is dangerous or likely to create technical debt, say so
- favor working, polished implementations


## 38. Do not assume historical features still exist

KOVA evolves quickly.

Features may have been added, removed or redesigned.

Examples include:

- authentication
- profiles
- rewards
- subscriptions
- map themes
- offline features

Always inspect the current repository before assuming an old KOVA feature still exists.


## 39. Product direction

The long-term goal is for KOVA to become a serious location-discovery product rather than a small demo project.

Code should therefore be maintainable enough to grow, but avoid enterprise-level abstraction before it is needed.

Use this principle:

simple now, extendable later.


## 40. Definition of done

A task is not finished merely because code was written.

A KOVA change is done when, where applicable:

- the requested behavior works
- existing core behavior still works
- mobile layout remains correct
- map remains smooth
- Firestore behavior remains safe
- Android build remains healthy
- no obvious console/build errors were introduced
- unnecessary dependencies were not added
- the implementation is understandable
- the user receives a short summary of the changes
