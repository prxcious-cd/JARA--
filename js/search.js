/* ============================================================
   JARA ∆ — Search Page Logic
   js/search.js

   Depends on:
     - window._supabase  (js/supabase-client.js)
     - DOM in search/index.html

   TABLE OF CONTENTS
   1.  State
   2.  Placeholder data — swap for Supabase queries later
   3.  DOM references
   4.  Panel manager — show one panel at a time
   5.  Recent searches — localStorage
   6.  Popular searches
   7.  Category grid
   8.  Search bar — focus, clear, input handling
   9.  Live suggestions — as user types
   10. Full search — keyword match engine
   11. Filter chips
   12. Price filter modal
   13. Render helpers
   14. Results rendering — grouped by type
   15. Empty state
   16. URL parameter handling (from Explore links)
   17. Init
============================================================ */

document.addEventListener('DOMContentLoaded', () => {


  /* ==========================================================
     1. STATE
  ========================================================== */
  const state = {
    query:       '',
    activeFilter:'all',
    priceMin:    null,
    priceMax:    null,
    results:     [],      // Full unfiltered result set
    debounceTimer: null,
  };

  // How long to wait after typing stops before running search (ms)
  const DEBOUNCE_MS = 280;

  // LocalStorage key for recent searches
  const RECENT_KEY = 'jara_recent_searches';

  // Max recent searches to store
  const MAX_RECENT = 8;


  /* ==========================================================
     2. PLACEHOLDER DATA
     -------------------------------------------------------
     FUTURE INTEGRATION POINT:
     Replace each array below with a Supabase query.
     The search engine (Section 10) only needs the arrays
     to have the same shape — it does not care where they
     come from.

     Example replacement for PRODUCTS:
       const { data: PRODUCTS } = await window._supabase
         .from('products')
         .select('id, title, description, price, images,
                  category_id, owner_id, status, tags,
                  location, is_verified_by_jara, jara_pro_boost')
         .eq('status', 'active');

     Do the same for SERVICES, REQUESTS, BUSINESSES.
     -------------------------------------------------------
  ========================================================== */

  const PRODUCTS = [
    {
      id: 'p1', type: 'product',
      title: 'Honda Generator — 2.5KVA for Rent',
      description: 'Reliable Honda generator available for nightly rental. Perfect for hostel use during NEPA outages.',
      category: 'Power & Generator',
      price: 2500, priceLabel: '₦2,500/night',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
      seller: { name: 'Emeka J.', initials: 'EJ', avatar: null },
      distance: '0.3 km',
      verified: true, pro: false,
      tags: ['generator', 'power', 'electricity', 'hostel', 'rental'],
    },
    {
      id: 'p2', type: 'product',
      title: 'Fairly Used Economics Textbooks — 200L',
      description: 'Principles of Economics, Micro & Macro. Good condition. Used for one semester only.',
      category: 'Books & Stationery',
      price: 4500, priceLabel: '₦4,500',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop',
      seller: { name: 'Adaeze O.', initials: 'AO', avatar: null },
      distance: '0.2 km',
      verified: false, pro: false,
      tags: ['books', 'textbook', 'economics', 'study', 'secondhand'],
    },
    {
      id: 'p3', type: 'product',
      title: 'iPhone 12 — Fairly Used, Excellent Condition',
      description: '128GB, no fault, battery health 88%. Comes with charger and original box.',
      category: 'Tech & Repairs',
      price: 145000, priceLabel: '₦145,000',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop',
      seller: { name: 'Hassan B.', initials: 'HB', avatar: null },
      distance: '0.9 km',
      verified: true, pro: false,
      tags: ['phone', 'iphone', 'smartphone', 'fairly used', 'tech'],
    },
    {
      id: 'p4', type: 'product',
      title: "Women's Shoes — Size 38 to 42",
      description: 'Various styles available. New arrivals weekly. Pay on delivery within campus.',
      category: 'Fashion & Clothing',
      price: 7500, priceLabel: '₦7,500',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop',
      seller: { name: 'Ngozi A.', initials: 'NA', avatar: null },
      distance: '1.2 km',
      verified: false, pro: false,
      tags: ['shoes', 'fashion', 'footwear', 'women'],
    },
    {
      id: 'p5', type: 'product',
      title: 'Jollof Rice & Chicken — Daily Orders',
      description: 'Hot homemade jollof rice with chicken. Order before 12pm for afternoon delivery.',
      category: 'Food & Drinks',
      price: 1200, priceLabel: '₦1,200',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
      seller: { name: 'Mama Grace', initials: 'MG', avatar: null },
      distance: '0.4 km',
      verified: true, pro: false,
      tags: ['food', 'rice', 'jollof', 'chicken', 'meal', 'delivery'],
    },
    {
      id: 'p6', type: 'product',
      title: 'Custom Birthday Cakes — Order 24hrs Ahead',
      description: 'Beautiful custom cakes for every occasion. All flavours. Delivery within campus.',
      category: 'Food & Drinks',
      price: 8000, priceLabel: 'From ₦8,000',
      image: 'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=200&h=200&fit=crop',
      seller: { name: 'Blessing A.', initials: 'BA', avatar: null },
      distance: '0.6 km',
      verified: true, pro: true,
      tags: ['cake', 'birthday', 'pastry', 'custom', 'food'],
    },
  ];

  const SERVICES = [
    {
      id: 's1', type: 'service',
      title: 'Laptop Repairs — Fast Turnaround',
      description: 'Screen replacement, battery, keyboard, motherboard issues. 24hr turnaround on most jobs.',
      category: 'Tech & Repairs',
      price: 3000, priceLabel: 'From ₦3,000',
      image: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=200&h=200&fit=crop',
      seller: { name: 'Chukwudi T.', initials: 'CT', avatar: null },
      distance: '1.1 km',
      verified: false, pro: false,
      tags: ['laptop', 'repair', 'tech', 'computer', 'fix'],
    },
    {
      id: 's2', type: 'service',
      title: 'Graphic Design — Flyers, Logos, Banners',
      description: 'Professional graphic design for student events, businesses and personal projects.',
      category: 'Creative Services',
      price: 2000, priceLabel: 'From ₦2,000',
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&h=200&fit=crop',
      seller: { name: 'Zainab M.', initials: 'ZM', avatar: null },
      distance: '0.8 km',
      verified: true, pro: true,
      tags: ['design', 'graphic', 'logo', 'flyer', 'creative'],
    },
    {
      id: 's3', type: 'service',
      title: 'Hostel Room Cleaning — Weekly Plans',
      description: 'Deep cleaning, mopping, bed making. Book weekly for a discount.',
      category: 'Laundry & Errands',
      price: 1500, priceLabel: '₦1,500/session',
      image: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=200&h=200&fit=crop',
      seller: { name: 'Kemi F.', initials: 'KF', avatar: null },
      distance: '0.5 km',
      verified: true, pro: false,
      tags: ['cleaning', 'laundry', 'hostel', 'room', 'errand'],
    },
    {
      id: 's4', type: 'service',
      title: 'Assignment Printing & Binding',
      description: 'Fast printing, colour and black & white. Spiral and hard binding available.',
      category: 'Printing & Typing',
      price: 200, priceLabel: '₦200/page',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
      seller: { name: 'David K.', initials: 'DK', avatar: null },
      distance: '0.3 km',
      verified: false, pro: false,
      tags: ['printing', 'print', 'assignment', 'typing', 'binding'],
    },
    {
      id: 's5', type: 'service',
      title: 'Professional Photography — Events & Portraits',
      description: 'Graduation photos, event coverage, passport photos. Same-day editing available.',
      category: 'Photography',
      price: 5000, priceLabel: 'From ₦5,000',
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&h=200&fit=crop',
      seller: { name: 'Tunde E.', initials: 'TE', avatar: null },
      distance: '1.4 km',
      verified: true, pro: true,
      tags: ['photo', 'photography', 'portrait', 'event', 'camera'],
    },
    {
      id: 's6', type: 'service',
      title: 'GST Tutoring — All Courses',
      description: 'Help with GST 101, 102, 201 and university-wide general studies. Flexible sessions.',
      category: 'Tutoring',
      price: 2000, priceLabel: '₦2,000/hr',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop',
      seller: { name: 'Fatima K.', initials: 'FK', avatar: null },
      distance: '0.7 km',
      verified: false, pro: false,
      tags: ['tutor', 'gst', 'study', 'lesson', 'academics', 'teacher'],
    },
    {
      id: 's7', type: 'service',
      title: 'Laundry Pickup & Delivery — 2 Day Turnaround',
      description: 'Collect, wash, iron and deliver to your hostel. Per-bag pricing.',
      category: 'Laundry & Errands',
      price: 1000, priceLabel: 'From ₦1,000/bag',
      image: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=200&h=200&fit=crop',
      seller: { name: 'Chisom A.', initials: 'CA', avatar: null },
      distance: '0.6 km',
      verified: false, pro: false,
      tags: ['laundry', 'washing', 'ironing', 'delivery', 'clothes'],
    },
    {
      id: 's8', type: 'service',
      title: 'Haircut & Styling — Home Service',
      description: 'Fades, waves, dreads and styling. I come to you on campus.',
      category: 'Personal Care',
      price: 1500, priceLabel: 'From ₦1,500',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
      seller: { name: 'Solomon P.', initials: 'SP', avatar: null },
      distance: '0.9 km',
      verified: false, pro: false,
      tags: ['haircut', 'barber', 'hair', 'styling', 'fade', 'grooming'],
    },
  ];

  const REQUESTS = [
    {
      id: 'rq1', type: 'request',
      title: 'Need a generator tonight — Block B2',
      description: 'NEPA has been out since yesterday. Need rental for just one night.',
      category: 'Power & Generator',
      price: 2000, priceLabel: 'Budget: ₦2,000',
      image: null,
      seller: { name: 'Anonymous', initials: 'AN', avatar: null },
      distance: '0.2 km',
      verified: false, pro: false,
      tags: ['generator', 'power', 'urgent', 'hostel'],
    },
    {
      id: 'rq2', type: 'request',
      title: 'Assignment typing needed — 5 pages, due tomorrow',
      description: 'I have the handwritten draft. Need it typed and formatted in APA. WhatsApp me.',
      category: 'Printing & Typing',
      price: null, priceLabel: 'Negotiable',
      image: null,
      seller: { name: 'Anonymous', initials: 'AN', avatar: null },
      distance: '0.5 km',
      verified: false, pro: false,
      tags: ['typing', 'assignment', 'urgent', 'printing'],
    },
    {
      id: 'rq3', type: 'request',
      title: 'Looking for a birthday cake — tomorrow 2pm',
      description: 'Need a custom cake for my friend\'s surprise. Chocolate flavour. About 2kg.',
      category: 'Food & Drinks',
      price: 10000, priceLabel: 'Budget: ₦10,000',
      image: null,
      seller: { name: 'Anonymous', initials: 'AN', avatar: null },
      distance: '0.7 km',
      verified: false, pro: false,
      tags: ['cake', 'birthday', 'custom', 'food'],
    },
    {
      id: 'rq4', type: 'request',
      title: 'Need a GST tutor this week',
      description: 'Struggling with GST 101. Looking for private lessons, 2 sessions.',
      category: 'Tutoring',
      price: null, priceLabel: 'Negotiable',
      image: null,
      seller: { name: 'Anonymous', initials: 'AN', avatar: null },
      distance: '1.0 km',
      verified: false, pro: false,
      tags: ['tutor', 'gst', 'academics', 'lesson'],
    },
  ];

  const BUSINESSES = [
    {
      id: 'b1', type: 'business',
      title: "Blessing's Kitchen",
      description: 'Homemade meals, pastries and custom cakes. Order daily before 12pm.',
      category: 'Food & Drinks',
      price: null, priceLabel: 'See menu',
      image: 'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=200&h=200&fit=crop',
      seller: { name: 'Blessing A.', initials: 'BA', avatar: null },
      distance: '0.6 km',
      verified: true, pro: true,
      tags: ['food', 'cake', 'meal', 'restaurant', 'kitchen'],
    },
    {
      id: 'b2', type: 'business',
      title: 'ZM Creative Studio',
      description: 'Full-service design and photography studio for students and campus businesses.',
      category: 'Creative Services',
      price: null, priceLabel: 'Get a quote',
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&h=200&fit=crop',
      seller: { name: 'Zainab M.', initials: 'ZM', avatar: null },
      distance: '0.8 km',
      verified: true, pro: true,
      tags: ['design', 'studio', 'photography', 'creative', 'business'],
    },
  ];

  // All data merged for cross-type search
  // -------------------------------------------------------
  // FUTURE: replace with a single Supabase RPC call to the
  // search_listings() function defined in 003_functions.sql
  // -------------------------------------------------------
  const ALL_LISTINGS = [...PRODUCTS, ...SERVICES, ...REQUESTS, ...BUSINESSES];

  // Suggestion keywords for live type-ahead
  const SUGGESTION_TERMS = [
    { term: 'Generator',        sub: 'Power & Generator',   icon: '⚡' },
    { term: 'Generator Repair', sub: 'Tech & Repairs',      icon: '🔧' },
    { term: 'Generator Rental', sub: 'Power & Generator',   icon: '⚡' },
    { term: 'Laptop Repair',    sub: 'Tech & Repairs',      icon: '💻' },
    { term: 'Laundry',          sub: 'Laundry & Errands',   icon: '🧺' },
    { term: 'Laundry Pickup',   sub: 'Laundry & Errands',   icon: '🧺' },
    { term: 'Printing',         sub: 'Printing & Typing',   icon: '🖨️' },
    { term: 'Assignment Typing',sub: 'Printing & Typing',   icon: '⌨️' },
    { term: 'Tutor',            sub: 'Tutoring',            icon: '🎓' },
    { term: 'GST Tutor',        sub: 'Tutoring',            icon: '📚' },
    { term: 'Maths Tutor',      sub: 'Tutoring',            icon: '🔢' },
    { term: 'Haircut',          sub: 'Personal Care',       icon: '✂️' },
    { term: 'Hair Stylist',     sub: 'Personal Care',       icon: '💇' },
    { term: 'Food',             sub: 'Food & Drinks',       icon: '🍛' },
    { term: 'Jollof Rice',      sub: 'Food & Drinks',       icon: '🍚' },
    { term: 'Cake',             sub: 'Food & Drinks',       icon: '🎂' },
    { term: 'Birthday Cake',    sub: 'Food & Drinks',       icon: '🧁' },
    { term: 'Books',            sub: 'Books & Stationery',  icon: '📚' },
    { term: 'Textbooks',        sub: 'Books & Stationery',  icon: '📖' },
    { term: 'Photography',      sub: 'Photography',         icon: '📸' },
    { term: 'Graphic Design',   sub: 'Creative Services',   icon: '🎨' },
    { term: 'Room Cleaning',    sub: 'Laundry & Errands',   icon: '🏠' },
    { term: 'Phone Repair',     sub: 'Tech & Repairs',      icon: '📱' },
    { term: 'Shoes',            sub: 'Fashion & Clothing',  icon: '👟' },
    { term: 'Delivery',         sub: 'Logistics & Delivery',icon: '🚚' },
  ];

  const POPULAR_SEARCHES = [
    'Generator', 'Laptop Repair', 'Cake', 'Haircut',
    'Laundry', 'Food', 'Books', 'Printing', 'Tutor', 'Design',
  ];

  const CATEGORIES = [
    { emoji: '⚡', name: 'Power & Generator',  filter: 'generator' },
    { emoji: '📚', name: 'Books & Stationery', filter: 'books' },
    { emoji: '💻', name: 'Tech & Repairs',     filter: 'tech' },
    { emoji: '🍛', name: 'Food & Drinks',      filter: 'food' },
    { emoji: '✂️', name: 'Personal Care',      filter: 'haircut' },
    { emoji: '🎨', name: 'Creative Services',  filter: 'design' },
    { emoji: '🧺', name: 'Laundry & Errands',  filter: 'laundry' },
    { emoji: '🖨️', name: 'Printing & Typing', filter: 'printing' },
    { emoji: '🎓', name: 'Tutoring',           filter: 'tutor' },
    { emoji: '📸', name: 'Photography',        filter: 'photography' },
    { emoji: '👗', name: 'Fashion',            filter: 'fashion' },
    { emoji: '🚚', name: 'Delivery',           filter: 'delivery' },
  ];


  /* ==========================================================
     3. DOM REFERENCES
  ========================================================== */
  const searchInput      = document.getElementById('searchInput');
  const clearBtn         = document.getElementById('clearBtn');
  const srFilters        = document.getElementById('srFilters');
  const srDefault        = document.getElementById('srDefault');
  const srResults        = document.getElementById('srResults');
  const srEmpty          = document.getElementById('srEmpty');
  const srResultsBody    = document.getElementById('srResultsBody');
  const srCount          = document.getElementById('srCount');
  const srQuery          = document.getElementById('srQuery');
  const emptyQuery       = document.getElementById('emptyQuery');
  const srSuggestions    = document.getElementById('srSuggestions');
  const recentChips      = document.getElementById('recentChips');
  const popularChips     = document.getElementById('popularChips');
  const categoryGrid     = document.getElementById('categoryGrid');
  const clearRecentBtn   = document.getElementById('clearRecent');
  const priceFilterBtn   = document.getElementById('priceFilter');
  const priceModal       = document.getElementById('priceModal');
  const priceModalBg     = document.getElementById('priceModalBackdrop');
  const priceMinInput    = document.getElementById('priceMin');
  const priceMaxInput    = document.getElementById('priceMax');
  const priceApplyBtn    = document.getElementById('priceApply');
  const priceClearBtn    = document.getElementById('priceClear');
  const filterChips      = document.querySelectorAll('.filter-chip');


  /* ==========================================================
     4. PANEL MANAGER
     Only one of the three panels is shown at a time.
  ========================================================== */

  function showPanel(name) {
    srDefault.setAttribute('hidden', '');
    srResults.setAttribute('hidden', '');
    srEmpty.setAttribute('hidden', '');
    srSuggestions.setAttribute('hidden', '');

    if (name === 'default')   srDefault.removeAttribute('hidden');
    if (name === 'results')   srResults.removeAttribute('hidden');
    if (name === 'empty')     srEmpty.removeAttribute('hidden');
  }


  /* ==========================================================
     5. RECENT SEARCHES — localStorage
  ========================================================== */

  function getRecent() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveRecent(term) {
    let recent = getRecent().filter(t => t.toLowerCase() !== term.toLowerCase());
    recent.unshift(term);
    if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  }

  function removeRecent(term) {
    const updated = getRecent().filter(t => t !== term);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    renderRecentChips();
  }

  function clearAllRecent() {
    localStorage.removeItem(RECENT_KEY);
    renderRecentChips();
  }

  function renderRecentChips() {
    const recent = getRecent();
    recentChips.innerHTML = '';

    if (recent.length === 0) {
      recentChips.innerHTML = `<span class="chip-list--empty">No recent searches yet.</span>`;
      return;
    }

    recent.forEach(term => {
      const chip = document.createElement('span');
      chip.className = 'search-chip';
      chip.innerHTML = `
        <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
        ${escapeHTML(term)}
        <button class="search-chip__remove" aria-label="Remove ${escapeHTML(term)}">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      `;

      // Click on chip text → search
      chip.addEventListener('click', (e) => {
        if (e.target.closest('.search-chip__remove')) return;
        triggerSearch(term);
      });

      // Click × → remove
      chip.querySelector('.search-chip__remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removeRecent(term);
      });

      recentChips.appendChild(chip);
    });
  }

  clearRecentBtn.addEventListener('click', clearAllRecent);


  /* ==========================================================
     6. POPULAR SEARCHES
  ========================================================== */

  function renderPopularChips() {
    popularChips.innerHTML = '';
    POPULAR_SEARCHES.forEach(term => {
      const chip = document.createElement('button');
      chip.type      = 'button';
      chip.className = 'search-chip';
      chip.innerHTML = `
        <i class="fa-solid fa-fire" aria-hidden="true"></i>
        ${escapeHTML(term)}
      `;
      chip.addEventListener('click', () => triggerSearch(term));
      popularChips.appendChild(chip);
    });
  }


  /* ==========================================================
     7. CATEGORY GRID
  ========================================================== */

  function renderCategories() {
    categoryGrid.innerHTML = '';
    CATEGORIES.forEach(cat => {
      const tile = document.createElement('button');
      tile.type      = 'button';
      tile.className = 'category-tile';
      tile.innerHTML = `
        <span class="category-tile__emoji" aria-hidden="true">${cat.emoji}</span>
        <span class="category-tile__name">${cat.name}</span>
      `;
      tile.addEventListener('click', () => triggerSearch(cat.name));
      categoryGrid.appendChild(tile);
    });
  }


  /* ==========================================================
     8. SEARCH BAR — FOCUS, CLEAR, INPUT
  ========================================================== */

  // Auto-focus on page load
  searchInput.focus();

  searchInput.addEventListener('input', () => {
    const val = searchInput.value.trim();
    state.query = val;

    // Show / hide clear button
    if (val.length > 0) {
      clearBtn.removeAttribute('hidden');
    } else {
      clearBtn.setAttribute('hidden', '');
    }

    // Debounce — wait before running search
    clearTimeout(state.debounceTimer);

    if (val.length === 0) {
      // Back to default view
      showPanel('default');
      srFilters.setAttribute('hidden', '');
      return;
    }

    // Show live suggestions immediately
    renderSuggestions(val);
    srSuggestions.removeAttribute('hidden');

    // Debounced full search
    state.debounceTimer = setTimeout(() => {
      runSearch(val);
    }, DEBOUNCE_MS);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.query       = '';
    clearBtn.setAttribute('hidden', '');
    srSuggestions.setAttribute('hidden', '');
    srFilters.setAttribute('hidden', '');
    showPanel('default');
    searchInput.focus();
  });

  // Also search on Enter
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = searchInput.value.trim();
      if (val) runSearch(val);
    }
  });


  /* ==========================================================
     9. LIVE SUGGESTIONS — type-ahead as user types
  ========================================================== */

  function renderSuggestions(query) {
    const q       = query.toLowerCase();
    const matches = SUGGESTION_TERMS.filter(s =>
      s.term.toLowerCase().includes(q)
    ).slice(0, 6);

    srSuggestions.innerHTML = '';

    if (matches.length === 0) {
      srSuggestions.setAttribute('hidden', '');
      return;
    }

    matches.forEach(match => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.setAttribute('role', 'option');
      item.tabIndex  = 0;

      // Highlight matching portion of the term
      const highlighted = highlightMatch(match.term, query);

      item.innerHTML = `
        <div class="suggestion-item__icon" aria-hidden="true">${match.icon}</div>
        <div class="suggestion-item__text">
          <div class="suggestion-item__title">${highlighted}</div>
          <div class="suggestion-item__sub">${match.sub}</div>
        </div>
        <i class="fa-solid fa-arrow-up-left suggestion-item__arrow" aria-hidden="true"></i>
      `;

      item.addEventListener('click', () => {
        triggerSearch(match.term);
      });

      // Keyboard: Enter on suggestion
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerSearch(match.term);
      });

      srSuggestions.appendChild(item);
    });

    srSuggestions.removeAttribute('hidden');
  }


  /* ==========================================================
     10. FULL SEARCH — KEYWORD MATCH ENGINE
     -------------------------------------------------------
     FUTURE AI INTEGRATION POINT:
     Replace the `matchesQuery()` function below with a call to
     a Supabase Edge Function that runs an AI/semantic search.
     The rest of this function (grouping, filtering, rendering)
     stays exactly the same.

     Example future replacement:
       const { data } = await window._supabase.rpc('search_listings', {
         search_term: query,
         school_uuid: currentUserSchoolId,
       });
       state.results = data;
     -------------------------------------------------------
  ========================================================== */

  function runSearch(query) {
    srSuggestions.setAttribute('hidden', '');

    const q = query.toLowerCase().trim();

    // Save to recent searches
    saveRecent(query);

    // Filter all listings
    state.results = ALL_LISTINGS.filter(item => matchesQuery(item, q));

    // Apply type filter
    const filtered = applyFilters(state.results);

    // Show filters
    srFilters.removeAttribute('hidden');

    // Update results summary
    srQuery.textContent = `"${query}"`;
    srCount.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for`;

    if (filtered.length === 0) {
      emptyQuery.textContent = `"${query}"`;
      showPanel('empty');
      return;
    }

    renderResults(filtered);
    showPanel('results');
  }

  /** Returns true if a listing matches the search query */
  function matchesQuery(item, q) {
    // Check title, description, category, tags, seller name
    const searchable = [
      item.title,
      item.description,
      item.category,
      item.seller?.name,
      ...(item.tags || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchable.includes(q);
  }

  /** Apply active type filter and price filter */
  function applyFilters(results) {
    let filtered = [...results];

    // Type filter
    if (state.activeFilter !== 'all') {
      if (state.activeFilter === 'nearby') {
        // Sort by distance — for now, just show all (GPS not available on placeholder)
        // In production: filter by location_lat / location_lng proximity
        filtered = filtered;
      } else {
        filtered = filtered.filter(item => item.type === state.activeFilter);
      }
    }

    // Price filter
    if (state.priceMin !== null) {
      filtered = filtered.filter(item =>
        item.price !== null && item.price >= state.priceMin
      );
    }
    if (state.priceMax !== null) {
      filtered = filtered.filter(item =>
        item.price !== null && item.price <= state.priceMax
      );
    }

    return filtered;
  }

  /** Trigger a search from a chip or suggestion click */
  function triggerSearch(term) {
    searchInput.value = term;
    state.query       = term;
    clearBtn.removeAttribute('hidden');
    srSuggestions.setAttribute('hidden', '');
    runSearch(term);
    searchInput.focus();
  }


  /* ==========================================================
     11. FILTER CHIPS
  ========================================================== */

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Deselect all
      filterChips.forEach(c => {
        c.setAttribute('aria-pressed', 'false');
        c.classList.remove('filter-chip--active');
      });

      // Select this
      chip.setAttribute('aria-pressed', 'true');
      chip.classList.add('filter-chip--active');
      state.activeFilter = chip.dataset.filter;

      // Re-apply filters to current results
      if (state.query) {
        const filtered = applyFilters(state.results);
        srCount.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for`;

        if (filtered.length === 0) {
          emptyQuery.textContent = `"${state.query}"`;
          showPanel('empty');
          return;
        }

        renderResults(filtered);
        showPanel('results');
      }
    });
  });


  /* ==========================================================
     12. PRICE FILTER MODAL
  ========================================================== */

  priceFilterBtn.addEventListener('click', () => {
    priceModal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    priceMinInput.focus();
  });

  function closePriceModal() {
    priceModal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  priceModalBg.addEventListener('click', closePriceModal);

  priceApplyBtn.addEventListener('click', () => {
    state.priceMin = priceMinInput.value ? parseFloat(priceMinInput.value) : null;
    state.priceMax = priceMaxInput.value ? parseFloat(priceMaxInput.value) : null;

    // Update price chip label if filter active
    if (state.priceMin !== null || state.priceMax !== null) {
      priceFilterBtn.classList.add('filter-chip--active');
      priceFilterBtn.setAttribute('aria-pressed', 'true');
    }

    closePriceModal();

    // Re-run with price filter
    if (state.query) {
      const filtered = applyFilters(state.results);
      if (filtered.length === 0) {
        emptyQuery.textContent = `"${state.query}"`;
        showPanel('empty');
        return;
      }
      renderResults(filtered);
      showPanel('results');
    }
  });

  priceClearBtn.addEventListener('click', () => {
    state.priceMin     = null;
    state.priceMax     = null;
    priceMinInput.value = '';
    priceMaxInput.value = '';
    priceFilterBtn.classList.remove('filter-chip--active');
    priceFilterBtn.setAttribute('aria-pressed', 'false');
    document.querySelectorAll('.price-preset').forEach(p =>
      p.classList.remove('price-preset--active')
    );
    closePriceModal();
  });

  // Price presets
  document.querySelectorAll('.price-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.price-preset').forEach(p =>
        p.classList.remove('price-preset--active')
      );
      btn.classList.add('price-preset--active');
      priceMinInput.value = btn.dataset.min || '';
      priceMaxInput.value = btn.dataset.max || '';
    });
  });


  /* ==========================================================
     13. RENDER HELPERS
  ========================================================== */

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /** Wraps matching text in a <mark> tag for visual highlight */
  function highlightMatch(text, query) {
    if (!query) return escapeHTML(text);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex   = new RegExp(`(${escaped})`, 'gi');
    return escapeHTML(text).replace(regex, '<mark>$1</mark>');
  }

  function buildBadge(type, cls, text, icon) {
    return `<span class="badge badge--${cls}">
      <i class="${icon}" aria-hidden="true"></i> ${text}
    </span>`;
  }

  function buildResultCard(item, query) {
    const card = document.createElement('a');
    card.className = 'result-card';
    card.href      = `../listing/index.html?id=${item.id}`;
    card.setAttribute('aria-label', item.title);

    const typeLabelMap  = { product: 'Product', service: 'Service', request: 'Request', business: 'Business' };
    const typeBadgeMap  = { product: 'type', service: 'type-service', request: 'type-request', business: 'type-business' };
    const typeLabel     = typeLabelMap[item.type] || 'Listing';
    const typeCls       = typeBadgeMap[item.type]  || 'type';

    const highlightedTitle = highlightMatch(item.title, query);

    const avatarHTML = item.seller.avatar
      ? `<span class="result-card__seller-avatar"><img src="${item.seller.avatar}" alt="${escapeHTML(item.seller.name)}" /></span>`
      : `<span class="result-card__seller-avatar">${escapeHTML(item.seller.initials)}</span>`;

    card.innerHTML = `
      <div class="result-card__thumb">
        ${item.image
          ? `<img src="${item.image}" alt="${escapeHTML(item.title)}" loading="lazy" />`
          : `<div class="result-card__thumb-placeholder" aria-hidden="true">
               ${item.type === 'request' ? '📢' : item.type === 'service' ? '🛠️' : '📦'}
             </div>`
        }
      </div>
      <div class="result-card__content">
        <div class="result-card__badges">
          <span class="badge badge--${typeCls}">${typeLabel}</span>
          ${item.verified ? `<span class="badge badge--verified"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Verified</span>` : ''}
          ${item.pro      ? `<span class="badge badge--pro"><i class="fa-solid fa-crown" aria-hidden="true"></i> PRO</span>`         : ''}
        </div>
        <h3 class="result-card__title">${highlightedTitle}</h3>
        <p class="result-card__category">${escapeHTML(item.category)}</p>
        <p class="result-card__price">${escapeHTML(item.priceLabel || '—')}</p>
        <div class="result-card__meta">
          <span class="result-card__seller">
            ${avatarHTML}
            <span class="result-card__seller-name">${escapeHTML(item.seller.name)}</span>
          </span>
          ${item.distance
            ? `<span class="result-card__distance">
                 <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                 ${escapeHTML(item.distance)}
               </span>`
            : ''
          }
        </div>
      </div>
      <div class="result-card__action">
        <span class="result-card__view-btn" aria-hidden="true">
          <i class="fa-solid fa-arrow-right"></i>
        </span>
      </div>
    `;

    // Stagger animation
    card.style.opacity   = '0';
    card.style.transform = 'translateY(8px)';

    return card;
  }


  /* ==========================================================
     14. RESULTS RENDERING — GROUPED BY TYPE
  ========================================================== */

  const GROUP_CONFIG = [
    { type: 'product',  emoji: '📦', label: 'Products' },
    { type: 'service',  emoji: '🛠️', label: 'Services' },
    { type: 'request',  emoji: '📢', label: 'Requests' },
    { type: 'business', emoji: '🏪', label: 'Businesses' },
  ];

  function renderResults(results) {
    srResultsBody.innerHTML = '';

    // When filter is 'all', group by type
    if (state.activeFilter === 'all' || state.activeFilter === 'nearby') {
      GROUP_CONFIG.forEach(group => {
        const items = results.filter(r => r.type === group.type);
        if (items.length === 0) return;

        const section = document.createElement('div');
        section.className = 'result-group';

        section.innerHTML = `
          <div class="result-group__header">
            <h3 class="result-group__title">
              <span aria-hidden="true">${group.emoji}</span>
              ${group.label}
            </h3>
            <span class="result-group__count">${items.length}</span>
          </div>
          <div class="result-group__list" role="list" aria-label="${group.label} results"></div>
        `;

        const list = section.querySelector('.result-group__list');
        const cards = items.map(item => buildResultCard(item, state.query));
        cards.forEach(c => list.appendChild(c));

        srResultsBody.appendChild(section);

        // Stagger animate cards in
        requestAnimationFrame(() => {
          cards.forEach((card, i) => {
            setTimeout(() => {
              card.style.transition = 'opacity 300ms ease, transform 300ms ease';
              card.style.opacity    = '1';
              card.style.transform  = 'translateY(0)';
            }, i * 60);
          });
        });
      });

    } else {
      // Single type — flat list, no grouping
      const section = document.createElement('div');
      section.className = 'result-group';
      section.innerHTML = `<div class="result-group__list" role="list" aria-label="Results"></div>`;
      const list  = section.querySelector('.result-group__list');
      const cards = results.map(item => buildResultCard(item, state.query));
      cards.forEach(c => list.appendChild(c));
      srResultsBody.appendChild(section);

      requestAnimationFrame(() => {
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.style.transition = 'opacity 300ms ease, transform 300ms ease';
            card.style.opacity    = '1';
            card.style.transform  = 'translateY(0)';
          }, i * 50);
        });
      });
    }
  }


  /* ==========================================================
     15. BADGE CSS CLASSES — add missing ones dynamically
  ========================================================== */

  // Inject badge styles not already in search.css
  const extraStyles = document.createElement('style');
  extraStyles.textContent = `
    .badge {
      display: inline-flex; align-items: center; gap: 3px;
      font-family: var(--font-display); font-size: .5625rem;
      font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
      padding: 3px 8px; border-radius: 9999px; white-space: nowrap;
    }
    .badge--verified      { background: rgba(16,185,129,.12); border: 1px solid rgba(16,185,129,.3); color: #10B981; }
    .badge--pro           { background: rgba(245,158,11,.15); border: 1px solid rgba(245,158,11,.3); color: #FCD34D; }
    .badge--type          { background: rgba(124,58,237,.1); border: 1px solid rgba(124,58,237,.25); color: #A78BFA; }
    .badge--type-service  { background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.25); color: #93C5FD; }
    .badge--type-request  { background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.25); color: #F59E0B; }
    .badge--type-business { background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.25); color: #10B981; }
  `;
  document.head.appendChild(extraStyles);


  /* ==========================================================
     16. URL PARAMETER HANDLING
     Explore passes ?type=product or ?sort=trending
     via links on quick-action cards.
  ========================================================== */

  function handleURLParams() {
    const params = new URLSearchParams(window.location.search);
    const type   = params.get('type');
    const sort   = params.get('sort');
    const q      = params.get('q');

    if (q) {
      // Pre-fill search from URL
      searchInput.value = q;
      state.query = q;
      clearBtn.removeAttribute('hidden');
      runSearch(q);
      return;
    }

    if (type && type !== 'all') {
      // Activate the right filter chip
      filterChips.forEach(c => {
        const isMatch = c.dataset.filter === type;
        c.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
        c.classList.toggle('filter-chip--active', isMatch);
      });
      state.activeFilter = type;

      // Run a broad search for that type
      const typeLabelMap = {
        product:  'products',
        service:  'services',
        request:  'requests',
        business: 'businesses',
      };
      const searchTerm = typeLabelMap[type] || type;
      searchInput.value = '';
      state.query = '';

      // Show all of that type without a query filter
      state.results = ALL_LISTINGS.filter(i => i.type === type);
      const filtered = applyFilters(state.results);
      srFilters.removeAttribute('hidden');
      srCount.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''} of`;
      srQuery.textContent = typeLabelMap[type] || type;

      if (filtered.length === 0) {
        showPanel('empty');
        return;
      }

      renderResults(filtered);
      showPanel('results');
    }
  }


  /* ==========================================================
     17. INIT
  ========================================================== */

  function init() {
    renderRecentChips();
    renderPopularChips();
    renderCategories();
    showPanel('default');
    handleURLParams();

    // Focus search bar and select any existing text
    searchInput.focus();
    searchInput.select();
  }

  init();


/* ============================================================
   End of DOMContentLoaded
============================================================ */
});
