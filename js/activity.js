/* ============================================================
   JARA ∆ — Activity Page Logic
   js/activity.js

   Depends on:
     - window._supabase  (js/supabase-client.js)
     - DOM in activity/index.html

   TABLE OF CONTENTS
   1.  State
   2.  Placeholder data  ← swap each section for Supabase later
   3.  DOM references
   4.  Tab manager
   5.  Notification filter
   6.  Render: Notifications
   7.  Render: My Activity (Listings, Requests, Replies)
   8.  Render: Saved Items
   9.  Render: Recently Viewed
   10. Stats row
   11. Pull-to-refresh
   12. Mark-all-read
   13. Auth guard + user load
   14. Init
============================================================ */

document.addEventListener('DOMContentLoaded', () => {


  /* ==========================================================
     1. STATE
  ========================================================== */
  const state = {
    activeTab:     'notifications',
    notifFilter:   'all',
    notifications: [],        // Loaded in init
    userId:        null,
    isRefreshing:  false,
  };


  /* ==========================================================
     2. PLACEHOLDER DATA
     -------------------------------------------------------
     FUTURE: Replace each array / object below with a
     Supabase query in the corresponding render function.

     Each section is labelled with its future table source.
     -------------------------------------------------------
  ========================================================== */

  /* ---- NOTIFICATIONS ----
     FUTURE: SELECT * FROM notifications WHERE user_id = auth.uid()
             ORDER BY created_at DESC
  ---- */
  const PLACEHOLDER_NOTIFICATIONS = [
    // --- TODAY ---
    {
      id: 'n1',
      group:   'Today',
      type:    'listing',
      icon:    'fa-solid fa-box',
      iconCls: 'notif-item__icon--listing',
      title:   'Your listing is live',
      body:    'Honda Generator — 2.5KVA is now visible to the JARA community.',
      time:    '2 min ago',
      isUnread: true,
      link:    '../listing/index.html?id=p1',
    },
    {
      id: 'n2',
      group:   'Today',
      type:    'request',
      icon:    'fa-solid fa-bullhorn',
      iconCls: 'notif-item__icon--request',
      title:   'Someone replied to your request',
      body:    'A provider responded to your "Need assignment typing" request.',
      time:    '18 min ago',
      isUnread: true,
      link:    '../listing/index.html?id=rq2',
    },
    {
      id: 'n3',
      group:   'Today',
      type:    'reward',
      icon:    'fa-solid fa-trophy',
      iconCls: 'notif-item__icon--reward',
      title:   'Founding Member reward 🎉',
      body:    "You're one of JARA's first 500 members. A special badge has been added to your profile.",
      time:    '1 hr ago',
      isUnread: true,
      link:    '../profile/index.html',
    },
    // --- YESTERDAY ---
    {
      id: 'n4',
      group:   'Yesterday',
      type:    'approved',
      icon:    'fa-solid fa-circle-check',
      iconCls: 'notif-item__icon--approved',
      title:   'Listing approved',
      body:    'Your service "Hostel Room Cleaning" has been approved and is now live.',
      time:    'Yesterday, 4:12 PM',
      isUnread: false,
      link:    '../listing/index.html?id=s3',
    },
    {
      id: 'n5',
      group:   'Yesterday',
      type:    'verified',
      icon:    'fa-solid fa-badge-check',
      iconCls: 'notif-item__icon--verified',
      title:   'Verification update',
      body:    'Your verification request is under review. We'll notify you within 24 hours.',
      time:    'Yesterday, 11:30 AM',
      isUnread: false,
      link:    '../profile/index.html',
    },
    // --- THIS WEEK ---
    {
      id: 'n6',
      group:   'This Week',
      type:    'expired',
      icon:    'fa-solid fa-clock',
      iconCls: 'notif-item__icon--expired',
      title:   'Listing expired',
      body:    'Your product "Fairly Used Economics Textbooks" has expired. Renew it to keep it visible.',
      time:    '3 days ago',
      isUnread: false,
      link:    '../listing/index.html?id=p2',
    },
    {
      id: 'n7',
      group:   'This Week',
      type:    'pro',
      icon:    'fa-solid fa-crown',
      iconCls: 'notif-item__icon--pro',
      title:   'Unlock JARA PRO',
      body:    'Get priority placement in search, more photos, a PRO badge and early request alerts.',
      time:    '4 days ago',
      isUnread: false,
      link:    '../premium/index.html',
    },
    {
      id: 'n8',
      group:   'This Week',
      type:    'listing',
      icon:    'fa-solid fa-box',
      iconCls: 'notif-item__icon--listing',
      title:   'New listing near you',
      body:    'A generator rental just went live 0.3 km from you.',
      time:    '5 days ago',
      isUnread: false,
      link:    '../listing/index.html?id=p1',
    },
    {
      id: 'n9',
      group:   'This Week',
      type:    'system',
      icon:    'fa-solid fa-circle-info',
      iconCls: 'notif-item__icon--system',
      title:   'Welcome to JARA ∆',
      body:    'Your profile is set up. Start exploring what your campus community has to offer.',
      time:    '6 days ago',
      isUnread: false,
      link:    '../explore/index.html',
    },
  ];

  /* ---- MY LISTINGS ----
     FUTURE: SELECT id, title, images, status, view_count, created_at
             FROM products WHERE owner_id = auth.uid()
             UNION ALL
             SELECT id, title, images, status, view_count, created_at
             FROM services WHERE provider_id = auth.uid()
             ORDER BY created_at DESC LIMIT 5
  ---- */
  const PLACEHOLDER_LISTINGS = [
    {
      id: 'l1',
      title:  'Honda Generator — 2.5KVA for Rent',
      thumb:  '⚡',
      price:  '₦2,500/night',
      status: 'active',
      views:  34,
      time:   '2 days ago',
      link:   '../listing/index.html?id=p1',
    },
    {
      id: 'l2',
      title:  'Hostel Room Cleaning — Weekly Plans',
      thumb:  '🏠',
      price:  '₦1,500/session',
      status: 'active',
      views:  17,
      time:   '4 days ago',
      link:   '../listing/index.html?id=s3',
    },
    {
      id: 'l3',
      title:  'Fairly Used Economics Textbooks — 200L',
      thumb:  '📚',
      price:  '₦4,500',
      status: 'expired',
      views:  52,
      time:   '1 week ago',
      link:   '../listing/index.html?id=p2',
    },
  ];

  /* ---- MY REQUESTS ----
     FUTURE: SELECT id, title, status, created_at
             FROM requests WHERE owner_id = auth.uid()
             ORDER BY created_at DESC LIMIT 5
  ---- */
  const PLACEHOLDER_REQUESTS = [
    {
      id: 'rq1',
      title:  'Need a generator tonight — Block B2',
      thumb:  '📢',
      price:  'Budget: ₦2,000',
      status: 'active',
      time:   'Today',
      link:   '../listing/index.html?id=rq1',
    },
    {
      id: 'rq2',
      title:  'Assignment typing needed — 5 pages',
      thumb:  '⌨️',
      price:  'Negotiable',
      status: 'pending',
      time:   'Yesterday',
      link:   '../listing/index.html?id=rq2',
    },
  ];

  /* ---- MY REPLIES ----
     FUTURE: SELECT id, request_title, response_body, created_at
             FROM replies WHERE responder_id = auth.uid()
             ORDER BY created_at DESC LIMIT 5
             (replies table does not yet exist — see SQL section)
  ---- */
  const PLACEHOLDER_REPLIES = [];  // Empty — shows empty state

  /* ---- SAVED ITEMS ----
     FUTURE: SELECT f.id, f.product_id, f.service_id,
               COALESCE(p.title, s.title) AS title,
               COALESCE(p.images[1], s.images[1]) AS image,
               COALESCE(p.price, s.price) AS price,
               COALESCE(p.price_type, s.price_type) AS price_type
             FROM favorites f
             LEFT JOIN products  p ON p.id = f.product_id
             LEFT JOIN services  s ON s.id = f.service_id
             WHERE f.user_id = auth.uid()
             ORDER BY f.created_at DESC
  ---- */
  const PLACEHOLDER_SAVED = [
    {
      id: 'sv1',
      title: 'Custom Cakes & Pastries',
      image: 'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=200&h=200&fit=crop',
      price: 'From ₦8,000',
      category: 'Food & Drinks',
      link: '../listing/index.html?id=p6',
    },
    {
      id: 'sv2',
      title: 'Graphic Design — Flyers & Logos',
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&h=200&fit=crop',
      price: 'From ₦2,000',
      category: 'Creative Services',
      link: '../listing/index.html?id=s2',
    },
    {
      id: 'sv3',
      title: 'Professional Photography',
      image: null,
      price: 'From ₦5,000',
      category: 'Photography',
      link: '../listing/index.html?id=s5',
    },
  ];

  /* ---- RECENTLY VIEWED ----
     FUTURE: Store view history in localStorage under key 'jara_viewed'
             OR in a future listing_views table.
             Key: listing id → { title, image, price, timestamp }
  ---- */
  const PLACEHOLDER_VIEWED = [
    {
      id: 'rv1',
      title: 'Honda Generator — 2.5KVA for Rent',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
      price: '₦2,500/night',
      category: 'Power & Generator',
      link: '../listing/index.html?id=p1',
    },
    {
      id: 'rv2',
      title: 'iPhone 12 — Fairly Used',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop',
      price: '₦145,000',
      category: 'Tech & Repairs',
      link: '../listing/index.html?id=p3',
    },
    {
      id: 'rv3',
      title: 'GST Tutoring — All Courses',
      image: null,
      price: '₦2,000/hr',
      category: 'Tutoring',
      link: '../listing/index.html?id=s6',
    },
    {
      id: 'rv4',
      title: "Women's Shoes — Size 38–42",
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop',
      price: '₦7,500',
      category: 'Fashion',
      link: '../listing/index.html?id=p4',
    },
  ];

  /* ---- STATS ----
     FUTURE: Multiple count queries or a single RPC function:
             SELECT
               (SELECT COUNT(*) FROM products WHERE owner_id = auth.uid()) +
               (SELECT COUNT(*) FROM services WHERE provider_id = auth.uid()) AS listings,
               (SELECT COUNT(*) FROM requests WHERE owner_id = auth.uid()) AS requests,
               (SELECT COUNT(*) FROM replies WHERE responder_id = auth.uid()) AS replies,
               (SELECT COALESCE(SUM(view_count),0) FROM products WHERE owner_id = auth.uid()) +
               (SELECT COALESCE(SUM(view_count),0) FROM services WHERE provider_id = auth.uid()) AS views
  ---- */
  const PLACEHOLDER_STATS = {
    listings: 3,
    requests: 2,
    replies:  0,
    views:    103,
  };


  /* ==========================================================
     3. DOM REFERENCES
  ========================================================== */
  const tabs              = document.querySelectorAll('.ac-tab');
  const panels            = document.querySelectorAll('.ac-panel');
  const notifList         = document.getElementById('notifList');
  const notifBadge        = document.getElementById('notifBadge');
  const markAllReadBtn    = document.getElementById('markAllRead');
  const myListingsList    = document.getElementById('myListingsList');
  const myRequestsList    = document.getElementById('myRequestsList');
  const myRepliesList     = document.getElementById('myRepliesList');
  const savedList         = document.getElementById('savedList');
  const viewedList        = document.getElementById('viewedList');
  const pullIndicator     = document.getElementById('pullIndicator');
  const pullIcon          = document.getElementById('pullIcon');
  const pullLabel         = document.getElementById('pullLabel');
  const notifFilters      = document.querySelectorAll('.notif-filter');

  // Stat value elements
  const statListings      = document.getElementById('statListings');
  const statRequests      = document.getElementById('statRequests');
  const statReplies       = document.getElementById('statReplies');
  const statViews         = document.getElementById('statViews');


  /* ==========================================================
     4. TAB MANAGER
  ========================================================== */

  function switchTab(tabName) {
    state.activeTab = tabName;

    tabs.forEach(t => {
      const isActive = t.dataset.tab === tabName;
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.classList.toggle('ac-tab--active', isActive);
    });

    panels.forEach(p => {
      const isActive = p.id === `panel${capitalize(tabName)}`;
      if (isActive) {
        p.removeAttribute('hidden');
      } else {
        p.setAttribute('hidden', '');
      }
    });

    // Show/hide mark-all-read depending on tab
    if (tabName === 'notifications') {
      const hasUnread = state.notifications.some(n => n.isUnread);
      if (hasUnread) markAllReadBtn.removeAttribute('hidden');
      else           markAllReadBtn.setAttribute('hidden', '');
    } else {
      markAllReadBtn.setAttribute('hidden', '');
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }


  /* ==========================================================
     5. NOTIFICATION FILTER
  ========================================================== */

  notifFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      notifFilters.forEach(b => {
        b.setAttribute('aria-pressed', 'false');
        b.classList.remove('notif-filter--active');
      });
      btn.setAttribute('aria-pressed', 'true');
      btn.classList.add('notif-filter--active');
      state.notifFilter = btn.dataset.notifFilter;
      renderNotifications();
    });
  });


  /* ==========================================================
     6. RENDER: NOTIFICATIONS
  ========================================================== */

  function renderNotifications() {
    notifList.innerHTML = '';

    let filtered = state.notifications;

    // Apply category filter
    if (state.notifFilter === 'unread') {
      filtered = filtered.filter(n => n.isUnread);
    } else if (state.notifFilter !== 'all') {
      const typeMap = {
        listings: ['listing', 'approved', 'expired'],
        requests: ['request'],
        system:   ['system', 'pro', 'verified', 'reward'],
      };
      const types = typeMap[state.notifFilter] || [];
      filtered = filtered.filter(n => types.includes(n.type));
    }

    if (filtered.length === 0) {
      notifList.appendChild(buildEmptyState(
        'fa-solid fa-bell-slash',
        'No notifications',
        state.notifFilter === 'unread'
          ? "You're all caught up! No unread notifications."
          : "Nothing here yet. Notifications will appear as activity happens."
      ));
      return;
    }

    // Group by date heading
    let currentGroup = '';
    filtered.forEach((notif, index) => {
      if (notif.group !== currentGroup) {
        currentGroup = notif.group;
        const groupEl = document.createElement('p');
        groupEl.className   = 'notif-date-group';
        groupEl.textContent = notif.group;
        notifList.appendChild(groupEl);
      }

      const item = buildNotifItem(notif, index);
      notifList.appendChild(item);
    });

    // Update unread badge on tab
    const unreadCount = state.notifications.filter(n => n.isUnread).length;
    if (unreadCount > 0) {
      notifBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      notifBadge.removeAttribute('hidden');
      markAllReadBtn.removeAttribute('hidden');
    } else {
      notifBadge.setAttribute('hidden', '');
      markAllReadBtn.setAttribute('hidden', '');
    }
  }

  function buildNotifItem(notif, index) {
    const item = document.createElement('a');
    item.className = `notif-item${notif.isUnread ? ' is-unread' : ''}`;
    item.href      = notif.link || '#';
    item.setAttribute('role', 'listitem');
    item.setAttribute('aria-label', notif.title);
    item.style.animationDelay = `${index * 40}ms`;

    item.innerHTML = `
      <div class="notif-item__icon ${notif.iconCls}" aria-hidden="true">
        <i class="${notif.icon}"></i>
      </div>
      <div class="notif-item__content">
        <p class="notif-item__title">${escapeHTML(notif.title)}</p>
        <p class="notif-item__body">${escapeHTML(notif.body)}</p>
        <p class="notif-item__time">${escapeHTML(notif.time)}</p>
      </div>
      <i class="fa-solid fa-chevron-right notif-item__arrow" aria-hidden="true"></i>
    `;

    // Mark as read on click
    item.addEventListener('click', () => {
      notif.isUnread = false;
      item.classList.remove('is-unread');
      updateUnreadBadge();
    });

    return item;
  }

  function updateUnreadBadge() {
    const count = state.notifications.filter(n => n.isUnread).length;
    if (count > 0) {
      notifBadge.textContent = count > 99 ? '99+' : count;
      notifBadge.removeAttribute('hidden');
      markAllReadBtn.removeAttribute('hidden');
    } else {
      notifBadge.setAttribute('hidden', '');
      markAllReadBtn.setAttribute('hidden', '');
    }
  }


  /* ==========================================================
     7. RENDER: MY ACTIVITY
  ========================================================== */

  function renderMyActivity() {
    renderActivityList(myListingsList, PLACEHOLDER_LISTINGS, {
      emptyIcon:  'fa-solid fa-box-open',
      emptyTitle: 'No listings yet',
      emptySub:   'Create your first listing and let the campus find you.',
      emptyLink:  { href: '../sell/index.html', label: 'Create a Listing' },
    });

    renderActivityList(myRequestsList, PLACEHOLDER_REQUESTS, {
      emptyIcon:  'fa-solid fa-bullhorn',
      emptyTitle: 'No requests yet',
      emptySub:   "Post a request and let someone near you fulfil it.",
      emptyLink:  { href: '../sell/index.html?type=request', label: 'Post a Request' },
    });

    renderActivityList(myRepliesList, PLACEHOLDER_REPLIES, {
      emptyIcon:  'fa-solid fa-reply',
      emptyTitle: 'No replies yet',
      emptySub:   'When you respond to a request, it will appear here.',
    });
  }

  function renderActivityList(container, items, emptyConfig) {
    container.innerHTML = '';

    if (!items || items.length === 0) {
      const emptyEl = buildEmptyState(
        emptyConfig.emptyIcon,
        emptyConfig.emptyTitle,
        emptyConfig.emptySub,
        emptyConfig.emptyLink
      );
      emptyEl.style.padding = 'var(--space-6) 0';
      container.appendChild(emptyEl);
      return;
    }

    items.forEach((item, i) => {
      const el = document.createElement('a');
      el.className = 'activity-item';
      el.href      = item.link || '#';
      el.setAttribute('role', 'listitem');
      el.style.animationDelay = `${i * 50}ms`;

      const statusHTML = item.status
        ? `<span class="activity-status activity-status--${item.status}">
             ${escapeHTML(item.status)}
           </span>`
        : '';

      el.innerHTML = `
        <div class="activity-item__thumb" aria-hidden="true">
          ${item.image
            ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}" loading="lazy" />`
            : item.thumb || '📦'
          }
        </div>
        <div class="activity-item__content">
          <p class="activity-item__title">${escapeHTML(item.title)}</p>
          <div class="activity-item__meta">
            ${statusHTML}
            <span>${escapeHTML(item.price || '')}</span>
            ${item.views !== undefined
              ? `<span><i class="fa-solid fa-eye" aria-hidden="true"></i> ${item.views}</span>`
              : ''
            }
            <span>${escapeHTML(item.time || '')}</span>
                  </div>
        </div>
        <i class="fa-solid fa-chevron-right activity-item__arrow" aria-hidden="true"></i>
      `;

      container.appendChild(el);
    });
  }


  /* ==========================================================
     8. RENDER: SAVED ITEMS
  ========================================================== */

  function renderSaved() {
    savedList.innerHTML = '';

    if (!PLACEHOLDER_SAVED || PLACEHOLDER_SAVED.length === 0) {
      savedList.style.display = 'block';
      savedList.appendChild(buildEmptyState(
        'fa-solid fa-bookmark',
        'Nothing saved yet',
        'Tap the bookmark on any listing to save it here for later.',
        { href: '../explore/index.html', label: 'Browse Listings' }
      ));
      return;
    }

    savedList.style.display = '';
    PLACEHOLDER_SAVED.forEach(item => {
      const card = buildCompactCard(item, true);
      savedList.appendChild(card);
    });
  }


  /* ==========================================================
     9. RENDER: RECENTLY VIEWED
  ========================================================== */

  function renderViewed() {
    viewedList.innerHTML = '';

    if (!PLACEHOLDER_VIEWED || PLACEHOLDER_VIEWED.length === 0) {
      viewedList.style.display = 'block';
      viewedList.appendChild(buildEmptyState(
        'fa-solid fa-clock-rotate-left',
        'Nothing viewed yet',
        'Listings you visit will appear here so you can find them again quickly.',
        { href: '../explore/index.html', label: 'Start Exploring' }
      ));
      return;
    }

    viewedList.style.display = '';
    PLACEHOLDER_VIEWED.forEach(item => {
      const card = buildCompactCard(item, false);
      viewedList.appendChild(card);
    });
  }

  function buildCompactCard(item, showRemove) {
    const card = document.createElement('a');
    card.className = 'compact-card';
    card.href      = item.link || '#';
    card.setAttribute('aria-label', item.title);

    card.innerHTML = `
      <div class="compact-card__image-wrap">
        ${item.image
          ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}" loading="lazy" />`
          : `<div class="compact-card__placeholder" aria-hidden="true">📦</div>`
        }
        ${showRemove
          ? `<button class="compact-card__remove" type="button" aria-label="Remove from saved">
               <i class="fa-solid fa-xmark" aria-hidden="true"></i>
             </button>`
          : ''
        }
      </div>
      <div class="compact-card__body">
        <p class="compact-card__title">${escapeHTML(item.title)}</p>
        <p class="compact-card__price">${escapeHTML(item.price || '—')}</p>
        <p class="compact-card__meta">${escapeHTML(item.category || '')}</p>
      </div>
    `;

    // Prevent remove button from navigating
    if (showRemove) {
      card.querySelector('.compact-card__remove')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        card.style.transition = 'opacity 250ms ease, transform 250ms ease';
        card.style.opacity    = '0';
        card.style.transform  = 'scale(0.92)';
        setTimeout(() => card.remove(), 260);
        // FUTURE: DELETE FROM favorites WHERE id = item.id AND user_id = auth.uid()
      });
    }

    return card;
  }


  /* ==========================================================
     10. STATS ROW
  ========================================================== */

  function renderStats(stats) {
    // Animate count-up on each stat
    countUp(statListings, stats.listings);
    countUp(statRequests, stats.requests);
    countUp(statReplies,  stats.replies);
    countUp(statViews,    stats.views);
  }

  function countUp(el, target) {
    if (!el) return;
    let current  = 0;
    const step   = Math.ceil(target / 20);
    const ticker = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString();
      if (current >= target) clearInterval(ticker);
    }, 40);
  }


  /* ==========================================================
     11. PULL-TO-REFRESH
     Pure CSS/JS visual — reloads data without a page refresh.
  ========================================================== */

  let touchStartY  = 0;
  let pullDistance = 0;
  const PULL_THRESHOLD = 80; // px needed to trigger refresh

  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (window.scrollY > 0 || state.isRefreshing) return;

    pullDistance = e.touches[0].clientY - touchStartY;

    if (pullDistance > 20) {
      pullIndicator.classList.add('is-pulling');

      if (pullDistance > PULL_THRESHOLD) {
        pullLabel.textContent = 'Release to refresh';
        pullIcon.style.transform = 'rotate(180deg)';
      } else {
        pullLabel.textContent = 'Pull to refresh';
        pullIcon.style.transform = `rotate(${(pullDistance / PULL_THRESHOLD) * 180}deg)`;
      }
    }
  }, { passive: true });

  document.addEventListener('touchend', async () => {
    if (pullDistance > PULL_THRESHOLD && !state.isRefreshing) {
      await triggerRefresh();
    } else {
      pullIndicator.classList.remove('is-pulling');
      pullIcon.style.transform = '';
    }
    pullDistance = 0;
    touchStartY  = 0;
  });

  async function triggerRefresh() {
    state.isRefreshing   = true;
    pullLabel.textContent = 'Refreshing…';
    pullIcon.classList.add('is-spinning');
    pullIcon.style.transform = '';

    /*
     FUTURE: Replace this setTimeout with real Supabase fetches:
       const { data } = await window._supabase
         .from('notifications')
         .select('*')
         .eq('user_id', state.userId)
         .order('created_at', { ascending: false });
       state.notifications = data || [];
       renderNotifications();
    */

    await new Promise(resolve => setTimeout(resolve, 1200));

    // Re-render all panels with fresh placeholder data
    state.notifications = [...PLACEHOLDER_NOTIFICATIONS];
    renderNotifications();
    renderMyActivity();
    renderSaved();
    renderViewed();
    renderStats(PLACEHOLDER_STATS);

    // Done
    pullIcon.classList.remove('is-spinning');
    pullLabel.textContent = 'Up to date ✓';
    pullIcon.style.color  = 'var(--color-success)';

    setTimeout(() => {
      pullIndicator.classList.remove('is-pulling');
      pullIcon.style.color  = '';
      pullLabel.textContent = 'Pull to refresh';
      state.isRefreshing    = false;
    }, 1000);
  }


  /* ==========================================================
     12. MARK-ALL-READ
  ========================================================== */

  markAllReadBtn.addEventListener('click', () => {
    state.notifications.forEach(n => { n.isUnread = false; });
    renderNotifications();
    markAllReadBtn.setAttribute('hidden', '');

    // FUTURE: UPDATE notifications SET is_read = TRUE
    //         WHERE user_id = auth.uid() AND is_read = FALSE
  });


  /* ==========================================================
     13. AUTH GUARD + USER LOAD
  ========================================================== */

  async function loadUser() {
    try {
      const { data: { session } } = await window._supabase.auth.getSession();
      if (!session) {
        window.location.href = '../auth/login.html';
        return false;
      }
      state.userId = session.user.id;
      return true;
    } catch {
      // If Supabase is unavailable, continue with placeholder data
      return true;
    }
  }


  /* ==========================================================
     14. UTILITY
  ========================================================== */

  function escapeHTML(str) {
    if (!str && str !== 0) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function buildEmptyState(iconCls, title, sub, link) {
    const el = document.createElement('div');
    el.className = 'empty-state';

    el.innerHTML = `
      <div class="empty-state__illustration" aria-hidden="true">
        <div class="empty-state__ring"></div>
        <div class="empty-state__ring empty-state__ring--2"></div>
        <i class="${iconCls} empty-state__icon"></i>
      </div>
      <h3 class="empty-state__title">${escapeHTML(title)}</h3>
      <p class="empty-state__sub">${escapeHTML(sub)}</p>
      ${link
        ? `<a href="${link.href}" class="btn-primary">
             ${escapeHTML(link.label)}
             <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
           </a>`
        : ''
      }
    `;

    return el;
  }


  /* ==========================================================
     15. INIT
  ========================================================== */

  async function init() {
    // Auth check
    const authed = await loadUser();
    if (!authed) return;

    // Load placeholder data into state
    state.notifications = [...PLACEHOLDER_NOTIFICATIONS];

    // Render all panels
    renderNotifications();
    renderMyActivity();
    renderSaved();
    renderViewed();
    renderStats(PLACEHOLDER_STATS);

    // Start on the notifications tab
    switchTab('notifications');
  }

  init();


/* ============================================================
   End of DOMContentLoaded
============================================================ */
});
