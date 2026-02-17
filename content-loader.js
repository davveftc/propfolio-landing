// ===========================================
// Propfolio CMS Content Loader
// Fetches content from JSON files managed by Decap CMS
// and injects it into the page DOM
// ===========================================

(function () {
    'use strict';

    const CONTENT_BASE = './content/';

    // Helper: fetch a JSON content file
    async function loadJSON(filename) {
        try {
            const response = await fetch(`${CONTENT_BASE}${filename}`);
            if (!response.ok) throw new Error(`Failed to load ${filename}`);
            return await response.json();
        } catch (err) {
            console.warn(`CMS content loader: ${err.message}. Using default HTML.`);
            return null;
        }
    }

    // Helper: safely set text content of an element
    function setText(selector, text) {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (el && text != null) el.textContent = text;
    }

    // Helper: safely set innerHTML of an element
    function setHTML(selector, html) {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (el && html != null) el.innerHTML = html;
    }

    // ===========================
    // HERO SECTION
    // ===========================
    async function loadHero() {
        const data = await loadJSON('hero.json');
        if (!data) return;

        // Description
        setText('.hero-description', data.description);

        // Form card text
        setText('.form-title', data.form_title);
        setText('.form-subtitle', data.form_subtitle);
        setText('.btn-text', data.submit_button_text);
        setText('.form-footer', data.form_footer);
    }

    // ===========================
    // SUCCESS STATE
    // ===========================
    async function loadSuccess() {
        const data = await loadJSON('success.json');
        if (!data) return;

        setText('.success-text', data.text);
    }

    // ===========================
    // SOCIAL PROOF
    // ===========================
    async function loadSocialProof() {
        const data = await loadJSON('social-proof.json');
        if (!data) return;

        setText('.social-proof-label', data.label);

        if (data.logos && data.logos.length > 0) {
            const grid = document.querySelector('.logos-grid');
            if (!grid) return;

            grid.innerHTML = data.logos.map(logo => `
                <div class="logo-item">
                    <span class="logo-placeholder">${logo.name}</span>
                    <span class="logo-type">${logo.type}</span>
                </div>
            `).join('');
        }
    }

    // ===========================
    // FEATURES
    // ===========================
    async function loadFeatures() {
        const data = await loadJSON('features.json');
        if (!data) return;

        // Section header
        const featuresSection = document.querySelector('.features');
        if (!featuresSection) return;

        const header = featuresSection.querySelector('.section-header');
        if (header) {
            setText(header.querySelector('h2'), data.headline);
            setText(header.querySelector('p'), data.subheadline);
        }

        // Feature cards
        if (data.items && data.items.length > 0) {
            const grid = document.querySelector('.features-grid');
            if (!grid) return;

            grid.innerHTML = data.items.map(item => `
                <div class="feature-card fade-in visible">
                    <div class="feature-icon">${item.icon}</div>
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                </div>
            `).join('');
        }
    }

    // ===========================
    // REFERRAL SECTION
    // ===========================
    async function loadReferral() {
        const data = await loadJSON('referral.json');
        if (!data) return;

        const section = document.querySelector('.referral-content');
        if (!section) return;

        const badge = section.querySelector('.referral-badge');
        if (badge) {
            // Preserve the SVG icon, update text
            const svg = badge.querySelector('svg');
            const svgHTML = svg ? svg.outerHTML : '';
            badge.innerHTML = `${svgHTML}\n                ${data.badge_text}`;
        }

        const h2 = section.querySelector('h2');
        if (h2) {
            h2.innerHTML = `${data.headline}<span class="highlight">${data.headline_highlight}</span>`;
        }

        // Update description (first <p> that isn't .small)
        const desc = section.querySelector('p:not(.small)');
        if (desc) setHTML(desc, data.description);

        const footnote = section.querySelector('.small');
        if (footnote) setText(footnote, data.footnote);
    }

    // ===========================
    // LEADERBOARD SECTION
    // ===========================
    async function loadLeaderboard() {
        const data = await loadJSON('leaderboard.json');
        if (!data) return;

        const section = document.querySelector('.leaderboard-section');
        if (!section) return;

        const header = section.querySelector('.section-header');
        if (header) {
            setText(header.querySelector('h2'), data.headline);
            setText(header.querySelector('p'), data.subheadline);
        }
    }

    // ===========================
    // FAQ SECTION
    // ===========================
    async function loadFAQ() {
        const data = await loadJSON('faq.json');
        if (!data) return;

        // Section headline
        const faqSection = document.querySelector('.faq-section');
        if (!faqSection) return;

        const header = faqSection.querySelector('.section-header');
        if (header) {
            setText(header.querySelector('h2'), data.headline);
        }

        // FAQ items
        if (data.items && data.items.length > 0) {
            // Remove existing FAQ items (but keep the section-header)
            const existingItems = faqSection.querySelectorAll('.faq-item');
            existingItems.forEach(item => item.remove());

            // Build new FAQ items
            const faqPlusIcon = `<span class="faq-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg></span>`;

            data.items.forEach(item => {
                const faqItem = document.createElement('div');
                faqItem.className = 'faq-item fade-in visible';
                faqItem.innerHTML = `
                    <button class="faq-question">
                        ${item.question}
                        ${faqPlusIcon}
                    </button>
                    <div class="faq-answer">
                        <div class="faq-answer-inner">
                            ${item.answer}
                        </div>
                    </div>
                `;
                faqSection.appendChild(faqItem);
            });

            // Re-attach accordion listeners for new FAQ items
            const newFaqItems = faqSection.querySelectorAll('.faq-item');
            newFaqItems.forEach(item => {
                const question = item.querySelector('.faq-question');
                question.addEventListener('click', () => {
                    const isActive = item.classList.contains('active');
                    newFaqItems.forEach(i => i.classList.remove('active'));
                    if (!isActive) {
                        item.classList.add('active');
                    }
                });
            });
        }
    }

    // ===========================
    // SECONDARY CTA
    // ===========================
    async function loadCTA() {
        const data = await loadJSON('cta.json');
        if (!data) return;

        const section = document.querySelector('.secondary-cta');
        if (!section) return;

        setText(section.querySelector('h2'), data.headline);

        const btn = section.querySelector('.cta-btn');
        if (btn && data.button_text) {
            const svg = btn.querySelector('svg');
            const svgHTML = svg ? svg.outerHTML : '';
            btn.innerHTML = `${data.button_text}\n            ${svgHTML}`;
        }
    }

    // ===========================
    // FOOTER
    // ===========================
    async function loadFooter() {
        const data = await loadJSON('footer.json');
        if (!data) return;

        setText('.footer-copyright', data.copyright);

        if (data.links && data.links.length > 0) {
            const linksContainer = document.querySelector('.footer-links');
            if (linksContainer) {
                linksContainer.innerHTML = data.links.map(link =>
                    `<a href="${link.url}">${link.label}</a>`
                ).join('\n                ');
            }
        }
    }

    // ===========================
    // SEO / META (updates document head)
    // ===========================
    async function loadSEO() {
        const data = await loadJSON('seo.json');
        if (!data) return;

        if (data.title) document.title = data.title;

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && data.description) metaDesc.setAttribute('content', data.description);

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && data.og_title) ogTitle.setAttribute('content', data.og_title);

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && data.og_description) ogDesc.setAttribute('content', data.og_description);

        const twTitle = document.querySelector('meta[name="twitter:title"]');
        if (twTitle && data.og_title) twTitle.setAttribute('content', data.og_title);

        const twDesc = document.querySelector('meta[name="twitter:description"]');
        if (twDesc && data.og_description) twDesc.setAttribute('content', data.og_description);
    }

    // ===========================
    // LOAD ALL CONTENT
    // ===========================
    async function init() {
        // Load all content sections in parallel for speed
        await Promise.allSettled([
            loadHero(),
            loadSuccess(),
            loadSocialProof(),
            loadFeatures(),
            loadReferral(),
            loadLeaderboard(),
            loadFAQ(),
            loadCTA(),
            loadFooter(),
            loadSEO()
        ]);

        console.log('CMS content loaded successfully.');
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
