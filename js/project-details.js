/**
 * Central portfolio content source.
 *
 * main.js renders the work grid, experience timeline, "more builds" list and
 * the full-screen detail pages from this file, so content lives in one place.
 *
 * Project fields:
 * - size: bento tile size ('xl' 2x2, 'wide' 2x1, 'sm' 1x1).
 * - visual: what the tile shows ({ type: 'video' | 'youtube' | 'pcbs' | 'mobilespec' }).
 * - metric: optional headline number shown on the tile.
 * - detail: optional full-screen case study; tiles without one link out instead.
 */
(function () {
  'use strict';

  const YT = (id) => 'https://youtu.be/' + id;

  const PORTFOLIO_DATA = {
    experience: [
      {
        id: 'ourora',
        role: 'Founding Engineer',
        organization: 'Ourora Expressions',
        organizationUrl: 'https://ourora.in',
        duration: 'Feb 2026 – Present',
        current: true,
        points: [
          'Took the Flutter and Node.js codebase from alpha to production on iOS and Android, now at 7,000+ downloads.',
          'Resolved 50+ post-alpha issues, improving performance and feature reliability by about 30%.',
          'Own architecture and delivery for encrypted chat, the shared media vault, on-device ML and Firebase performance.'
        ],
        tags: ['Flutter', 'Riverpod', 'Node.js', 'Firebase', 'WebRTC', 'E2E Encryption']
      },
      {
        id: 'khwaaish',
        role: 'Mobile Application Developer (Contract)',
        organization: 'Khwaaish AI / Eastri',
        organizationUrl: 'https://www.khwaaish.com/',
        duration: 'Oct 2025 \u2013 Sep 2026',
        points: [
          'Built the mobile app for a personal AI agent that orders, books and buys across apps on the user’s behalf.',
          'Shipped fixes and optimisations for Eastri, a beta laundry app connecting local shops with customers.'
        ],
        tags: ['Flutter', 'AI Agents', 'API Integration']
      },
      {
        id: 'sociante',
        role: 'SDE (Flutter) Intern',
        organization: 'Sociante Pvt Ltd',
        organizationUrl: 'https://drive.google.com/file/d/1NO2Im8o_qOnMwfTwqbFCPNMqVFYMAkYi/view?usp=sharing',
        duration: 'Oct 2024 – Apr 2025',
        points: [
          'Delivered 40+ screens from Figma across customer and merchant apps for an automated parking system.',
          'Integrated 20+ APIs including Razorpay and ANPR, plus Google Maps plaza search. Engagement up 20%, operational efficiency up 15%.'
        ],
        tags: ['Flutter', 'Google Maps', 'Razorpay', 'Figma']
      }
    ],

    education: {
      school: 'International Institute of Information Technology, Pune',
      degree: 'B.E. in Information Technology',
      duration: '2025',
      note: 'CGPA 8.39 / 10'
    },

    projects: [
      {
        id: 'ourora-connect',
        title: 'Ourora Connect',
        kicker: 'Production app · Founding Engineer',
        size: 'xl',
        metric: { value: '7k+', label: 'downloads on iOS & Android' },
        summary: 'A private app for couples. End-to-end encrypted chat, a shared memories vault, nudges and calls. Built and shipped from alpha to the stores.',
        tags: ['Flutter', 'Riverpod', 'WebRTC', 'E2E Encryption', 'Firebase'],
        visual: { type: 'video', src: 'images/ourora/demo-loop.mp4', poster: 'images/ourora/demo-poster.jpg', fit: 'contain' },
        links: [
          { label: 'App Store', url: 'https://apps.apple.com/us/app/ourora-connect/id6759134873', icon: 'apple' },
          { label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.ourora.connect', icon: 'play' }
        ],
        detail: {
          subtitle: 'Founding Engineer · Ourora Expressions',
          duration: 'Feb 2026 – Present',
          description: 'Ourora is one private app made for just the two of you. No public profile, no groups, no forwards. I lead the Flutter app for iOS and Android with the founder, from architecture to store releases.',
          sections: [
            {
              title: 'Why it matters',
              body: 'Your phone is full of people, and the photos and messages that matter most get lost between them. Ourora gives a couple one space where chat, calls and shared memories are encrypted and private by design.'
            },
            {
              title: 'What I built',
              items: [
                'End-to-end encrypted 1:1 messaging with a sixteen-word secure phrase for key recovery.',
                'Memories: a shared, encrypted photo vault with albums and smart albums.',
                'WebRTC voice and video calling, one-tap nudges and home-screen widgets.',
                'Took the codebase from alpha to production and fixed 50+ post-alpha issues, about a 30% reliability gain.'
              ]
            }
          ],
          media: [
            { url: 'images/ourora/launch-film.mp4', caption: 'Launch film' },
            { url: 'images/ourora/demo.mp4', caption: 'Product walkthrough on iPhone and Android' }
          ],
          links: [
            { label: 'App Store', url: 'https://apps.apple.com/us/app/ourora-connect/id6759134873', icon: 'apple' },
            { label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.ourora.connect', icon: 'play' },
            { label: 'Launch post', url: 'https://x.com/0p3nsky_/status/2055249561841795282', icon: 'twitter' },
            { label: 'Website', url: 'https://ourora.in', icon: 'external' }
          ]
        }
      },
      {
        id: 'pcbuildsage',
        title: 'PCBuildSage',
        kicker: 'Open source · Live demo',
        size: 'wide',
        summary: 'Plan a PC in plain language from parts in stock at Indian retailers today. An AI consultant picks parts, code checks compatibility and does the maths.',
        tags: ['Next.js 15', 'TypeScript', 'Python', 'Crawl4AI', 'SQLite', 'Multi-LLM'],
        visual: { type: 'pcbs' },
        links: [
          { label: 'Live demo', url: 'https://pcbuildsage.onrender.com/', icon: 'external' },
          { label: 'Source', url: 'https://github.com/ManishModak/pcbuildsage', icon: 'github' }
        ],
        detail: {
          subtitle: 'Open-source AI PC build planner',
          duration: 'Active development',
          description: 'Describe your budget and needs, get builds from parts in stock at Indian retailers, refreshed twice a day, with exact totals and compatibility checked by code, not the AI.',
          sections: [
            {
              title: 'Why I built this',
              body: 'A chatbot with web search only sees the pages its search happens to find, and it does the maths itself. Indian price-comparison sites see real stock, but you can’t tell them "I already own an RTX 4070, build a quiet PC around it". PCBuildSage does both.'
            },
            {
              title: 'How it works',
              items: [
                'Scraper: Crawl4AI and Playwright workers pull listings from retailers like MDComputers, PrimeABGB and Vedant twice a day. A new retailer is one JSON profile, no code.',
                'Agent harness: tool calling over the live SQLite catalog with fallback across Gemini, OpenRouter, Groq, Ollama or any OpenAI-compatible API.',
                'Rules engine: deterministic checks for sockets, DDR generation, PSU wattage and physical clearance run before any build is shown. Anything unverified is marked as such.',
                'Two interfaces: a web wizard and an interactive, scriptable CLI.'
              ]
            },
            {
              title: 'Privacy',
              body: 'No accounts and no tracking cookies. Bring your own key: it stays in your browser session and is never stored or logged on the server. Or run everything locally with your own model.'
            }
          ],
          links: [
            { label: 'Live demo', url: 'https://pcbuildsage.onrender.com/', icon: 'external' },
            { label: 'GitHub', url: 'https://github.com/ManishModak/pcbuildsage', icon: 'github' }
          ]
        }
      },
      {
        id: 'mobilespec',
        title: 'MobileSpec',
        kicker: 'Arm AI Optimization Challenge 2026',
        size: 'sm',
        summary: 'Phase-aware CPU thread tuning for llama.cpp on Arm Android. Doubles sustained decode speed on a mid-range phone.',
        tags: ['C++', 'Android NDK', 'llama.cpp', 'Vulkan', 'Kotlin'],
        visual: { type: 'mobilespec' },
        links: [
          { label: 'Source', url: 'https://github.com/ManishModak/llama-edge-android', icon: 'github' },
          { label: 'Video', url: YT('1F8mwah88rA'), icon: 'demo' }
        ],
        detail: {
          subtitle: 'Faster on-device LLM inference on Arm Android',
          duration: '2026',
          description: 'An evidence-led execution policy optimizer for llama.cpp on Arm Android. It discovers the CPU topology, measures prefill and decode separately, and removes spin-wait contention on big.LITTLE chips.',
          sections: [
            {
              title: 'Results',
              items: [
                'Sustained decode: 5.39 to 11.18 tok/s, 2.07× faster (Llama 3.2 1B Q4_0, Redmi Note 14 5G).',
                'Decode variance down 9.4×, from 16.1% to 1.71% CV.',
                'Time to first token p99 cut from 2,319 ms to 965 ms. No change in memory.'
              ]
            },
            {
              title: 'The insight',
              body: 'Prefill is compute-bound, so it gets all 8 threads. Decode is memory-bandwidth-bound: two big cores already saturate LPDDR4X, and running 8 threads makes the small cores spin inside ggml_barrier, heating the phone until it throttles. Splitting the policy to pp8 / tg2 removes the contention.'
            }
          ],
          media: [
            { url: 'images/mobilespec/phase-policy.webp', caption: 'Stock defaults vs phase-aware policy, 15 sustained runs' }
          ],
          links: [
            { label: 'GitHub', url: 'https://github.com/ManishModak/llama-edge-android', icon: 'github' },
            { label: 'YouTube', url: YT('1F8mwah88rA'), icon: 'demo' }
          ]
        }
      },
      {
        id: 'parallax-connect',
        title: 'Parallax Connect',
        kicker: 'Hackathon winner',
        size: 'sm',
        summary: 'Your home GPU as a private AI cloud. Flutter app with streaming chat, vision/OCR and web search, tunnelled to a local model.',
        tags: ['Flutter', 'FastAPI', 'Local LLMs', 'OCR'],
        visual: { type: 'video', src: 'images/parallax-connect/private_chat.mp4', fit: 'contain' },
        links: [
          { label: 'Source', url: 'https://github.com/ManishModak/parallax-connect-mobile', icon: 'github' },
          { label: 'Video', url: YT('1G5gAEA_tz8'), icon: 'demo' }
        ],
        detail: {
          subtitle: 'Winner · Gradient Build Your Own AI Lab Hackathon',
          duration: 'Oct – Nov 2025',
          description: 'A mobile app for local AI with chat, vision/OCR and web search, routing securely between your phone and the model running on your own machine.',
          sections: [
            {
              title: 'Why I built this',
              body: 'Running open models on your own GPU is powerful, but it pins you to your desk. Parallax Connect is a secure mobile bridge: leave the model running at home and use it from your phone, without a third-party cloud seeing your data.'
            },
            {
              title: 'Architecture',
              body: '1. Flutter client: SSE chat streaming, camera capture, on-device ML Kit OCR, history export, QR pairing.\n2. FastAPI middleware: search routing, PDF parsing with PyMuPDF, hybrid OCR.\n3. Inference: Parallax or Ollama serving open models on your own hardware, exposed through a password-protected tunnel.'
            }
          ],
          media: [
            { url: 'images/parallax-connect/Qr_plus_normal_chat.mp4', caption: 'Scan a QR code to pair and start chatting' },
            { url: 'images/parallax-connect/private_chat.mp4', caption: 'Streaming chat from a local model' },
            { url: 'images/parallax-connect/settings.mp4', caption: 'Middleware settings and modes' },
            { url: 'images/parallax-connect/export.mp4', caption: 'Exporting history' },
            { url: 'images/parallax-connect/architecture.webp', caption: 'System architecture' }
          ],
          links: [
            { label: 'GitHub', url: 'https://github.com/ManishModak/parallax-connect-mobile', icon: 'github' },
            { label: 'YouTube', url: YT('1G5gAEA_tz8'), icon: 'demo' }
          ]
        }
      },
      {
        id: 'necro-pet',
        title: 'Necro-Pet',
        kicker: 'Kiroween 2025',
        size: 'wide',
        summary: 'A desktop pet that lives on your commits. File saves feed it, neglect kills it, and it haunts you.',
        tags: ['Electron', 'React', 'TypeScript', 'MCP'],
        visual: { type: 'video', src: 'images/necro-pet/demo-optimized.mp4', fit: 'cover' },
        links: [
          { label: 'Source', url: 'https://github.com/ManishModak/necro-pet', icon: 'github' },
          { label: 'Video', url: YT('VSRB3CIGBws'), icon: 'demo' }
        ],
        detail: {
          title: 'Necro-Pet: Undead Coding Companion',
          subtitle: 'Desktop virtual pet',
          duration: 'Dec 2025 – Jan 2026',
          description: 'A desktop virtual pet that gamifies coding: file saves feed it, neglect causes it to die.',
          sections: [
            {
              title: 'How it works',
              body: '1. Electron + React overlay renders an 8-bit companion with CRT scanlines.\n2. A file-watcher daemon turns saves and commits into food and XP.\n3. An Open-Meteo MCP integration syncs the pet’s world with your real weather.'
            }
          ],
          media: [
            { url: 'images/necro-pet/demo-optimized.mp4', caption: 'Necro-Pet on the desktop' },
            { url: 'images/necro-pet/egg.mp4', caption: 'Egg: waiting for your first saves' },
            { url: 'images/necro-pet/larva.mp4', caption: 'Larva' },
            { url: 'images/necro-pet/beast.mp4', caption: 'Beast: evolved through high activity' },
            { url: 'images/necro-pet/ghost.mp4', caption: 'Ghost: stop saving and it haunts you' }
          ],
          links: [
            { label: 'GitHub', url: 'https://github.com/ManishModak/necro-pet', icon: 'github' },
            { label: 'YouTube', url: YT('VSRB3CIGBws'), icon: 'demo' }
          ]
        }
      },
      {
        id: 'whisper-village',
        title: 'Whisper Village',
        kicker: 'Cerebras × Gemma hackathon',
        size: 'wide',
        summary: 'A 2D RPG village where NPCs keep memories and trust, gossip to each other, and answer at Cerebras speed.',
        tags: ['React 19', 'Phaser', 'Fastify', 'Cerebras'],
        visual: { type: 'youtube', id: 'p1vI7Kpj5s0' },
        links: [
          { label: 'Source', url: 'https://github.com/ManishModak/gemma-cerebras', icon: 'github' },
          { label: 'Video', url: YT('p1vI7Kpj5s0'), icon: 'demo' }
        ]
      }
    ],

    // Compact list under the grid. Only public links: private repos 404 for visitors.
    moreBuilds: [
      { title: 'Gestalt', description: 'A design memory layer that keeps AI-generated UI on your design system.', label: 'Video', url: YT('GLRwsT3wRa4') },
      { title: 'UpcycleAI', description: 'Six Gemini models turn recyclables into DIY projects. Gemini 3 hackathon.', label: 'Video', url: YT('K6ifq7mveio') },
      { title: 'MT7902 Linux driver', description: 'WiFi and Bluetooth for the MediaTek MT7902 card on Linux, packaged with DKMS.', label: 'GitHub', url: 'https://github.com/ManishModak/mt7902_driver' },
      { title: 'Data Hive', description: 'Reverse-engineered a browser extension to run headless in Docker.', label: 'GitHub', url: 'https://github.com/ManishModak/data_hive' },
      { title: 'Smart India Hackathon 2023', description: 'Disaster management app with Flutter and Firebase.', label: 'GitHub', url: 'https://github.com/ManishModak/Smart-India-Hackathon-2023' }
    ]
  };

  function normalizeItem(item) {
    const detail = item.detail || {};
    return {
      ...detail,
      ...item,
      category: 'project',
      title: detail.title || item.title,
      subtitle: detail.subtitle || item.kicker || '',
      duration: detail.duration || '',
      description: detail.description || item.summary || '',
      sections: detail.sections || [],
      media: detail.media || [],
      links: detail.links || item.links || []
    };
  }

  const detailById = {};
  PORTFOLIO_DATA.projects.forEach((item) => {
    if (item.detail) detailById[item.id] = normalizeItem(item);
  });

  window.PORTFOLIO_DATA = PORTFOLIO_DATA;
  window.PROJECT_DETAILS = detailById;
})();
