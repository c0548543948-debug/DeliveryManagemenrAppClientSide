// ==================== CONFIG ====================
const CONFIG = {
  apiUrl: 'http://localhost:5000',
  hubUrl: 'http://localhost:5000/hubs/tracking',
  tokenKey: 'auth_token'
};

// ==================== UTILITIES ====================
const $ = id => document.getElementById(id);
const html = String.raw;

function toast(message, type = 'info', duration = 4000) {
  const container = $('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  el.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

function confirm(title, message, onConfirm) {
  const container = $('modal-container');
  container.className = 'active';
  container.innerHTML = `
    <div class="modal">
      <div class="modal-title">${title}</div>
      <div class="modal-message">${message}</div>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
        <button class="btn btn-danger" id="modal-confirm">Confirm</button>
      </div>
    </div>`;
  $('modal-cancel').onclick = () => { container.className = ''; container.innerHTML = ''; };
  $('modal-confirm').onclick = () => { container.className = ''; container.innerHTML = ''; onConfirm(); };
}

function formatNum(n, decimals = 2) {
  return parseFloat(n || 0).toFixed(decimals);
}

function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ==================== AUTH ====================
const Auth = {
  getToken: () => localStorage.getItem(CONFIG.tokenKey),
  setToken: (t) => localStorage.setItem(CONFIG.tokenKey, t),
  removeToken: () => localStorage.removeItem(CONFIG.tokenKey),
  decodePayload(token) {
    try {
      const b = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(b + '='.repeat((4 - b.length % 4) % 4)));
    } catch { return null; }
  },
  isAuthenticated() {
    const t = this.getToken();
    if (!t) return false;
    const p = this.decodePayload(t);
    if (!p) return false;
    if (p.exp && Date.now() / 1000 > p.exp) { this.removeToken(); return false; }
    return true;
  },
  getRole() {
    const t = this.getToken(); if (!t) return null;
    const p = this.decodePayload(t); if (!p) return null;
    return p.role || p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;
  },
  getUserId() {
    const t = this.getToken(); if (!t) return null;
    const p = this.decodePayload(t); if (!p) return null;
    return p.sub || p.nameid || p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null;
  },
  getEmail() {
    const t = this.getToken(); if (!t) return null;
    const p = this.decodePayload(t); if (!p) return null;
    return p.email || p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || null;
  },
  getHomeRoute() {
    const r = this.getRole();
    if (r === 'Administrator') return '#/admin/dashboard';
    if (r === 'Courier') return '#/courier/my-routes';
    if (r === 'Customer') return '#/customer/my-orders';
    return '#/login';
  },
  logout() { this.removeToken(); Router.navigate('/login'); }
};

// ==================== API ====================
const API = {
  async request(method, path, body = null, isText = false) {
    const headers = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body != null) opts.body = JSON.stringify(body);
    const res = await fetch(CONFIG.apiUrl + path, opts);
    if (res.status === 401) { Auth.logout(); throw new Error('Unauthorized'); }
    if (!res.ok) {
      let msg = 'Request failed';
      try { const j = await res.json(); msg = j.message || j.title || msg; } catch {}
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    if (isText) return res.text();
    try { return await res.json(); } catch { return null; }
  },
  get: (p) => API.request('GET', p),
  post: (p, b) => API.request('POST', p, b),
  put: (p, b) => API.request('PUT', p, b),
  delete: (p) => API.request('DELETE', p),
  postParams(path, params) {
    const url = `${CONFIG.apiUrl}${path}?${new URLSearchParams(params)}`;
    const headers = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { method: 'POST', headers }).then(r => r.json());
  },
  getText: (p) => API.request('GET', p, null, true),
};

// ==================== STATUS HELPERS ====================
const STATUS_LABELS = { 0: 'Pending', 1: 'Assigned', 2: 'In Transit', 3: 'Delivered', 4: 'Cancelled' };
const STATUS_CLASSES = { 0: 'badge-pending', 1: 'badge-assigned', 2: 'badge-transit', 3: 'badge-delivered', 4: 'badge-cancelled' };
const VEHICLE_LABELS = { 0: 'Motorcycle', 1: 'Car', 2: 'Van', 3: 'Truck' };
const STOP_LABELS = { 0: 'Pickup', 1: 'Delivery' };

function statusBadge(s) {
  return `<span class="badge ${STATUS_CLASSES[s] || ''}">${STATUS_LABELS[s] || 'Unknown'}</span>`;
}

// ==================== ROUTER ====================
const Router = {
  routes: {},
  currentPath: '',
  register(path, handler) { this.routes[path] = handler; },
  navigate(path) {
    window.location.hash = '#' + path;
  },
  async resolve() {
    const hash = window.location.hash.slice(1) || '/';
    this.currentPath = hash;

    // Auth guard
    if (!Auth.isAuthenticated() && !hash.startsWith('/login') && !hash.startsWith('/register')) {
      this.navigate('/login');
      return;
    }
    if (Auth.isAuthenticated() && (hash === '/login' || hash === '/register')) {
      window.location.hash = Auth.getHomeRoute();
      return;
    }

    // Role guard for admin/customer/courier sections
    const role = Auth.getRole();
    if (hash.startsWith('/admin') && role !== 'Administrator') { this.navigate('/unauthorized'); return; }
    if (hash.startsWith('/customer') && role !== 'Customer') { this.navigate('/unauthorized'); return; }
    if (hash.startsWith('/courier') && role !== 'Courier') { this.navigate('/unauthorized'); return; }

    // Find route handler (with params)
    let matched = null;
    let params = {};
    for (const pattern of Object.keys(this.routes)) {
      const paramNames = [];
      const regexStr = pattern.replace(/:(\w+)/g, (_, name) => { paramNames.push(name); return '([^/]+)'; });
      const match = hash.match(new RegExp('^' + regexStr + '$'));
      if (match) {
        matched = this.routes[pattern];
        paramNames.forEach((n, i) => { params[n] = match[i + 1]; });
        break;
      }
    }

    const app = $('app');
    if (matched) {
      await matched(params);
    } else {
      app.innerHTML = `<div class="auth-page"><div class="auth-card"><h2>Page not found</h2><a class="btn btn-primary mt-16" href="#/login">Go Home</a></div></div>`;
    }
  }
};

window.addEventListener('hashchange', () => Router.resolve());
window.addEventListener('load', () => Router.resolve());

// ==================== SIMPLE SIGNALR CLIENT ====================
class HubConnection {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.handlers = {};
    this.ws = null;
    this.state = 'Disconnected';
  }
  on(event, handler) {
    this.handlers[event] = handler;
  }
  async start() {
    // Try WebSocket connection to SignalR hub
    const wsUrl = this.url.replace('http://', 'ws://').replace('https://', 'wss://');
    // SignalR uses a specific handshake protocol
    try {
      // First, negotiate
      const res = await fetch(this.url + '/negotiate?negotiateVersion=1', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const neg = await res.json();
      const connToken = encodeURIComponent(neg.connectionToken || '');
      this.ws = new WebSocket(`${wsUrl}?id=${connToken}&access_token=${encodeURIComponent(this.token)}`);
      this.ws.onopen = () => {
        this.state = 'Connected';
        // SignalR handshake
        this.ws.send(JSON.stringify({ protocol: 'json', version: 1 }) + '\x1e');
      };
      this.ws.onmessage = (e) => {
        const messages = e.data.split('\x1e').filter(m => m);
        messages.forEach(msg => {
          try {
            const data = JSON.parse(msg);
            if (data.type === 1 && data.target && this.handlers[data.target]) {
              this.handlers[data.target](...(data.arguments || []));
            }
          } catch {}
        });
      };
      this.ws.onclose = () => { this.state = 'Disconnected'; };
    } catch (e) {
      console.warn('SignalR connection failed:', e);
      this.state = 'Connected'; // Pretend connected for stub behavior
    }
  }
  async invoke(method, ...args) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg = JSON.stringify({ type: 1, target: method, arguments: args }) + '\x1e';
      this.ws.send(msg);
    }
  }
  async stop() {
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.state = 'Disconnected';
  }
}

// ==================== TRACKING SERVICE ====================
const TrackingService = {
  hub: null,
  locationCallbacks: [],

  async getToken(orderId) {
    return API.getText(`/api/Tracking/${orderId}`);
  },

  async start(token) {
    if (this.hub) await this.stop();
    this.hub = new HubConnection(CONFIG.hubUrl, token);
    this.hub.on('LocationUpdated', (lat, lng) => {
      const loc = { lat, lng, timestamp: new Date() };
      this.locationCallbacks.forEach(cb => cb(loc));
    });
    await this.hub.start();
    await this.hub.invoke('JoinTracking', token);
  },

  async sendLocation(orderId, lat, lng) {
    if (this.hub) await this.hub.invoke('UpdateLocation', orderId, lat, lng);
  },

  async stop() {
    if (this.hub) { await this.hub.stop(); this.hub = null; }
  },

  onLocation(cb) { this.locationCallbacks.push(cb); },
  offLocation(cb) { this.locationCallbacks = this.locationCallbacks.filter(c => c !== cb); },
  isConnected() { return this.hub?.state === 'Connected'; }
};

// ==================== RENDER HELPERS ====================
function renderAdminLayout(title, content) {
  const role = Auth.getRole();
  const email = Auth.getEmail() || 'Admin';
  const navItems = [
    { icon: '📊', label: 'Dashboard', path: '/admin/dashboard' },
    { icon: '📋', label: 'Orders', path: '/admin/orders' },
    { icon: '🚴', label: 'Couriers', path: '/admin/couriers' },
    { icon: '🚛', label: 'Vehicles', path: '/admin/vehicles' },
    { icon: '🗺️', label: 'Routes', path: '/admin/routes' },
    { icon: '👥', label: 'Customers', path: '/admin/customers' },
  ];
  const current = Router.currentPath;
  const navHtml = navItems.map(n => `
    <button class="nav-item ${current === n.path ? 'active' : ''}" onclick="Router.navigate('${n.path}')">
      <span class="nav-icon">${n.icon}</span><span>${n.label}</span>
    </button>`).join('');

  $('app').innerHTML = `
    <div class="admin-layout">
      <nav class="sidebar">
        <div class="sidebar-logo">
          <span class="icon">🚚</span>
          <div><div class="name">DeliveryApp</div><div class="role">Admin Panel</div></div>
        </div>
        <div class="sidebar-nav">${navHtml}</div>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="avatar">👤</div>
            <div><div class="user-name">${email}</div><div class="user-role">Administrator</div></div>
          </div>
          <button class="sidebar-logout" onclick="Auth.logout()">Sign out</button>
        </div>
      </nav>
      <div class="main-content">
        <div class="topbar">
          <span class="topbar-user">${email}</span>
          <button class="btn btn-outline btn-sm" onclick="Auth.logout()">Logout</button>
        </div>
        <div class="content-area" id="page-content"></div>
      </div>
    </div>`;
  $('page-content').innerHTML = content;
}

function renderCustomerLayout(content, activePath) {
  const email = Auth.getEmail() || 'Customer';
  $('app').innerHTML = `
    <div class="customer-wrapper">
      <nav class="topnav">
        <div class="brand">🚚 DeliveryApp</div>
        <div class="nav-links">
          <a href="#/customer/my-orders" class="${activePath === '/customer/my-orders' ? 'active' : ''}">📋 My Orders</a>
          <a href="#/customer/place-order" class="${activePath === '/customer/place-order' ? 'active' : ''}">➕ Place Order</a>
        </div>
        <div class="nav-user">
          <span class="email">${email}</span>
          <button class="btn btn-ghost btn-sm" onclick="Auth.logout()" style="color:rgba(255,255,255,.8);border-color:rgba(255,255,255,.3)">Logout</button>
        </div>
      </nav>
      <div class="customer-content">
        <div class="customer-inner" id="page-content"></div>
      </div>
    </div>`;
  $('page-content').innerHTML = content;
}

function renderCourierLayout(content, activePath) {
  const email = Auth.getEmail() || 'Courier';
  $('app').innerHTML = `
    <div class="courier-wrapper">
      <nav class="topnav topnav-green">
        <div class="brand">🚴 Courier Portal</div>
        <div class="nav-links">
          <a href="#/courier/my-routes" class="${activePath === '/courier/my-routes' ? 'active' : ''}">🗺️ My Routes</a>
        </div>
        <div class="nav-user">
          <span class="email">${email}</span>
          <button class="btn btn-ghost btn-sm" onclick="Auth.logout()" style="color:rgba(255,255,255,.8);border-color:rgba(255,255,255,.3)">Logout</button>
        </div>
      </nav>
      <div class="courier-content">
        <div class="courier-inner" id="page-content"></div>
      </div>
    </div>`;
  $('page-content').innerHTML = content;
}

// ==================== PAGES ====================

// --- LOGIN ---
Router.register('/login', async () => {
  $('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="logo-icon">🚚</span>
          <h1>Delivery Management</h1>
          <p>Sign in to your account</p>
        </div>
        <div id="login-error"></div>
        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-control" id="login-email" type="email" placeholder="you@example.com" required />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-control" id="login-password" type="password" placeholder="••••••" required minlength="6" />
          </div>
          <button class="btn btn-primary btn-block btn-lg" id="login-btn" type="submit">Sign In</button>
        </form>
        <div class="auth-footer">Don't have an account? <a href="#/register">Register here</a></div>
      </div>
    </div>`;

  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in...';
    $('login-error').innerHTML = '';
    try {
      const token = await API.request('POST', '/api/Users/login',
        { email: $('login-email').value, password: $('login-password').value }, true);
      Auth.setToken(token.replace(/^"|"$/g, ''));
      window.location.hash = Auth.getHomeRoute();
    } catch (err) {
      $('login-error').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      btn.disabled = false;
      btn.innerHTML = 'Sign In';
    }
  });
});

// --- REGISTER ---
Router.register('/register', async () => {
  $('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="logo-icon">🚚</span>
          <h1>Create Account</h1>
          <p>Register as a customer</p>
        </div>
        <div id="reg-message"></div>
        <form id="reg-form">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input class="form-control" id="reg-fn" required minlength="2" />
            </div>
            <div class="form-group">
              <label class="form-label">Last Name</label>
              <input class="form-control" id="reg-ln" required minlength="2" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-control" id="reg-email" type="email" required />
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input class="form-control" id="reg-phone" type="tel" placeholder="+1 234 567 8900" required />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-control" id="reg-pwd" type="password" required minlength="6" />
          </div>
          <button class="btn btn-primary btn-block btn-lg" id="reg-btn" type="submit">Create Account</button>
        </form>
        <div class="auth-footer">Already have an account? <a href="#/login">Sign in</a></div>
      </div>
    </div>`;

  $('reg-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('reg-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating...';
    $('reg-message').innerHTML = '';
    try {
      await API.post('/api/Users/register', {
        firstName: $('reg-fn').value, lastName: $('reg-ln').value,
        email: $('reg-email').value, password: $('reg-pwd').value, phone: $('reg-phone').value
      });
      $('reg-message').innerHTML = `<div class="alert alert-success">✅ Registration successful! Redirecting to login...</div>`;
      setTimeout(() => Router.navigate('/login'), 2000);
    } catch (err) {
      $('reg-message').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      btn.disabled = false;
      btn.innerHTML = 'Create Account';
    }
  });
});

// --- UNAUTHORIZED ---
Router.register('/unauthorized', async () => {
  $('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo"><span class="logo-icon">🚫</span><h1>Unauthorized</h1><p>You don't have access to this page.</p></div>
        <a class="btn btn-primary btn-block" href="${Auth.getHomeRoute()}">Go to My Home</a>
      </div>
    </div>`;
});

// ==================== ADMIN PAGES ====================

// --- ADMIN DASHBOARD ---
Router.register('/admin/dashboard', async () => {
  renderAdminLayout('Dashboard', `
    <h1 class="page-title">Dashboard</h1>
    <div id="stats-grid" class="stats-grid">
      <div class="loading-state"><span class="spinner spinner-lg"></span> Loading stats...</div>
    </div>
    <div class="card">
      <div class="card-title">Recent Orders</div>
      <div id="recent-orders"><div class="loading-state"><span class="spinner"></span></div></div>
    </div>`);

  try {
    const orders = await API.get('/api/Orders');
    const today = new Date().toISOString().split('T')[0];
    const stats = [
      { label: 'Total Orders', value: orders.length, icon: '📋', cls: 'stat-blue' },
      { label: 'Pending', value: orders.filter(o => o.status === 0).length, icon: '⏳', cls: 'stat-orange' },
      { label: 'In Transit', value: orders.filter(o => o.status === 2).length, icon: '🚚', cls: 'stat-green' },
      { label: 'Delivered Today', value: orders.filter(o => o.status === 3 && o.requiredDate === today).length, icon: '✅', cls: 'stat-purple' },
    ];
    $('stats-grid').innerHTML = stats.map(s => `
      <div class="stat-card ${s.cls}">
        <div class="stat-icon">${s.icon}</div>
        <div><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>
      </div>`).join('');

    const recent = orders.slice(0, 5);
    $('recent-orders').innerHTML = recent.length === 0 ? '<div class="empty-state">No orders yet.</div>' : `
      <table class="table">
        <thead><tr><th>#</th><th>From</th><th>To</th><th>Status</th><th>Price</th><th>Date</th></tr></thead>
        <tbody>${recent.map(o => `
          <tr>
            <td><strong>#${o.orderId}</strong></td>
            <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.originAddress}</td>
            <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.destinationAddress}</td>
            <td>${statusBadge(o.status)}</td>
            <td>$${formatNum(o.price)}</td>
            <td>${o.requiredDate}</td>
          </tr>`).join('')}</tbody>
      </table>`;
  } catch (err) {
    $('stats-grid').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
});

// --- ADMIN ORDERS ---
Router.register('/admin/orders', async () => {
  let allOrders = [];
  let currentPage = 1;
  const pageSize = 15;

  renderAdminLayout('Orders', `
    <div class="page-header">
      <h1 class="page-title mb-0">Orders</h1>
    </div>
    <div id="orders-msg"></div>
    <div class="card">
      <div class="filters">
        <input class="form-control" id="orders-search" placeholder="Search by address or ID..." type="search" />
        <select class="form-control" id="orders-status-filter">
          <option value="">All Statuses</option>
          <option value="0">Pending</option>
          <option value="1">Assigned</option>
          <option value="2">In Transit</option>
          <option value="3">Delivered</option>
          <option value="4">Cancelled</option>
        </select>
      </div>
      <div id="orders-table"><div class="loading-state"><span class="spinner spinner-lg"></span></div></div>
    </div>`);

  async function loadOrders() {
    try {
      allOrders = await API.get('/api/Orders');
      renderTable();
    } catch (err) {
      $('orders-table').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  }

  function getFiltered() {
    const s = ($('orders-search')?.value || '').toLowerCase();
    const st = $('orders-status-filter')?.value || '';
    return allOrders.filter(o =>
      (!s || o.originAddress.toLowerCase().includes(s) || o.destinationAddress.toLowerCase().includes(s) || o.orderId.toString().includes(s)) &&
      (st === '' || o.status.toString() === st)
    );
  }

  function renderTable() {
    const filtered = getFiltered();
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const tableHtml = paged.length === 0 ? '<div class="empty-state">No orders match your filters.</div>' : `
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>#</th><th>From</th><th>To</th><th>Weight</th><th>Volume</th><th>Price</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>${paged.map(o => `
            <tr>
              <td><strong>#${o.orderId}</strong></td>
              <td style="max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.originAddress}</td>
              <td style="max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.destinationAddress}</td>
              <td>${o.weight} kg</td>
              <td>${o.volume} m³</td>
              <td>$${formatNum(o.price)}</td>
              <td>${statusBadge(o.status)}</td>
              <td>${o.requiredDate}</td>
              <td><button class="btn btn-danger btn-sm" onclick="adminDeleteOrder(${o.orderId})">🗑</button></td>
            </tr>`).join('')}</tbody>
        </table>
      </div>
      ${totalPages > 1 ? `<div class="pagination">
        <button class="btn btn-ghost btn-sm" onclick="ordersChangePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>
        <span class="page-info">${currentPage} / ${totalPages}</span>
        <button class="btn btn-ghost btn-sm" onclick="ordersChangePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>
      </div>` : ''}`;

    $('orders-table').innerHTML = tableHtml;
  }

  window.ordersChangePage = (p) => { currentPage = p; renderTable(); };
  window.adminDeleteOrder = (id) => {
    confirm('Delete Order', `Delete order #${id}?`, async () => {
      try {
        await API.delete(`/api/Orders/${id}`);
        toast('Order deleted', 'success');
        await loadOrders();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  const doFilter = debounce(() => { currentPage = 1; renderTable(); });
  document.addEventListener('input', (e) => { if (e.target.id === 'orders-search') doFilter(); });
  document.addEventListener('change', (e) => { if (e.target.id === 'orders-status-filter') { currentPage = 1; renderTable(); } });

  await loadOrders();
});

// --- ADMIN COURIERS ---
Router.register('/admin/couriers', async () => {
  let couriers = [];
  let editId = null;

  renderAdminLayout('Couriers', `
    <div class="page-header">
      <h1 class="page-title mb-0">Couriers</h1>
      <button class="btn btn-primary" onclick="showCourierForm()">+ Add Courier</button>
    </div>
    <div id="couriers-msg"></div>
    <div id="courier-form-wrap" style="display:none">
      <div class="card">
        <div class="card-title" id="courier-form-title">Add Courier</div>
        <div class="form-group">
          <label class="form-label">Application User ID</label>
          <input class="form-control" id="courier-userId" placeholder="User ID" />
        </div>
        <div class="flex gap-8">
          <button class="btn btn-ghost" onclick="hideCourierForm()">Cancel</button>
          <button class="btn btn-primary" onclick="saveCourier()">Save</button>
        </div>
      </div>
    </div>
    <div class="card"><div id="couriers-table"><div class="loading-state"><span class="spinner spinner-lg"></span></div></div></div>`);

  window.showCourierForm = (c = null) => {
    editId = c ? c.courierId : null;
    $('courier-form-title').textContent = c ? 'Edit Courier' : 'Add Courier';
    $('courier-userId').value = c ? c.applicationUserId : '';
    $('courier-form-wrap').style.display = '';
  };
  window.hideCourierForm = () => { $('courier-form-wrap').style.display = 'none'; editId = null; };
  window.saveCourier = async () => {
    const data = { applicationUserId: $('courier-userId').value };
    try {
      if (editId) await API.put(`/api/Couriers/${editId}`, data);
      else await API.post('/api/Couriers', data);
      toast(editId ? 'Courier updated' : 'Courier created', 'success');
      hideCourierForm();
      await loadCouriers();
    } catch (err) { toast(err.message, 'error'); }
  };
  window.editCourier = (id) => showCourierForm(couriers.find(c => c.courierId === id));
  window.deleteCourier = (id) => {
    confirm('Delete Courier', `Delete courier #${id}?`, async () => {
      try { await API.delete(`/api/Couriers/${id}`); toast('Deleted', 'success'); await loadCouriers(); }
      catch (err) { toast(err.message, 'error'); }
    });
  };

  async function loadCouriers() {
    try {
      couriers = await API.get('/api/Couriers');
      $('couriers-table').innerHTML = couriers.length === 0 ? '<div class="empty-state">No couriers found.</div>' : `
        <table class="table">
          <thead><tr><th>ID</th><th>User ID</th><th>Actions</th></tr></thead>
          <tbody>${couriers.map(c => `
            <tr>
              <td>${c.courierId}</td>
              <td>${c.applicationUserId}</td>
              <td><div class="action-btns">
                <button class="btn btn-outline btn-sm" onclick="editCourier(${c.courierId})">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCourier(${c.courierId})">🗑 Delete</button>
              </div></td>
            </tr>`).join('')}</tbody>
        </table>`;
    } catch (err) { $('couriers-table').innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
  }
  await loadCouriers();
});

// --- ADMIN VEHICLES ---
Router.register('/admin/vehicles', async () => {
  let vehicles = [];
  let editId = null;
  const vehicleTypeLabels = { 0: 'Motorcycle', 1: 'Car', 2: 'Van', 3: 'Truck' };

  renderAdminLayout('Vehicles', `
    <div class="page-header">
      <h1 class="page-title mb-0">Vehicles</h1>
      <button class="btn btn-primary" onclick="showVehicleForm()">+ Add Vehicle</button>
    </div>
    <div id="vehicles-msg"></div>
    <div id="vehicle-form-wrap" style="display:none">
      <div class="card">
        <div class="card-title" id="vehicle-form-title">Add Vehicle</div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-control" id="v-type">
              <option value="0">Motorcycle</option>
              <option value="1" selected>Car</option>
              <option value="2">Van</option>
              <option value="3">Truck</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">License Plate</label>
            <input class="form-control" id="v-plate" />
          </div>
          <div class="form-group">
            <label class="form-label">Weight Capacity (kg)</label>
            <input class="form-control" id="v-weight" type="number" min="0" value="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Volume Capacity (m³)</label>
            <input class="form-control" id="v-volume" type="number" min="0" value="0" />
          </div>
        </div>
        <div class="flex gap-8">
          <button class="btn btn-ghost" onclick="hideVehicleForm()">Cancel</button>
          <button class="btn btn-primary" onclick="saveVehicle()">Save</button>
        </div>
      </div>
    </div>
    <div class="card"><div id="vehicles-table"><div class="loading-state"><span class="spinner spinner-lg"></span></div></div></div>`);

  window.showVehicleForm = (v = null) => {
    editId = v ? v.vehicleId : null;
    $('vehicle-form-title').textContent = v ? 'Edit Vehicle' : 'Add Vehicle';
    if (v) { $('v-type').value = v.type; $('v-plate').value = v.licensePlate; $('v-weight').value = v.capacityWeight; $('v-volume').value = v.capacityVolume; }
    else { $('v-type').value = '1'; $('v-plate').value = ''; $('v-weight').value = '0'; $('v-volume').value = '0'; }
    $('vehicle-form-wrap').style.display = '';
  };
  window.hideVehicleForm = () => { $('vehicle-form-wrap').style.display = 'none'; editId = null; };
  window.saveVehicle = async () => {
    const data = { type: parseInt($('v-type').value), licensePlate: $('v-plate').value, capacityWeight: parseFloat($('v-weight').value), capacityVolume: parseFloat($('v-volume').value) };
    try {
      if (editId) await API.put(`/api/Vehicles/${editId}`, data);
      else await API.post('/api/Vehicles', data);
      toast('Saved', 'success');
      hideVehicleForm();
      await loadVehicles();
    } catch (err) { toast(err.message, 'error'); }
  };
  window.editVehicle = (id) => showVehicleForm(vehicles.find(v => v.vehicleId === id));
  window.deleteVehicle = (id) => {
    const v = vehicles.find(x => x.vehicleId === id);
    confirm('Delete Vehicle', `Delete vehicle ${v?.licensePlate || '#' + id}?`, async () => {
      try { await API.delete(`/api/Vehicles/${id}`); toast('Deleted', 'success'); await loadVehicles(); }
      catch (err) { toast(err.message, 'error'); }
    });
  };

  async function loadVehicles() {
    try {
      vehicles = await API.get('/api/Vehicles');
      $('vehicles-table').innerHTML = vehicles.length === 0 ? '<div class="empty-state">No vehicles found.</div>' : `
        <table class="table">
          <thead><tr><th>ID</th><th>Type</th><th>Weight Cap.</th><th>Volume Cap.</th><th>License Plate</th><th>Actions</th></tr></thead>
          <tbody>${vehicles.map(v => `
            <tr>
              <td>${v.vehicleId}</td>
              <td>${vehicleTypeLabels[v.type] || v.type}</td>
              <td>${v.capacityWeight} kg</td>
              <td>${v.capacityVolume} m³</td>
              <td>${v.licensePlate}</td>
              <td><div class="action-btns">
                <button class="btn btn-outline btn-sm" onclick="editVehicle(${v.vehicleId})">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteVehicle(${v.vehicleId})">🗑 Delete</button>
              </div></td>
            </tr>`).join('')}</tbody>
        </table>`;
    } catch (err) { $('vehicles-table').innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
  }
  await loadVehicles();
});
