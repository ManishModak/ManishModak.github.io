/**
 * Main portfolio interactions.
 *
 * Responsibilities:
 * - Render data-driven cards from js/project-details.js.
 * - Manage scroll reveal, active navigation, and smooth scrolling.
 * - Render the full-screen detail view without injecting untrusted text as HTML.
 * - Manage media lightbox, focus restoration, keyboard access, and history state.
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

  const VIDEO_EXTENSIONS = ['.gif', '.mp4', '.webm', '.mov'];
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

  function isVideoLike(url) {
    const lower = String(url || '').toLowerCase().split(/[?#]/)[0];
    return VIDEO_EXTENSIONS.some((extension) => lower.endsWith(extension));
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
    return category === 'experience' ? 'Experience' : 'Projects';
  }

  function getCategoryAnchor(category) {
    return category === 'experience' ? '#experience' : '#projects';
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

  function renderCardLinks(links, detail, options) {
    const container = createElement('div', { className: 'project-links' });
    const opts = options || {};

    (links || []).forEach((link) => {
      const anchor = createElement('a', {
        className: 'project-link',
        attrs: {
          href: getSafeHref(link.url),
          target: '_blank',
          rel: 'noopener'
        }
      });
      appendIcon(anchor, link.icon || 'external');
      anchor.append(document.createTextNode(link.label));
      container.append(anchor);
    });

    const media = detail && Array.isArray(detail.media) ? detail.media : [];
    const hasVideos = media.some((item) => isVideoLike(item.url));
    const hasImages = media.some((item) => !isVideoLike(item.url));

    if (opts.includeMediaTags && hasVideos) {
      container.append(createDetailButton(detail.id, 'Demos', 'video', 'detail-media-tag'));
    }
    if (opts.includeMediaTags && hasImages) {
      container.append(createDetailButton(detail.id, 'Screenshots', 'image', 'detail-media-tag'));
    }

    container.append(createDetailButton(detail.id, 'Details', 'details'));
    return container;
  }

  function createDetailButton(id, label, iconName, extraClassName) {
    const detail = getDetail(id);
    const button = createElement('button', {
      className: ['project-link', 'detail-open-link', extraClassName].filter(Boolean).join(' '),
      attrs: {
        type: 'button',
        'data-detail-open': id,
        'aria-label': 'Open details for ' + (detail ? detail.title : id)
      }
    });
    appendIcon(button, iconName || 'details');
    button.append(document.createTextNode(label));
    return button;
  }

  function renderExperienceCard(item) {
    const detail = getDetail(item.id);
    const card = createElement('article', {
      className: 'experience-card clickable-card',
      attrs: {
        tabindex: '0',
        'data-id': item.id,
        'aria-label': 'Open details for ' + item.role
      }
    });

    const header = createElement('div', { className: 'experience-header' });
    const titleGroup = createElement('div');
    titleGroup.append(createElement('h3', { className: 'experience-role', text: item.role }));

    if (item.organizationUrl) {
      titleGroup.append(createElement('a', {
        className: 'experience-company',
        text: item.organization,
        attrs: { href: getSafeHref(item.organizationUrl), target: '_blank', rel: 'noopener' }
      }));
    } else {
      titleGroup.append(createElement('span', { className: 'experience-company', text: item.organization }));
    }

    header.append(titleGroup, createElement('span', { className: 'experience-duration', text: item.duration }));
    card.append(header);
    card.append(createElement('p', { className: 'experience-desc', text: item.summary }));
    card.append(renderCardLinks(item.links || [], detail, { includeMediaTags: false }));

    return card;
  }

  function renderProjectCard(item) {
    const detail = getDetail(item.id);
    const card = createElement('article', {
      className: 'project-card clickable-card',
      attrs: {
        tabindex: '0',
        'data-id': item.id,
        'aria-label': 'Open details for ' + item.title
      }
    });

    const header = createElement('div', { className: 'project-header' });
    const primaryLink = (item.links || []).find((link) => link.icon === 'github') || (item.links || [])[0];

    if (primaryLink) {
      header.append(createElement('a', {
        className: 'project-name',
        text: item.title,
        attrs: { href: getSafeHref(primaryLink.url), target: '_blank', rel: 'noopener' }
      }));
    } else {
      header.append(createElement('h3', { className: 'project-name', text: item.title }));
    }

    if (item.badge) {
      header.append(createElement('span', { className: 'project-badge', text: item.badge }));
    }

    card.append(header);
    card.append(createElement('p', { className: 'project-desc', text: item.summary }));
    card.append(renderCardLinks(item.links || [], detail, { includeMediaTags: true }));

    return card;
  }

  function renderOtherProject(item) {
    const anchor = createElement('a', {
      className: 'other-project-item',
      attrs: { href: getSafeHref(item.url), target: '_blank', rel: 'noopener' }
    });

    const textWrap = createElement('div');
    textWrap.append(createElement('div', { className: 'other-project-name', text: item.title }));
    textWrap.append(createElement('div', { className: 'other-project-desc', text: item.description }));

    const icon = createElement('span', { className: 'other-project-link' });
    appendIcon(icon, 'external');

    anchor.append(textWrap, icon);
    return anchor;
  }

  function renderDataDrivenContent() {
    const data = window.PORTFOLIO_DATA;
    if (!data) return;

    const experienceList = $('#experience-list');
    const projectGrid = $('#project-grid');
    const otherProjects = $('#other-projects-list');

    if (experienceList) {
      experienceList.replaceChildren(...data.experience.map(renderExperienceCard));
    }
    if (projectGrid) {
      projectGrid.replaceChildren(...data.projects.map(renderProjectCard));
    }
    if (otherProjects) {
      otherProjects.replaceChildren(...data.otherProjects.map(renderOtherProject));
    }
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

  function revealGroupChildren(group) {
    const cards = $$('.experience-card, .project-card, .other-project-item', group);
    cards.forEach((card, index) => {
      card.style.transitionDelay = index * 90 + 'ms';
      card.classList.add('revealed');
    });
  }

  function initStaggerCards() {
    const groups = $$('.experience-list, .project-grid, .other-projects');
    if (!groups.length) return;

    if (!('IntersectionObserver' in window)) {
      groups.forEach(revealGroupChildren);
      return;
    }

    groups.forEach((group) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const cards = $$('.experience-card, .project-card, .other-project-item', entry.target);
            if (entry.isIntersecting) {
              cards.forEach((card, index) => {
                card.style.transitionDelay = index * 90 + 'ms';
                card.classList.add('revealed');
              });
            } else {
              cards.forEach((card) => {
                card.style.transitionDelay = '';
                card.classList.remove('revealed');
              });
            }
          });
        },
        { threshold: 0.05 }
      );
      observer.observe(group);
    });
  }

  function initTechStagger() {
    const container = $('.tech-pills');
    if (!container) return;

    if (!('IntersectionObserver' in window)) {
      $$('.tech-pill', container).forEach((pill) => pill.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pills = $$('.tech-pill', entry.target);
          if (entry.isIntersecting) {
            pills.forEach((pill, index) => {
              pill.style.transitionDelay = index * 55 + 'ms';
              pill.classList.add('revealed');
            });
          } else {
            pills.forEach((pill) => {
              pill.style.transitionDelay = '';
              pill.classList.remove('revealed');
            });
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(container);
  }

  function initScrollIndicator() {
    const indicator = $('.scroll-indicator');
    if (!indicator) return;

    let ticking = false;

    function updateIndicator() {
      indicator.style.opacity = String(Math.max(0, 1 - window.scrollY / 300));
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateIndicator);
    }, { passive: true });
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

    function renderDetailSection(section) {
      const wrapper = createElement('section', { className: 'detail-body-section' });
      wrapper.append(createElement('h2', { className: 'detail-section-title', text: section.title }));

      if (Array.isArray(section.items) && section.items.length) {
        const list = createElement('ul', { className: 'detail-features' });
        section.items.forEach((item) => list.append(createElement('li', { text: item })));
        wrapper.append(list);
      }

      if (section.body) {
        wrapper.append(createTextWithBreaks(section.body, 'detail-desc-text'));
      }

      return wrapper;
    }

    function renderMediaItem(item, globalIndex) {
      const url = item.url || '';
      const caption = item.caption || 'Project media';
      const trueVideo = isTrueVideo(url);
      const button = createElement('button', {
        className: 'detail-gallery-item',
        attrs: {
          type: 'button',
          'data-media-index': globalIndex,
          'data-src': url,
          'data-kind': trueVideo ? 'video' : 'image',
          'data-caption': caption,
          'aria-label': 'Open media preview: ' + caption
        }
      });

      if (trueVideo) {
        const video = createElement('video', {
          attrs: {
            src: url,
            autoplay: true,
            loop: true,
            muted: true,
            playsinline: true,
            preload: 'metadata'
          }
        });
        video.muted = true;
        button.append(video);
      } else {
        button.append(createElement('img', {
          attrs: {
            src: url,
            alt: caption,
            loading: 'lazy',
            decoding: 'async'
          }
        }));
      }

      button.append(createElement('span', { className: 'detail-gallery-caption', text: caption }));
      return button;
    }

    function renderMediaSection(title, items, offset) {
      const wrapper = createElement('section', { className: 'detail-body-section detail-media-section' });
      wrapper.append(createElement('h2', { className: 'detail-section-title', text: title }));

      const scroller = createElement('div', { className: 'detail-gallery detail-gallery-scroll' });
      items.forEach((item, index) => scroller.append(renderMediaItem(item, offset + index)));
      wrapper.append(scroller);
      return wrapper;
    }

    function renderDetailLinks(links) {
      const wrapper = createElement('section', { className: 'detail-body-section' });
      wrapper.append(createElement('h2', { className: 'detail-section-title', text: 'Links' }));

      const linkWrap = createElement('div', { className: 'detail-links' });
      links.forEach((link) => {
        const anchor = createElement('a', {
          className: 'detail-btn',
          attrs: {
            href: getSafeHref(link.url),
            target: '_blank',
            rel: 'noopener'
          }
        });
        appendIcon(anchor, link.icon || 'external');
        anchor.append(document.createTextNode(link.label));
        linkWrap.append(anchor);
      });
      wrapper.append(linkWrap);
      return wrapper;
    }

    function renderDetailContent(detail) {
      const content = createElement('div', { className: 'detail-content-inner' });

      const hero = createElement('header', { className: 'detail-hero' });
      const meta = createElement('div', { className: 'detail-meta' });
      if (detail.duration) meta.append(createElement('span', { className: 'detail-duration', text: detail.duration }));
      hero.append(meta);
      hero.append(createElement('h1', { className: 'detail-title', text: detail.title, attrs: { id: 'detail-title' } }));
      if (detail.subtitle) hero.append(createElement('span', { className: 'detail-company', text: detail.subtitle }));

      if (Array.isArray(detail.tags) && detail.tags.length) {
        const tags = createElement('div', { className: 'detail-tags' });
        detail.tags.forEach((tag) => tags.append(createElement('span', { className: 'detail-tag', text: tag })));
        hero.append(tags);
      }
      content.append(hero);

      const media = Array.isArray(detail.media) ? detail.media : [];
      const demos = media.filter((item) => isVideoLike(item.url));
      const screenshots = media.filter((item) => !isVideoLike(item.url));

      if (demos.length) content.append(renderMediaSection('Video Demos', demos, 0));
      if (screenshots.length) content.append(renderMediaSection('Screenshots and Assets', screenshots, demos.length));

      if (detail.description) {
        const summary = createElement('section', { className: 'detail-body-section' });
        summary.append(createTextWithBreaks(detail.description, 'detail-desc-text'));
        content.append(summary);
      }

      (detail.sections || []).forEach((section) => content.append(renderDetailSection(section)));

      if (Array.isArray(detail.links) && detail.links.length) {
        content.append(renderDetailLinks(detail.links));
      }

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
        history.pushState({ detailId: id }, '', '#detail/' + encodeURIComponent(id));
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
      if (!currentDetailId || $('.media-lightbox.lightbox--active')) return;

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

  function initLightbox() {
    const lightbox = $('#media-lightbox');
    const lightboxMedia = $('#lightbox-media');
    const lightboxCaption = $('#lightbox-caption');
    const lightboxCounter = $('#lightbox-counter');
    const lightboxClose = $('#lightbox-close');
    const lightboxPrev = $('#lightbox-prev');
    const lightboxNext = $('#lightbox-next');
    const detailBody = $('#detail-body');

    if (!lightbox || !lightboxMedia || !lightboxCaption || !lightboxCounter || !detailBody) return;

    let currentItems = [];
    let currentIndex = 0;
    let previouslyFocused = null;

    function getMediaItems() {
      return $$('.detail-gallery-item', detailBody).map((item) => ({
        src: item.getAttribute('data-src'),
        kind: item.getAttribute('data-kind'),
        caption: item.getAttribute('data-caption') || ''
      }));
    }

    function renderLightboxItem() {
      if (!currentItems.length) return;

      const item = currentItems[currentIndex];
      const isVideo = item.kind === 'video';
      const media = isVideo
        ? createElement('video', { attrs: { src: item.src, autoplay: true, loop: true, muted: true, playsinline: true, controls: true } })
        : createElement('img', { attrs: { src: item.src, alt: item.caption || 'Project media' } });

      if (isVideo) media.muted = true;

      lightboxMedia.replaceChildren(media);
      lightboxCaption.textContent = item.caption;
      lightboxCounter.textContent = currentIndex + 1 + ' / ' + currentItems.length;
      lightboxPrev.hidden = currentItems.length <= 1;
      lightboxNext.hidden = currentItems.length <= 1;
    }

    function openLightbox(index) {
      currentItems = getMediaItems();
      if (!currentItems.length) return;

      currentIndex = Math.max(0, Math.min(index, currentItems.length - 1));
      previouslyFocused = document.activeElement;
      renderLightboxItem();

      document.body.classList.add('lightbox-open');
      lightbox.classList.add('lightbox--active');
      lightbox.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => lightboxClose.focus({ preventScroll: true }));
    }

    function closeLightbox() {
      if (!lightbox.classList.contains('lightbox--active')) return;

      lightbox.classList.remove('lightbox--active');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      lightboxMedia.replaceChildren();

      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus({ preventScroll: true });
      }
    }

    function nextItem() {
      if (currentItems.length <= 1) return;
      currentIndex = (currentIndex + 1) % currentItems.length;
      renderLightboxItem();
    }

    function previousItem() {
      if (currentItems.length <= 1) return;
      currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
      renderLightboxItem();
    }

    detailBody.addEventListener('click', (event) => {
      const item = event.target.closest('.detail-gallery-item');
      if (!item) return;

      event.preventDefault();
      openLightbox(Number(item.getAttribute('data-media-index')) || 0);
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', previousItem);
    lightboxNext.addEventListener('click', nextItem);

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    window.addEventListener('keydown', (event) => {
      if (!lightbox.classList.contains('lightbox--active')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextItem();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previousItem();
      } else {
        trapFocus(event, lightbox);
      }
    });
  }

  function init() {
    renderDataDrivenContent();
    initScrollReveal();
    initSmoothScroll();
    initNavScroll();
    initStaggerCards();
    initTechStagger();
    initScrollIndicator();
    initActiveNav();
    initDetailPage();
    initLightbox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
