/* main.js - all JavaScript for Hush. No backend: data lives in localStorage.
   Keys used:  hush_users (array of accounts), hush_current (logged in username),
               hush_posts (array of posts)
   NOTE: passwords are hashed with SHA-256 before saving, never stored as plain text. */

const root = document.body.dataset.root || "";   // "" for index.html, "../" for pages/
const load = (k, d) => JSON.parse(localStorage.getItem(k)) || d;
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const $ = (id) => document.getElementById(id);

// turn a password into a SHA-256 hex string
async function hash(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// returns the logged-in user object or undefined
function currentUser() {
  const name = localStorage.getItem("hush_current");
  return load("hush_users", []).find(u => u.username === name);
}

// pages that need a login send visitors to the login page
function requireLogin() {
  if (!currentUser()) location.href = root + "pages/login.html";
}

// builds the navigation bar at the top (changes if logged in or not)
function buildNav() {
  const loggedIn = currentUser();
  const links = loggedIn
    ? [["pages/feed.html", "Feed"], ["pages/profile.html", "Profile"], ["pages/privacy.html", "Privacy"], ["pages/about.html", "About"]]
    : [["pages/about.html", "About"], ["pages/login.html", "Log in"], ["pages/signup.html", "Sign up"]];
  let html = `<a class="brand" href="${root}index.html">Hush</a>`;
  links.forEach(l => html += `<a href="${root}${l[0]}">${l[1]}</a>`);
  if (loggedIn) html += `<a href="#" id="logout">Log out</a>`;
  $("nav").innerHTML = html;
  if ($("logout")) $("logout").onclick = () => {
    localStorage.removeItem("hush_current");
    location.href = root + "index.html";
  };
}

// ---------- SIGNUP ----------
async function handleSignup(e) {
  e.preventDefault();
  const username = $("username").value.trim().toLowerCase();
  const password = $("password").value;
  const users = load("hush_users", []);
  if (!/^[a-z0-9_]{3,15}$/.test(username)) return $("error").textContent = "Username: 3-15 letters, numbers or _.";
  if (password.length < 6) return $("error").textContent = "Password must be at least 6 characters.";
  if (password !== $("confirm").value) return $("error").textContent = "Passwords do not match.";
  if (users.find(u => u.username === username)) return $("error").textContent = "That username is taken.";
  users.push({ username, password: await hash(password), bio: "", hideProfile: false });
  save("hush_users", users);
  localStorage.setItem("hush_current", username);
  location.href = "feed.html";
}

// ---------- LOGIN ----------
async function handleLogin(e) {
  e.preventDefault();
  const username = $("username").value.trim().toLowerCase();
  const user = load("hush_users", []).find(u => u.username === username);
  if (!user || user.password !== await hash($("password").value))
    return $("error").textContent = "Wrong username or password.";
  localStorage.setItem("hush_current", username);
  location.href = "feed.html";
}

// ---------- FEED ----------
function showPosts() {
  const me = currentUser();
  const posts = load("hush_posts", []);
  $("posts").innerHTML = posts.length ? "" : "<p>No posts yet. Be the first!</p>";
  posts.slice().reverse().forEach(p => {
    const div = document.createElement("div");
    div.className = "box";
    const who = document.createElement("strong");
    who.textContent = "@" + p.author;               // textContent so scripts can't be injected
    const text = document.createElement("p");
    text.textContent = p.text;
    const when = document.createElement("span");
    when.className = "meta";
    when.textContent = new Date(p.time).toLocaleString();
    div.append(who, text, when);
    if (p.author === me.username) {                  // only the owner can delete
      const del = document.createElement("button");
      del.className = "small"; del.textContent = "Delete";
      del.onclick = () => { save("hush_posts", load("hush_posts", []).filter(x => x.id !== p.id)); showPosts(); };
      div.append(del);
    }
    $("posts").append(div);
  });
}
function handlePost(e) {
  e.preventDefault();
  const text = $("text").value.trim();
  if (!text) return;
  const posts = load("hush_posts", []);
  posts.push({ id: Date.now(), author: currentUser().username, text, time: Date.now() });
  save("hush_posts", posts);
  $("text").value = "";
  showPosts();
}

// ---------- PROFILE ----------
function showProfile() {
  const me = currentUser();
  $("name").textContent = "@" + me.username;
  $("bio").value = me.bio;
  $("count").textContent = load("hush_posts", []).filter(p => p.author === me.username).length;
}
function saveBio(e) {
  e.preventDefault();
  const users = load("hush_users", []);
  users.find(u => u.username === currentUser().username).bio = $("bio").value.trim();
  save("hush_users", users);
  $("msg").textContent = "Saved.";
}

// ---------- PRIVACY ----------
function showPrivacy() {
  $("hide").checked = currentUser().hideProfile;
}
function savePrivacy(e) {
  e.preventDefault();
  const users = load("hush_users", []);
  users.find(u => u.username === currentUser().username).hideProfile = $("hide").checked;
  save("hush_users", users);
  $("msg").textContent = "Saved.";
}
function deleteAccount() {
  if (!confirm("Delete your account and all your posts? This cannot be undone.")) return;
  const name = currentUser().username;
  save("hush_users", load("hush_users", []).filter(u => u.username !== name));
  save("hush_posts", load("hush_posts", []).filter(p => p.author !== name));
  localStorage.removeItem("hush_current");
  location.href = root + "index.html";
}

// ---------- start-up: wire up whichever page we are on ----------
buildNav();
const page = document.body.dataset.page;
if (page === "signup") $("form").onsubmit = handleSignup;
if (page === "login") $("form").onsubmit = handleLogin;
if (page === "feed") { requireLogin(); $("form").onsubmit = handlePost; showPosts(); }
if (page === "profile") { requireLogin(); $("form").onsubmit = saveBio; showProfile(); }
if (page === "privacy") { requireLogin(); $("form").onsubmit = savePrivacy; $("delete").onclick = deleteAccount; showPrivacy(); }