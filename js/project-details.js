/**
 * Central portfolio content source.
 *
 * Cards and detail pages are generated from this file so the same project or
 * experience is not duplicated across index.html and the detail renderer.
 */
(function () {
  'use strict';

  const PORTFOLIO_DATA = {
    experience: [
      {
        id: 'ourora',
        role: 'Founding Engineer',
        organization: 'Ourora',
        organizationUrl: 'https://ourora.in',
        duration: 'Feb 2026 \u2013 Present',
        summary: 'Leading Flutter development for Android and iOS at a privacy-first couples app. Owning architecture decisions for encrypted chat, voice/video, and shared media vault systems.',
        tags: ['Flutter', 'Dart', 'WebRTC', 'Encryption', 'Firebase'],
        links: [
          { label: 'App Store', url: 'https://apps.apple.com/us/app/ourora-connect/id6759134873', icon: 'apple' },
          { label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.ourora.connect', icon: 'play' },
          { label: 'Launch X Post', url: 'https://x.com/0p3nsky_/status/2055249561841795282', icon: 'twitter' }
        ],
        detail: {
          title: 'Founding Engineer',
          subtitle: 'Ourora',
          description: 'Leading Flutter development for Android and iOS at a privacy-first couples app, in close collaboration with the founder. Owning architecture decisions for encrypted chat, voice/video, and shared media vault systems.',
          sections: [
            {
              title: 'Why This Matters',
              body: 'Intimate communication should be genuinely private. Traditional messaging apps often do not provide strong, opt-in privacy boundaries for couples. We wanted to build a secure space where intimate chat, calls, and shared memories are encrypted and private by design.'
            },
            {
              title: 'Core Focus and Features',
              items: [
                'Architected end-to-end encrypted messaging systems and shared media vaults.',
                'Designed and integrated WebRTC-based real-time voice and video calling.',
                'Collaborated closely with the founder to set technical roadmap and product strategy.',
                'Shipped rapid weekly iterations from initial wireframes to a launched beta app.'
              ]
            }
          ],
          links: [
            { label: 'App Store', url: 'https://apps.apple.com/us/app/ourora-connect/id6759134873', icon: 'apple' },
            { label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.ourora.connect', icon: 'play' },
            { label: 'Launch X Post', url: 'https://x.com/0p3nsky_/status/2055249561841795282', icon: 'twitter' },
            { label: 'Website', url: 'https://ourora.in', icon: 'external' }
          ]
        }
      },
      {
        id: 'khwaaish',
        role: 'Lead Flutter Developer',
        organization: 'Khwaaish AI / Eastri',
        organizationUrl: 'https://www.khwaaish.com/',
        duration: 'Oct 2025 \u2013 Present',
        summary: 'Building a personal AI agent mobile app for autonomous ordering, booking, and purchasing, while also improving a local laundry services app.',
        tags: ['Flutter', 'AI Agents', 'System Design', 'API Integration'],
        links: [
          { label: 'Website', url: 'https://www.khwaaish.com/', icon: 'external' }
        ],
        detail: {
          title: 'Lead Flutter Developer',
          subtitle: 'Khwaaish AI / Eastri',
          description: 'Developing a personal AI agent mobile application for autonomous cross-app booking and purchasing, and maintaining a laundry services app.',
          sections: [
            {
              title: 'Why This Matters',
              body: 'Autonomous AI agents are normally restricted to CLI tools or web consoles. Khwaaish brings that power directly into a consumer mobile experience, letting users instruct an agent to order, book, or buy across multiple platforms.'
            },
            {
              title: 'Core Focus and Features',
              items: [
                'Khwaaish AI: Architected a mobile app integrating multi-service APIs for autonomous AI bookings.',
                'Designed system flows enabling local execution of scheduled prompts.',
                'Eastri: Optimizing a laundry services app connecting local service providers with customers.',
                'Worked with the founder to shape product strategy, system design, and sprint execution.'
              ]
            }
          ],
          links: [
            { label: 'Website', url: 'https://www.khwaaish.com/', icon: 'external' },
            { label: 'Khwaaish AI', url: 'https://www.linkedin.com/company/khwaaish/', icon: 'external' },
            { label: 'Eastri', url: 'https://www.linkedin.com/company/eastri/', icon: 'external' }
          ]
        }
      },
      {
        id: 'sociante',
        role: 'SDE (Flutter) Intern',
        organization: 'Sociante Pvt Ltd',
        organizationUrl: 'https://drive.google.com/file/d/1NO2Im8o_qOnMwfTwqbFCPNMqVFYMAkYi/view?usp=sharing',
        duration: 'Oct 2024 \u2013 Apr 2025',
        summary: 'Enhanced user engagement and operational efficiency through customer and merchant apps for an automated parking management system.',
        tags: ['Flutter', 'Google Maps API', 'Razorpay SDK', 'Figma'],
        links: [
          { label: 'Certificate', url: 'https://drive.google.com/file/d/1NO2Im8o_qOnMwfTwqbFCPNMqVFYMAkYi/view?usp=sharing', icon: 'external' }
        ],
        detail: {
          title: 'SDE (Flutter) Intern',
          subtitle: 'Sociante Pvt Ltd',
          description: 'Enhanced user engagement by 20% and operational efficiency by 15% through customer and merchant apps with more than 40 screens for an automated parking management system.',
          sections: [
            {
              title: 'Why This Matters',
              body: 'Navigating, parking, and checking out at crowded venues is friction-filled. The goal was to build a merchant-customer ecosystem where parking spaces are discoverable in real time, payments are handled seamlessly, and tickets are fully digitized.'
            },
            {
              title: 'Core Focus and Features',
              items: [
                'Crafted more than 40 responsive UI screens in Flutter based on custom Figma templates.',
                'Integrated Google Maps API for plaza search, location status, and navigation routing.',
                'Engineered backend integration for vehicle tracking and payment ticketing.',
                'Integrated Razorpay SDK for seamless, cashless ticket checkout.'
              ]
            }
          ],
          links: [
            { label: 'Internship Certificate', url: 'https://drive.google.com/file/d/1NO2Im8o_qOnMwfTwqbFCPNMqVFYMAkYi/view?usp=sharing', icon: 'external' }
          ]
        }
      }
    ],

    projects: [
      {
        id: 'parallax-connect',
        title: 'Parallax Connect',
        badge: 'Hackathon Winner',
        duration: 'Jan 2026',
        summary: 'Winner at Gradient Network Hackathon 2026. Mobile app for local AI with chat, vision/OCR, and web search capabilities.',
        tags: ['Flutter', 'Dart', 'Python', 'FastAPI', 'Local AI', 'OCR'],
        links: [
          { label: 'Source', url: 'https://github.com/ManishModak/parallax-connect-mobile', icon: 'github' },
          { label: 'YT Demo', url: 'https://youtu.be/1G5gAEA_tz8', icon: 'demo' }
        ],
        detail: {
          subtitle: 'Hackathon Winner',
          description: 'Winner at Gradient Network Hackathon 2026. A mobile app for local AI featuring chat, vision/OCR, and web search capabilities, routing processing securely between mobile and server.',
          sections: [
            {
              title: 'Why I Built This',
              body: 'Running open-source LLMs locally on your home GPU is powerful, but it normally pins you to your desktop. I built Parallax Connect as a personal, secure mobile bridge so you can leave your local machine running AI models and access them from your phone without relying on proprietary cloud backends.'
            },
            {
              title: 'Core Problem',
              body: 'Traditional AI assistants operate on centralized cloud infrastructure, meaning conversations and document contents are uploaded to third-party servers. Parallax Connect keeps data local by routing connections through a password-protected FastAPI middleware tunnel directly to your local GPU.'
            },
            {
              title: 'System Architecture',
              body: '1. Mobile Frontend (Flutter): Premium UI with real-time SSE chat streaming, vision capture, history export, and terminal QR scanner connection.\n2. Middleware Server (FastAPI): Coordinates Google/Brave query routing, PDF parsing through PyMuPDF, and hybrid OCR management.\n3. Local GPU Inference Engine (Parallax / Ollama): Serves open-source LLMs such as Llama 3 and Phi 3 on your own hardware.'
            },
            {
              title: 'Technical Implementation and Stack',
              body: 'Flutter and Dart handle the cross-platform mobile client, local state, markdown rendering, on-device ML Kit OCR, and responsive styling. Python and FastAPI run the lightweight host server with SSE streaming, scraper pipelines, and document extraction. Docker plus Ngrok/Localtunnel expose the local server securely with password authentication.'
            }
          ],
          media: [
            { url: 'images/parallax-connect/architecture.png', caption: 'System architecture flow diagram' },
            { url: 'images/parallax-connect/Qr_plus_normal_chat.mp4', caption: 'Scanning QR code to launch mobile chat' },
            { url: 'images/parallax-connect/private_chat.mp4', caption: 'Local streaming chat in action' },
            { url: 'images/parallax-connect/settings.mp4', caption: 'Middleware settings and mode configuration' },
            { url: 'images/parallax-connect/export.mp4', caption: 'Exporting history and options' }
          ],
          links: [
            { label: 'GitHub Source', url: 'https://github.com/ManishModak/parallax-connect-mobile', icon: 'github' },
            { label: 'YouTube Demo', url: 'https://youtu.be/1G5gAEA_tz8', icon: 'demo' }
          ]
        }
      },
      {
        id: 'necro-pet',
        title: 'Necro-Pet',
        badge: 'Desktop Virtual Pet',
        duration: 'Jan 2026',
        summary: 'Desktop virtual pet that gamifies coding. Build streaks, level up your pet, and make development sessions more engaging.',
        tags: ['Electron', 'TypeScript', 'Node.js', 'Pixel Art', 'MCP'],
        links: [
          { label: 'Source', url: 'https://github.com/ManishModak/necro-pet', icon: 'github' },
          { label: 'YT Demo', url: 'https://youtu.be/VSRB3CIGBws', icon: 'demo' }
        ],
        detail: {
          title: 'Necro-Pet: Undead Coding Companion',
          subtitle: 'Desktop Virtual Pet',
          description: 'Desktop virtual pet that gamifies your coding workflow: file saves feed the pet, neglect causes it to die.',
          sections: [
            {
              title: 'Why I Built This',
              body: 'Writing code for hours can get lonely and repetitive. I wanted to add visual progression and fun feedback, so I built Necro-Pet as a lightweight companion that reacts to real filesystem saves.'
            },
            {
              title: 'Core Problem',
              body: 'Traditional virtual pets are separated from a developer workflow. Necro-Pet links health and evolution stage to filesystem events such as Git commits and file saves, transforming coding activity into a pet-raising loop.'
            },
            {
              title: 'System Architecture',
              body: '1. Desktop App (Electron + React): Renders a retro 8-bit companion frame with CRT-inspired visual effects.\n2. File Watcher Daemon: Monitors local workspace directories for saves, builds, and code additions, converting them into food and experience points.\n3. Open-Meteo Weather Integration: Synchronizes the pet environment with real-world weather conditions.'
            },
            {
              title: 'Technical Implementation and Stack',
              body: 'Electron enables the overlay companion. TypeScript and React render state-driven pixel animations. MCP and Open-Meteo connect the companion environment to real-world weather, while Node.js filesystem APIs perform low-overhead workspace monitoring.'
            }
          ],
          media: [
            { url: 'images/necro-pet/demo-optimized.mp4', caption: 'Necro-Pet companion active on desktop' },
            { url: 'images/necro-pet/egg.mp4', caption: 'Egg stage: resting and waiting for filesystem saves to hatch' },
            { url: 'images/necro-pet/larva.mp4', caption: 'Larva stage: wiggling and crawling companion' },
            { url: 'images/necro-pet/beast.mp4', caption: 'Beast stage: evolved pet for high activity' },
            { url: 'images/necro-pet/ghost.mp4', caption: 'Ghost stage: when you stop saving files, it dies and haunts you' }
          ],
          links: [
            { label: 'GitHub Source', url: 'https://github.com/ManishModak/necro-pet', icon: 'github' },
            { label: 'YouTube Demo', url: 'https://youtu.be/VSRB3CIGBws', icon: 'demo' }
          ]
        }
      },
      {
        id: 'data-hive',
        title: 'Data Hive',
        badge: 'Containerized Emulation',
        duration: 'Late 2025',
        summary: 'Reverse-engineered a browser extension and reimplemented it to run on Docker. Self-hosted data collection without the browser dependency.',
        tags: ['Docker', 'Node.js', 'Web Scraping', 'Docker Compose'],
        links: [
          { label: 'Source', url: 'https://github.com/ManishModak/data_hive', icon: 'github' }
        ],
        detail: {
          subtitle: 'Containerized Emulation',
          description: 'Reverse-engineered a browser extension and containerized it to run headless on Docker.',
          sections: [
            {
              title: 'Why I Built This',
              body: 'Some browser-extension tools require keeping a full GUI browser open continuously, which consumes unnecessary RAM and CPU. I wanted a cleaner way to run a specific extension workflow headless on a home server.'
            },
            {
              title: 'Core Problem',
              body: 'Eliminating resource-heavy browser windows while retaining data-scraping capabilities.'
            },
            {
              title: 'System Architecture',
              body: 'The project emulates the browser-websocket handshake through a headless Node.js client running inside Docker.'
            },
            {
              title: 'Technical Implementation and Stack',
              body: 'Built using Docker, Node.js, WebSockets, and Docker Compose.'
            }
          ],
          links: [
            { label: 'GitHub Source', url: 'https://github.com/ManishModak/data_hive', icon: 'github' }
          ]
        }
      },
      {
        id: 'specgen-chatbot',
        title: 'SpecGen Chatbot',
        badge: 'In Progress',
        duration: 'In Progress',
        summary: 'AI-powered product spec generator with a Crawl4AI scraper. Feed it a product page, get a structured specification document.',
        tags: ['Flutter', 'Python', 'FastAPI', 'Crawl4AI', 'LLMs'],
        links: [
          { label: 'Source', url: 'https://github.com/ManishModak/specgen-chatbot', icon: 'github' }
        ],
        detail: {
          subtitle: 'AI Specification Generator',
          description: 'AI-powered product specification generator with Crawl4AI scraper integration.',
          sections: [
            {
              title: 'Why I Built This',
              body: 'Writing product spec sheets by reading long articles, feature lists, and documentation manually is tedious. I wanted a simple chat interface where a link can be dropped in and the system extracts, structures, and compiles a comprehensive specification sheet.'
            },
            {
              title: 'Core Problem',
              body: 'Manual collection of specifications from complex landing pages takes hours and is easy to get wrong.'
            },
            {
              title: 'System Architecture',
              body: 'A Flutter frontend talks to a Python FastAPI backend running Crawl4AI parsing pipelines.'
            },
            {
              title: 'Technical Implementation and Stack',
              body: 'Built using Flutter, Python, FastAPI, Crawl4AI, and LLM-based extraction flows.'
            }
          ],
          links: [
            { label: 'GitHub Source', url: 'https://github.com/ManishModak/specgen-chatbot', icon: 'github' }
          ]
        }
      }
    ],

    otherProjects: [
      {
        title: 'Smart India Hackathon 2023',
        description: 'Disaster management app with Flutter and Firebase',
        url: 'https://github.com/ManishModak/Smart-India-Hackathon-2023'
      },
      {
        title: 'Flutter Driver App',
        description: 'Driver app implementation',
        url: 'https://github.com/ManishModak/flutter_driver_app'
      },
      {
        title: 'Synq Web Portal',
        description: 'Web portal project',
        url: 'https://github.com/ManishModak/synq-web-portal'
      }
    ]
  };

  function normalizeItem(item, category) {
    const detail = item.detail || {};
    return {
      ...detail,
      ...item,
      category,
      title: detail.title || item.title || item.role,
      subtitle: detail.subtitle || item.subtitle || item.organization || item.badge || '',
      duration: detail.duration || item.duration || '',
      description: detail.description || item.summary || '',
      sections: detail.sections || [],
      media: detail.media || [],
      links: detail.links || item.links || []
    };
  }

  const detailById = {};
  PORTFOLIO_DATA.experience.forEach((item) => {
    detailById[item.id] = normalizeItem(item, 'experience');
  });
  PORTFOLIO_DATA.projects.forEach((item) => {
    detailById[item.id] = normalizeItem(item, 'project');
  });

  window.PORTFOLIO_DATA = PORTFOLIO_DATA;
  window.PROJECT_DETAILS = detailById;
})();
