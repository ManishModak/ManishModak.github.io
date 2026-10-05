/**
 * Main portfolio interactions.
 *
 * Responsibilities:
 * - Render the work grid, timeline and lists from js/project-details.js.
 * - Play loop videos and visuals only while visible; hero stat count-up; copy email.
 * - Manage scroll reveal, active navigation, and smooth scrolling.
 * - Render the full-screen detail view without injecting untrusted text as HTML.
 * - Manage case study focus restoration, keyboard access, and history state.
 */
(function () {
  'use strict';

  const ICONS = {
    github: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
    demo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><polygon points="8.5 7.5 17.5 12 8.5 16.5 8.5 7.5"/></svg>',
    apple: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.21.12.31.12.87 0 1.98-.6 2.5-1.45z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>',
    details: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
  };

  const SELECTOR_FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const TRUE_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function createElement(tagName, options, children) {
    const element = document.createElement(tagName);
    const opts = options || {};

    if (opts.className) element.className = opts.className;
    if (opts.text != null) element.textContent = String(opts.text);
    if (opts.html != null) element.innerHTML = opts.html;

    if (opts.attrs) {
      Object.entries(opts.attrs).forEach(([key, value]) => {
        if (value == null || value === false) return;
        element.setAttribute(key, value === true ? '' : String(value));
      });
    }

    if (opts.dataset) {
      Object.entries(opts.dataset).forEach(([key, value]) => {
        if (value != null) element.dataset[key] = String(value);
      });
    }

    (children || []).forEach((child) => {
      if (child == null) return;
      element.append(child.nodeType ? child : document.createTextNode(String(child)));
    });

    return element;
  }

  function appendIcon(parent, iconName) {
    const icon = createElement('span', {
      className: 'inline-icon',
      html: ICONS[iconName] || ICONS.external,
      attrs: { 'aria-hidden': 'true' }
    });
    parent.append(icon);
  }

  function getSafeHref(url) {
    if (!url) return '#';

    try {
      const parsed = new URL(url, window.location.href);
      const allowed = ['http:', 'https:', 'mailto:'];
      if (allowed.includes(parsed.protocol)) return url;
    } catch (error) {
      return '#';
    }

    return '#';
  }

  function isTrueVideo(url) {
    const lower = String(url || '').toLowerCase().split(/[?#]/)[0];
    return TRUE_VIDEO_EXTENSIONS.some((extension) => lower.endsWith(extension));
  }

  function getDetail(id) {
    return window.PROJECT_DETAILS && window.PROJECT_DETAILS[id];
  }

  function getDetailHashId() {
    const hash = window.location.hash || '';
    return hash.startsWith('#detail/') ? decodeURIComponent(hash.slice('#detail/'.length)) : '';
  }

  function getCategoryLabel(category) {
    return category === 'experience' ? 'Experience' : 'Work';
  }

  function getCategoryAnchor(category) {
    return category === 'experience' ? '#experience' : '#work';
  }

  function createTextWithBreaks(text, className) {
    const fragment = document.createDocumentFragment();
    const paragraphs = String(text || '').split(/\n{2,}/).filter(Boolean);

    paragraphs.forEach((paragraph, paragraphIndex) => {
      const p = createElement('p', { className: className || 'detail-desc-text' });
      paragraph.split('\n').forEach((line, lineIndex) => {
        if (lineIndex > 0) p.append(createElement('br'));
        p.append(document.createTextNode(line));
      });
      fragment.append(p);
      if (paragraphIndex < paragraphs.length - 1) {
        fragment.append(createElement('span', { className: 'text-block-spacer', attrs: { 'aria-hidden': 'true' } }));
      }
    });

    return fragment;
  }

  function getFocusableElements(container) {
    return $$(SELECTOR_FOCUSABLE, container).filter((element) => {
      return !element.hasAttribute('disabled') && element.getClientRects().length > 0;
    });
  }

  function trapFocus(event, container) {
    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements(container);
    if (!focusable.length) {
      event.preventDefault();
      container.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function renderLinks(links, className) {
    const container = createElement('div', { className: className || 'tile-links' });
    (links || []).forEach((link) => {
      const anchor = createElement('a', {
        className: 'tile-link',
        attrs: { href: getSafeHref(link.url), target: '_blank', rel: 'noopener' }
      });
      appendIcon(anchor, link.icon || 'external');
      anchor.append(document.createTextNode(link.label));
      container.append(anchor);
    });
    return container;
  }

  function createDetailButton(id, label) {
    const detail = getDetail(id);
    const button = createElement('button', {
      className: 'tile-link tile-link--primary',
      attrs: {
        type: 'button',
        'data-detail-open': id,
        'aria-label': 'Open case study for ' + (detail ? detail.title : id)
      }
    });
    button.append(document.createTextNode(label));
    appendIcon(button, 'details');
    return button;
  }

  // Muted looping video that main.js plays only while it is on screen.
  function createLoopVideo(src, poster, fit) {
    const video = createElement('video', {
      className: 'tile-video tile-video--' + (fit || 'cover'),
      attrs: {
        src: src,
        poster: poster,
        loop: true,
        muted: true,
        playsinline: true,
        preload: 'none',
        'data-inview-play': true,
        'aria-hidden': 'true'
      }
    });
    video.muted = true;
    return video;
  }

  // Animated mock of a PCBuildSage answer: prompt, rule-checked parts, total.
  function createPcbsVisual() {
    // Illustrative build; prices add up to the total shown.
    const parts = [
      ['CPU', 'Ryzen 5 7600', '\u20b916,990'],
      ['GPU', 'RTX 4060 8GB', '\u20b927,990'],
      ['Board', 'B650M DDR5', '\u20b913,200'],
      ['RAM', '32GB DDR5 6000', '\u20b99,350'],
      ['PSU', '650W 80+ Gold', '\u20b96,450'],
      ['More', 'SSD, case, cooler', '\u20b913,797']
    ];
    const wrap = createElement('div', { className: 'pcbs', attrs: { 'aria-hidden': 'true' } });
    wrap.append(createElement('div', { className: 'pcbs-prompt', text: 'Quiet gaming PC under ₹90k, all in stock' }));
    const list = createElement('ul', { className: 'pcbs-parts' });
    parts.forEach(([kind, name, price]) => {
      list.append(createElement('li', null, [
        createElement('span', { className: 'pcbs-kind', text: kind }),
        createElement('span', { className: 'pcbs-name', text: name }),
        createElement('span', { className: 'pcbs-price', text: price }),
        createElement('span', { className: 'pcbs-check', text: '✓' })
      ]));
    });
    wrap.append(list);
    wrap.append(createElement('div', { className: 'pcbs-total' }, [
      createElement('span', { text: 'Socket · DDR5 · PSU headroom verified' }),
      createElement('strong', { text: '₹87,777' })
    ]));
    return wrap;
  }

  // Bar comparison for MobileSpec's decode speed result.
  function createMobilespecVisual() {
    const wrap = createElement('div', { className: 'mspec', attrs: { 'aria-hidden': 'true' } });
    wrap.append(createElement('div', { className: 'mspec-big' }, [
      createElement('span', { text: '2.07' }),
      createElement('small', { text: '× faster decode' })
    ]));
    [['Stock llama.cpp', '5.39 tok/s', 48], ['MobileSpec', '11.18 tok/s', 100]].forEach(([label, value, width]) => {
      const row = createElement('div', { className: 'mspec-row' });
      row.append(createElement('span', { className: 'mspec-label', text: label }));
      const bar = createElement('span', { className: 'mspec-bar' });
      bar.style.setProperty('--w', width + '%');
      row.append(bar, createElement('span', { className: 'mspec-value', text: value }));
      wrap.append(row);
    });
    return wrap;
  }

  function createTileVisual(visual) {
    const holder = createElement('div', { className: 'tile-visual tile-visual--' + (visual ? visual.type : 'none') });
    if (!visual) return holder;

    if (visual.type === 'video') {
      holder.append(createLoopVideo(visual.src, visual.poster, visual.fit));
    } else if (visual.type === 'youtube') {
      holder.append(createElement('img', {
        className: 'tile-thumb',
        attrs: { src: 'https://i.ytimg.com/vi/' + visual.id + '/hqdefault.jpg', alt: '', loading: 'lazy', decoding: 'async' }
      }));
    } else if (visual.type === 'pcbs') {
      holder.append(createPcbsVisual());
    } else if (visual.type === 'mobilespec') {
      holder.append(createMobilespecVisual());
    }
    return holder;
  }

  function renderWorkTile(item) {
    const hasDetail = Boolean(getDetail(item.id));
    const tile = createElement('article', {
      className: 'tile tile--' + (item.size || 'sm') + (hasDetail ? ' clickable-card' : ''),
      attrs: hasDetail
        ? { tabindex: '0', 'data-id': item.id, 'aria-label': 'Open case study for ' + item.title }
        : null
    });
    tile.addEventListener('pointermove', (event) => {
      const rect = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', event.clientX - rect.left + 'px');
      tile.style.setProperty('--my', event.clientY - rect.top + 'px');
    });

    tile.append(createTileVisual(item.visual));

    const body = createElement('div', { className: 'tile-body' });
    body.append(createElement('span', { className: 'tile-kicker', text: item.kicker }));
    body.append(createElement('h3', { className: 'tile-title', text: item.title }));
    if (item.metric) {
      body.append(createElement('p', { className: 'tile-metric' }, [
        createElement('strong', { text: item.metric.value }),
        ' ' + item.metric.label
      ]));
    }
    body.append(createElement('p', { className: 'tile-desc', text: item.summary }));

    if (item.tags && item.tags.length) {
      body.append(createElement('p', { className: 'tile-stack', text: item.tags.join(' \u00b7 ') }));
    }

    const links = renderLinks(item.links);
    if (hasDetail) links.append(createDetailButton(item.id, 'Case study'));
    body.append(links);

    tile.append(body);
    return tile;
  }

  // One editorial row per role: dates on the left, role, points and stack on the right.
  function renderRole(meta, title, org, orgUrl, points, stack, current) {
    const row = createElement('li', { className: 'role' + (current ? ' role--current' : '') });
    row.append(createElement('span', { className: 'role-date', text: meta }));

    const main = createElement('div', { className: 'role-main' });
    const heading = createElement('h3', { className: 'role-title', text: title });
    const orgEl = orgUrl
      ? createElement('a', { className: 'role-org', text: org, attrs: { href: getSafeHref(orgUrl), target: '_blank', rel: 'noopener' } })
      : createElement('span', { className: 'role-org', text: org });
    main.append(heading, orgEl);

    if (points && points.length) {
      const list = createElement('ul', { className: 'role-points' });
      points.forEach((point) => list.append(createElement('li', { text: point })));
      main.append(list);
    }
    if (stack && stack.length) {
      main.append(createElement('p', { className: 'role-stack', text: stack.join(' \u00b7 ') }));
    }
    row.append(main);
    return row;
  }

  function renderTimelineItem(item) {
    return renderRole(item.duration, item.role, item.organization, item.organizationUrl, item.points, item.tags, item.current);
  }

  function renderEducation(edu) {
    return renderRole(edu.duration, edu.degree, edu.school + ' \u00b7 ' + edu.note, null, null, null, false);
  }

  function renderMoreBuild(item) {
    const anchor = createElement('a', {
      className: 'more-item',
      attrs: { href: getSafeHref(item.url), target: '_blank', rel: 'noopener' }
    });
    const text = createElement('div');
    text.append(createElement('span', { className: 'more-name', text: item.title }));
    text.append(createElement('span', { className: 'more-desc', text: item.description }));
    const label = createElement('span', { className: 'more-label', text: item.label });
    appendIcon(label, 'external');
    anchor.append(text, label);
    return anchor;
  }

  function renderDataDrivenContent() {
    const data = window.PORTFOLIO_DATA;
    if (!data) return;

    const grid = $('#work-grid');
    const timeline = $('#timeline');
    const more = $('#more-builds');

    if (grid) grid.replaceChildren(...data.projects.map(renderWorkTile));
    if (timeline) {
      timeline.replaceChildren(...data.experience.map(renderTimelineItem));
      if (data.education) timeline.append(renderEducation(data.education));
    }
    if (more) more.replaceChildren(...data.moreBuilds.map(renderMoreBuild));
  }
  function initScrollReveal() {
    const elements = $$('.reveal');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('revealed', entry.isIntersecting);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    elements.forEach((element, index) => {
      element.style.transitionDelay = (index % 3) * 80 + 'ms';
      observer.observe(element);
    });
  }

  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#' || targetId.startsWith('#detail/')) return;

        const target = document.querySelector(targetId);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function initNavScroll() {
    const nav = $('.nav');
    if (!nav) return;

    let ticking = false;

    function updateNav() {
      nav.classList.toggle('nav--scrolled', window.scrollY > 80);
      ticking = false;
    }

    updateNav();
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateNav);
    }, { passive: true });
  }

  // Children of [data-stagger] fade in one after another when the group enters view.
  function initStagger() {
    const groups = $$('[data-stagger]');
    if (!('IntersectionObserver' in window)) {
      groups.forEach((group) => group.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        Array.from(entry.target.children).forEach((child, index) => {
          child.style.transitionDelay = Math.min(index, 10) * 70 + 'ms';
        });
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });

    groups.forEach((group) => observer.observe(group));
  }

  // Plays muted loop videos and CSS visuals only while they are visible.
  function initInViewMedia() {
    const items = $$('[data-inview-play], .tile-visual--pcbs, .tile-visual--mobilespec');
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        el.classList.toggle('is-playing', entry.isIntersecting);
        if (el.tagName !== 'VIDEO') return;
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      });
    }, { threshold: 0.25 });

    items.forEach((item) => observer.observe(item));
  }

  // Counts hero stats up from zero once. Values keep their prefix and suffix, e.g. "7k+".
  function initCountUp() {
    const stats = $$('[data-count]');
    if (!stats.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    stats.forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = (el.dataset.count.split('.')[1] || '').length;
      const suffix = el.dataset.suffix || '';
      const start = performance.now();
      const duration = 1400;

      function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  function initCopyEmail() {
    $$('[data-copy]').forEach((button) => {
      button.addEventListener('click', () => {
        const value = button.dataset.copy;
        const done = () => {
          button.classList.add('copied');
          button.setAttribute('aria-label', 'Copied');
          window.setTimeout(() => {
            button.classList.remove('copied');
            button.setAttribute('aria-label', 'Copy email address');
          }, 1600);
        };
        if (navigator.clipboard) {
          navigator.clipboard.writeText(value).then(done, () => {});
        }
      });
    });
  }
  function initActiveNav() {
    const sections = $$('section[id], .scroll-section[id]');
    const navLinks = $$('.nav-link');
    if (!sections.length || !navLinks.length) return;

    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        navLinks.forEach((link) => link.classList.remove('nav-link--active'));
        const activeLink = $('.nav-link[href="#' + visible.target.id + '"]');
        if (activeLink) activeLink.classList.add('nav-link--active');
      },
      { threshold: [0.15, 0.3, 0.6], rootMargin: '-90px 0px -45% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function initDetailPage() {
    const detailPage = $('#detail-page');
    const detailBody = $('#detail-body');
    const detailBack = $('#detail-back');
    const breadcrumbs = $('#detail-breadcrumbs');
    const contentWrapper = $('.content-wrapper');

    if (!detailPage || !detailBody || !detailBack || !breadcrumbs) return;

    let currentDetailId = '';
    let savedScrollY = 0;
    let savedHash = '';
    let previouslyFocused = null;

    function renderBreadcrumbs(detail) {
      const categoryLabel = getCategoryLabel(detail.category);
      const categoryAnchor = getCategoryAnchor(detail.category);

      const home = createElement('a', { text: 'Portfolio', attrs: { href: '#' } });
      const category = createElement('a', { text: categoryLabel, attrs: { href: categoryAnchor } });
      const current = createElement('span', { className: 'breadcrumb-current', text: detail.title });

      const homeWrapper = createElement('span', { className: 'breadcrumb-item' }, [home]);
      const categoryWrapper = createElement('span', { className: 'breadcrumb-item' }, [category]);
      const separatorA = createElement('span', { className: 'breadcrumb-separator', text: '\u203a', attrs: { 'aria-hidden': 'true' } });
      const separatorB = createElement('span', { className: 'breadcrumb-separator', text: '\u203a', attrs: { 'aria-hidden': 'true' } });

      breadcrumbs.replaceChildren(homeWrapper, separatorA, categoryWrapper, separatorB, current);

      home.addEventListener('click', (event) => {
        event.preventDefault();
        closeDetail({ restoreUrl: true, restoreFocus: true });
      });

      category.addEventListener('click', (event) => {
        event.preventDefault();
        closeDetail({ restoreUrl: true, restoreFocus: false });
        window.setTimeout(() => {
          const target = document.querySelector(categoryAnchor);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      });
    }

    // Case study layout: header + meta, key numbers, media stage, split sections, next link.
    function renderMeta(detail) {
      const meta = createElement('dl', { className: 'cs-meta' });
      const add = (label, value) => {
        if (!value) return;
        const cell = createElement('div', { className: 'cs-meta-item' });
        cell.append(createElement('dt', { text: label }));
        const dd = createElement('dd');
        dd.append(value.nodeType ? value : document.createTextNode(value));
        cell.append(dd);
        meta.append(cell);
      };

      add('Timeline', detail.duration);
      add('Stack', (detail.tags || []).join(', '));
      if (detail.links && detail.links.length) {
        const links = createElement('span', { className: 'cs-meta-links' });
        detail.links.forEach((link) => {
          const anchor = createElement('a', {
            attrs: { href: getSafeHref(link.url), target: '_blank', rel: 'noopener' }
          });
          anchor.append(document.createTextNode(link.label));
          appendIcon(anchor, 'external');
          links.append(anchor);
        });
        add('Links', links);
      }
      return meta;
    }

    function renderHighlights(highlights) {
      const row = createElement('dl', { className: 'cs-highlights' });
      highlights.forEach((item) => {
        const cell = createElement('div', { className: 'cs-highlight' });
        cell.append(createElement('dd', { text: item.value }), createElement('dt', { text: item.label }));
        row.append(cell);
      });
      return row;
    }

    function createStageMedia(item) {
      if (isTrueVideo(item.url)) {
        const video = createElement('video', {
          attrs: { src: item.url, poster: item.poster, controls: true, autoplay: true, muted: true, loop: true, playsinline: true, preload: 'metadata' }
        });
        video.muted = true;
        return video;
      }
      return createElement('img', { attrs: { src: item.url, alt: item.caption || '', decoding: 'async' } });
    }

    // One large viewer; thumbnails underneath swap what it shows.
    function renderStage(media) {
      const wrapper = createElement('section', { className: 'cs-stage', attrs: { 'aria-label': 'Demos and media' } });
      const screen = createElement('div', { className: 'cs-stage-screen' });
      const caption = createElement('p', { className: 'cs-stage-caption' });
      wrapper.append(screen, caption);

      const thumbs = media.length > 1 ? createElement('div', { className: 'cs-thumbs', attrs: { role: 'tablist' } }) : null;

      function show(index) {
        const item = media[index];
        screen.replaceChildren(createStageMedia(item));
        caption.textContent = item.caption || '';
        if (!thumbs) return;
        Array.from(thumbs.children).forEach((thumb, i) => {
          thumb.classList.toggle('active', i === index);
          thumb.setAttribute('aria-selected', i === index ? 'true' : 'false');
        });
      }

      if (thumbs) {
        media.forEach((item, index) => {
          const thumb = createElement('button', {
            className: 'cs-thumb',
            attrs: { type: 'button', role: 'tab', 'aria-label': 'Show: ' + (item.caption || 'media ' + (index + 1)) }
          });
          if (item.poster) {
            thumb.append(createElement('img', { attrs: { src: item.poster, alt: '', loading: 'lazy' } }));
          } else if (isTrueVideo(item.url)) {
            const preview = createElement('video', { attrs: { src: item.url + '#t=1', muted: true, playsinline: true, preload: 'metadata' } });
            preview.muted = true;
            thumb.append(preview);
          } else {
            thumb.append(createElement('img', { attrs: { src: item.url, alt: '', loading: 'lazy' } }));
          }
          thumb.append(createElement('span', { text: item.caption || '' }));
          thumb.addEventListener('click', () => show(index));
          thumbs.append(thumb);
        });
        wrapper.append(thumbs);
      }

      show(0);
      return wrapper;
    }

    function renderDetailSection(section) {
      const wrapper = createElement('section', { className: 'cs-section' });
      wrapper.append(createElement('h2', { className: 'cs-section-title', text: section.title }));
      const body = createElement('div', { className: 'cs-section-body' });

      if (Array.isArray(section.items) && section.items.length) {
        const list = createElement('ul', { className: 'cs-list' });
        section.items.forEach((item) => list.append(createElement('li', { text: item })));
        body.append(list);
      }
      if (section.body) {
        body.append(createTextWithBreaks(section.body, 'cs-text'));
      }
      wrapper.append(body);
      return wrapper;
    }

    // Case studies in the order they appear in the work grid.
    function getNextDetail(id) {
      const ids = window.PORTFOLIO_DATA.projects.map((item) => item.id).filter((itemId) => getDetail(itemId));
      const next = ids[(ids.indexOf(id) + 1) % ids.length];
      return next && next !== id ? getDetail(next) : null;
    }

    function renderNext(detail) {
      const next = getNextDetail(detail.id);
      if (!next) return null;
      const button = createElement('button', {
        className: 'cs-next',
        attrs: { type: 'button', 'data-detail-open': next.id }
      });
      button.append(
        createElement('span', { className: 'cs-next-label', text: 'Next case study' }),
        createElement('span', { className: 'cs-next-title', text: next.title }),
        createElement('span', { className: 'cs-next-sub', text: next.subtitle })
      );
      appendIcon(button, 'details');
      return button;
    }

    function renderDetailContent(detail) {
      const content = createElement('article', { className: 'cs' });

      const header = createElement('header', { className: 'cs-header' });
      if (detail.subtitle) header.append(createElement('p', { className: 'cs-kicker', text: detail.subtitle }));
      header.append(createElement('h1', { className: 'cs-title', text: detail.title, attrs: { id: 'detail-title' } }));
      if (detail.description) header.append(createElement('p', { className: 'cs-lead', text: detail.description }));
      header.append(renderMeta(detail));
      content.append(header);

      if (Array.isArray(detail.highlights) && detail.highlights.length) {
        content.append(renderHighlights(detail.highlights));
      }
      if (detail.media && detail.media.length) {
        content.append(renderStage(detail.media));
      }

      (detail.sections || []).forEach((section) => content.append(renderDetailSection(section)));

      const next = renderNext(detail);
      if (next) content.append(next);
      return content;
    }

    function openDetail(id, options) {
      const detail = getDetail(id);
      if (!detail) return;

      const opts = Object.assign({ pushHistory: true }, options || {});
      const wasOpen = Boolean(currentDetailId);

      if (!wasOpen) {
        savedScrollY = window.scrollY;
        savedHash = window.location.hash && !window.location.hash.startsWith('#detail/') ? window.location.hash : '';
        previouslyFocused = document.activeElement;
      }

      currentDetailId = id;
      renderBreadcrumbs(detail);
      detailBody.replaceChildren(renderDetailContent(detail));
      detailBody.scrollTop = 0;

      document.body.classList.add('detail-open');
      detailPage.classList.add('detail--active');
      detailPage.setAttribute('aria-hidden', 'false');
      if (contentWrapper) contentWrapper.setAttribute('inert', '');

      if (opts.pushHistory) {
        // Moving between case studies replaces the entry so Back still returns to the page.
        const method = wasOpen ? 'replaceState' : 'pushState';
        history[method]({ detailId: id }, '', '#detail/' + encodeURIComponent(id));
      }

      requestAnimationFrame(() => {
        detailBack.focus({ preventScroll: true });
      });
    }

    function closeDetail(options) {
      if (!currentDetailId) return;

      const opts = Object.assign({ restoreUrl: true, restoreFocus: true }, options || {});
      const focusTarget = previouslyFocused;

      currentDetailId = '';
      $$('video', detailBody).forEach((video) => video.pause());
      detailPage.classList.remove('detail--active');
      detailPage.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('detail-open');
      if (contentWrapper) contentWrapper.removeAttribute('inert');

      if (opts.restoreUrl && window.location.hash.startsWith('#detail/')) {
        const cleanUrl = window.location.pathname + window.location.search + (savedHash || '');
        history.replaceState(null, '', cleanUrl);
      }

      requestAnimationFrame(() => {
        window.scrollTo(0, savedScrollY);
        if (opts.restoreFocus && focusTarget && typeof focusTarget.focus === 'function') {
          focusTarget.focus({ preventScroll: true });
        }
      });
    }

    function isInteractiveClick(event) {
      return Boolean(event.target.closest('a, button'));
    }

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-detail-open]');
      if (trigger) {
        event.preventDefault();
        event.stopPropagation();
        openDetail(trigger.getAttribute('data-detail-open'));
        return;
      }

      const card = event.target.closest('.clickable-card');
      if (!card || isInteractiveClick(event)) return;

      openDetail(card.getAttribute('data-id'));
    });

    document.addEventListener('keydown', (event) => {
      const card = event.target.closest('.clickable-card');
      if (!card || event.target !== card) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;

      event.preventDefault();
      openDetail(card.getAttribute('data-id'));
    });

    detailBack.addEventListener('click', () => closeDetail({ restoreUrl: true, restoreFocus: true }));

    window.addEventListener('keydown', (event) => {
      if (!currentDetailId) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeDetail({ restoreUrl: true, restoreFocus: true });
      } else {
        trapFocus(event, detailPage);
      }
    });

    window.addEventListener('popstate', () => {
      const id = getDetailHashId();
      if (id && getDetail(id)) {
        openDetail(id, { pushHistory: false });
      } else if (currentDetailId) {
        closeDetail({ restoreUrl: false, restoreFocus: true });
      }
    });

    const initialId = getDetailHashId();
    if (initialId && getDetail(initialId)) {
      openDetail(initialId, { pushHistory: false });
    }
  }

  function init() {
    renderDataDrivenContent();
    initScrollReveal();
    initSmoothScroll();
    initNavScroll();
    initStagger();
    initInViewMedia();
    initCountUp();
    initCopyEmail();
    initActiveNav();
    initDetailPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
