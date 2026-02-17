// ===========================================
// Propfolio Landing Page - Main Script
// ===========================================

// --- Configuration ---
// Replace this URL with your deployed Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzssj3R4LWIMgKvtP7YhHDYYfr8mkhcQR9dKP5iS2ZQ0Gk0goXA4irckiSHH4yypVQWbw/exec';

// --- DOM Elements ---
const navbar = document.getElementById('navbar');
const form = document.getElementById('waitlist-form-element');
const formContainer = document.getElementById('signup-form-container');
const formSuccess = document.getElementById('form-success');
const userNameSpan = document.getElementById('user-name');
const submitBtn = document.getElementById('submit-btn');
const copyBtn = document.getElementById('copy-btn');
const referralInput = document.getElementById('referral-link');
const spotsEl = document.getElementById('spots-remaining');
const errorMessage = document.getElementById('form-error-message');

// --- Navbar scroll effect ---
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// --- Fade-in animations on scroll ---
const fadeElements = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});
fadeElements.forEach(el => fadeObserver.observe(el));

// --- FAQ Accordion ---
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// --- Simulate realistic spots count ---
const baseSpots = 87;
const daysSinceLaunch = Math.floor((Date.now() - new Date('2026-01-15').getTime()) / (1000 * 60 * 60 * 24));
const simulatedSpots = Math.max(12, baseSpots - Math.min(daysSinceLaunch, 60));
spotsEl.textContent = simulatedSpots;

// --- Form Validation ---
function validateForm() {
    let valid = true;
    const fields = form.querySelectorAll('input[required], select[required]');

    fields.forEach(field => {
        field.classList.remove('error');
        if (!field.value || field.value === '') {
            field.classList.add('error');
            valid = false;
        }
    });

    const emailField = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailField.value && !emailRegex.test(emailField.value)) {
        emailField.classList.add('error');
        valid = false;
    }

    return valid;
}

// Remove error styling on input
form.querySelectorAll('input, select').forEach(field => {
    field.addEventListener('input', () => {
        field.classList.remove('error');
        errorMessage.classList.remove('visible');
    });
    field.addEventListener('change', () => {
        field.classList.remove('error');
        errorMessage.classList.remove('visible');
    });
});

// --- Form Submission ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.classList.remove('visible');

    if (!validateForm()) {
        errorMessage.textContent = 'Please fill in all required fields correctly.';
        errorMessage.classList.add('visible');
        return;
    }

    // Collect form data
    const referrer = sessionStorage.getItem('propfolio_referrer') || '';
    const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        portfolioSize: document.getElementById('portfolioSize').value,
        companySize: document.getElementById('companySize').value,
        country: document.getElementById('country').value,
        timestamp: new Date().toISOString(),
        referralCode: generateReferralCode(),
        referredBy: referrer
    };

    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        // Send data to Google Sheets
        if (GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }

        // Update UI on success
        userNameSpan.textContent = formData.firstName;
        referralInput.value = `${window.location.origin}?ref=${formData.referralCode}`;

        // Update spots remaining
        const currentSpots = parseInt(spotsEl.textContent);
        if (currentSpots > 1) {
            spotsEl.textContent = currentSpots - 1;
        }

        // Store submission in localStorage to prevent duplicate signups
        localStorage.setItem('propfolio_waitlist', JSON.stringify({
            name: formData.firstName,
            referralCode: formData.referralCode,
            submittedAt: formData.timestamp
        }));

        // Show success state
        formContainer.style.display = 'none';
        formSuccess.classList.add('active');

        // Refresh leaderboard after signup
        setTimeout(fetchLeaderboard, 2000);

    } catch (error) {
        console.error('Submission error:', error);
        errorMessage.textContent = 'Something went wrong. Please try again.';
        errorMessage.classList.add('visible');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});

// --- Generate Referral Code ---
function generateReferralCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// --- Copy Referral Link ---
copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(referralInput.value);
        copyBtn.textContent = 'Copied!';
    } catch {
        // Fallback for older browsers
        referralInput.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';
    }
    setTimeout(() => {
        copyBtn.textContent = 'Copy';
    }, 2000);
});

// --- Social Sharing ---
function getShareData() {
    return {
        url: encodeURIComponent(referralInput.value),
        text: encodeURIComponent('Just joined the Propfolio waitlist! AI-powered property management that works across borders. Grab your spot:')
    };
}

function shareLinkedIn() {
    const { url } = getShareData();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=500');
}

function shareTwitter() {
    const { url } = getShareData();
    const text = encodeURIComponent('Just joined the @propfolio waitlist! AI-powered property management across borders. Get early access:');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
}

function shareWhatsApp() {
    const { url } = getShareData();
    const text = encodeURIComponent('Hey! I just joined the Propfolio waitlist \u2014 AI-powered property management that works globally. Check it out:');
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
}

function shareEmail() {
    const url = referralInput.value;
    const subject = encodeURIComponent('Check out Propfolio \u2014 property management made easy');
    const body = encodeURIComponent(`Hey!\n\nI just joined the waitlist for Propfolio, an AI-powered property management platform. Thought you might be interested!\n\nJoin here: ${url}\n\nCheers!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

// Make share functions globally accessible
window.shareLinkedIn = shareLinkedIn;
window.shareTwitter = shareTwitter;
window.shareWhatsApp = shareWhatsApp;
window.shareEmail = shareEmail;

// --- Check for Returning User ---
(function checkReturningUser() {
    const stored = localStorage.getItem('propfolio_waitlist');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            userNameSpan.textContent = data.name;
            referralInput.value = `${window.location.origin}?ref=${data.referralCode}`;
            formContainer.style.display = 'none';
            formSuccess.classList.add('active');
        } catch {
            localStorage.removeItem('propfolio_waitlist');
        }
    }
})();

// --- Check for Referral Code in URL ---
(function checkReferralParam() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
        // Store the referrer code so we can send it with submission
        sessionStorage.setItem('propfolio_referrer', ref);
    }
})();

// --- Live Leaderboard ---
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardFooter = document.querySelector('.leaderboard-footer p');

// Fallback data shown before live data loads or if fetch fails
const fallbackLeaderboard = [
    { initials: 'SA', name: 'Sarah A.', joined: 'Joined Dec 15', referrals: 47 },
    { initials: 'MK', name: 'Michael K.', joined: 'Joined Dec 18', referrals: 38 },
    { initials: 'JO', name: 'James O.', joined: 'Joined Dec 20', referrals: 31 },
    { initials: 'EN', name: 'Emma N.', joined: 'Joined Dec 22', referrals: 28 },
    { initials: 'DT', name: 'David T.', joined: 'Joined Dec 24', referrals: 24 },
    { initials: 'LP', name: 'Lisa P.', joined: 'Joined Dec 26', referrals: 19 },
    { initials: 'RB', name: 'Robert B.', joined: 'Joined Dec 28', referrals: 15 },
    { initials: 'AC', name: 'Amanda C.', joined: 'Joined Dec 30', referrals: 12 },
    { initials: 'CW', name: 'Chris W.', joined: 'Joined Jan 2', referrals: 9 },
    { initials: 'NF', name: 'Nancy F.', joined: 'Joined Jan 3', referrals: 7 }
];

function renderLeaderboard(entries, totalReferrals, totalSignups) {
    if (!leaderboardList || entries.length === 0) return;

    leaderboardList.innerHTML = entries.map((entry, i) => {
        const rank = i + 1;
        const isTopFive = rank <= 5;
        const topBadge = isTopFive ? '<span class="top-badge">50% OFF</span>' : '';

        return `
            <li class="leaderboard-item${isTopFive ? ' top-five' : ''}">
                <div class="leaderboard-rank">${rank}</div>
                <div class="leaderboard-user">
                    <div class="user-avatar">${entry.initials}</div>
                    <div class="user-info">
                        <span class="user-name">${entry.name}${topBadge}</span>
                        <span class="user-joined">${entry.joined}</span>
                    </div>
                </div>
                <div class="leaderboard-stats">
                    <span class="referral-count">${entry.referrals}</span>
                    <span class="referral-label">referrals</span>
                </div>
            </li>
        `;
    }).join('');

    if (leaderboardFooter) {
        leaderboardFooter.innerHTML = `<strong>${totalReferrals} referrals</strong> from <strong>${totalSignups} waitlisters</strong> so far. Join now to start climbing!`;
    }
}

async function fetchLeaderboard() {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=leaderboard`);
        const data = await response.json();

        if (data.status === 'success' && data.leaderboard.length > 0) {
            renderLeaderboard(data.leaderboard, data.totalReferrals, data.totalSignups);
        }
        // If no data yet, the fallback HTML stays in place
    } catch (error) {
        console.log('Leaderboard fetch skipped, using fallback data.');
        // Fallback HTML already in place — no action needed
    }
}

// Fetch live leaderboard on page load
fetchLeaderboard();
