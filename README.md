# Hush - privacy-focused social media prototype

Midterm project (Web Development). Built with HTML, CSS and vanilla JavaScript only. No backend, database or API.

## Pages
- index.html - landing page
- pages/signup.html - create an account
- pages/login.html - log in
- pages/feed.html - write, view and delete posts (login required)
- pages/profile.html - username, post count, edit bio (login required)
- pages/privacy.html - privacy option and delete account (login required)
- pages/about.html - about us

## Structure
index.html
pages/ (all other pages)
src/css/style.css (shared styles)
src/js/main.js (shared script, each page sets data-page)
assets/img/ (images, none used yet)

## How it works
- Data is saved in localStorage: hush_users, hush_posts, hush_current.
- Passwords are hashed with SHA-256 before saving.
- Posts use textContent so typed HTML cannot run (prevents XSS).
- Pages that need a login redirect to the login page.

## Running
Open index.html in a browser.

## Limitations
Data is stored per browser, so users on different devices cannot see each other.
Unsalted SHA-256 is not enough for a real app.