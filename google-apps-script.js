// ============================================================
// Google Apps Script — Propfolio Waitlist Backend
// ============================================================
// SETUP INSTRUCTIONS:
//
// 1. Go to https://sheets.google.com and create a new spreadsheet
// 2. Name it "Propfolio Waitlist"
// 3. In Row 1, add these headers:
//    A1: Timestamp | B1: First Name | C1: Last Name | D1: Email
//    E1: Portfolio Size | F1: Company Size | G1: Country
//    H1: Referral Code | I1: Referred By
//
// 4. Go to Extensions > Apps Script
// 5. Delete any existing code and paste this entire file
// 6. Click Deploy > New Deployment
// 7. Select type: "Web app"
// 8. Set "Execute as": Me
// 9. Set "Who has access": Anyone
// 10. Click Deploy and authorize the app
// 11. Copy the Web App URL and paste it into script.js
//     (replace 'YOUR_GOOGLE_SCRIPT_URL_HERE')
//
// HOSTINGER EMAIL SETUP:
// 1. In Hostinger hPanel, go to Emails > Email Accounts
// 2. Create an email account: team@trypropfolio.com
// 3. Note the password you set for this email account
// 4. In Gmail (the Google account that owns this script):
//    Settings > Accounts > "Send mail as" > Add another email address
//    - Name: Propfolio  |  Email: team@trypropfolio.com
//    - SMTP: smtp.hostinger.com  |  Port: 465  |  SSL: Yes
//    - Username: team@trypropfolio.com  |  Password: (from step 3)
// 5. Verify the email address via the code sent to your Hostinger inbox
//
// IMPORTANT: After updating this script, you must create a
// NEW deployment version for changes to take effect:
//   Deploy > Manage deployments > Edit (pencil icon) >
//   Version: "New version" > Deploy
// ============================================================

// --- Configuration ---
var FROM_EMAIL = 'team@trypropfolio.com';
var FROM_NAME = 'Propfolio';

// ============================================================
// DEBUG: Run this function manually in the Apps Script editor
// to test email sending. Go to:
//   Select function: testEmailSending → Click ▶ Run
//   Then check View > Execution log for results
// ============================================================
function testEmailSending() {
  var testEmail = Session.getActiveUser().getEmail(); // sends to yourself
  Logger.log('--- Email Debug Test ---');
  Logger.log('Script owner email: ' + testEmail);

  // Test 1: Check Gmail aliases
  try {
    var aliases = GmailApp.getAliases();
    Logger.log('Gmail aliases configured: ' + JSON.stringify(aliases));
    if (aliases.indexOf(FROM_EMAIL) === -1) {
      Logger.log('⚠️  WARNING: ' + FROM_EMAIL + ' is NOT in your Gmail aliases.');
      Logger.log('   You need to add it in Gmail → Settings → Accounts → "Send mail as"');
      Logger.log('   Follow the HOSTINGER EMAIL SETUP instructions at the top of this file.');
    } else {
      Logger.log('✅ ' + FROM_EMAIL + ' is configured as a Gmail alias.');
    }
  } catch (aliasError) {
    Logger.log('❌ Could not check aliases (GmailApp not authorized): ' + aliasError.toString());
    Logger.log('   Click "Review Permissions" when prompted and grant Gmail access.');
  }

  // Test 2: Try sending with GmailApp
  try {
    GmailApp.sendEmail(testEmail, 'Propfolio Email Test (GmailApp)', '', {
      htmlBody: buildWelcomeEmail('Test', 'abc12345'),
      from: FROM_EMAIL,
      name: FROM_NAME
    });
    Logger.log('✅ GmailApp.sendEmail succeeded — check your inbox at ' + testEmail);
  } catch (gmailError) {
    Logger.log('❌ GmailApp.sendEmail FAILED: ' + gmailError.toString());

    // Test 3: Fallback — try MailApp
    try {
      MailApp.sendEmail({
        to: testEmail,
        subject: 'Propfolio Email Test (MailApp fallback)',
        htmlBody: buildWelcomeEmail('Test', 'abc12345'),
        name: FROM_NAME
      });
      Logger.log('✅ MailApp.sendEmail fallback succeeded — check your inbox at ' + testEmail);
    } catch (mailError) {
      Logger.log('❌ MailApp.sendEmail also FAILED: ' + mailError.toString());
    }
  }

  // Test 4: Check daily quota
  try {
    var remaining = MailApp.getRemainingDailyQuota();
    Logger.log('Daily email quota remaining: ' + remaining);
    if (remaining === 0) {
      Logger.log('⚠️  You have hit your daily email quota. Emails will resume tomorrow.');
    }
  } catch (quotaError) {
    Logger.log('Could not check quota: ' + quotaError.toString());
  }

  Logger.log('--- End Debug Test ---');
}

// ============================================================
// HOSTINGER SMTP EMAIL UTILITY
// ============================================================

/**
 * Send an email via Hostinger SMTP using MailApp
 * Google Apps Script's MailApp uses the script owner's Gmail by default.
 * To send FROM your Hostinger email (team@trypropfolio.com), we use
 * Gmail's "Send mail as" alias feature with Hostinger SMTP.
 *
 * ONE-TIME SETUP (required so emails come from team@trypropfolio.com):
 * 1. Open Gmail (the Google account that owns this Apps Script)
 * 2. Go to Settings (gear icon) > See all settings > Accounts tab
 * 3. Under "Send mail as", click "Add another email address"
 * 4. Name: Propfolio | Email: team@trypropfolio.com | Uncheck "Treat as alias"
 * 5. SMTP Server: smtp.hostinger.com | Port: 465 | SSL: Yes
 * 6. Username: team@trypropfolio.com | Password: (your Hostinger email password)
 * 7. Click "Add Account" — Gmail will send a verification code to team@trypropfolio.com
 * 8. Log into Hostinger webmail, find the verification email, enter the code in Gmail
 * 9. Done! Now Apps Script can send emails as team@trypropfolio.com
 *
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} html - HTML body of the email
 */
function sendEmail(to, subject, html) {
  try {
    GmailApp.sendEmail(to, subject, '', {
      htmlBody: html,
      from: FROM_EMAIL,
      name: FROM_NAME
    });
    Logger.log('Email sent successfully to ' + to);
  } catch (error) {
    // Fallback: if "Send mail as" alias isn't set up yet,
    // send from the default Gmail account
    Logger.log('Could not send from ' + FROM_EMAIL + ', falling back to default: ' + error.toString());
    try {
      MailApp.sendEmail({
        to: to,
        subject: subject,
        htmlBody: html,
        name: FROM_NAME
      });
      Logger.log('Fallback email sent successfully to ' + to);
    } catch (fallbackError) {
      Logger.log('Email send failed entirely: ' + fallbackError.toString());
    }
  }
}


// ============================================================
// EMAIL TEMPLATES
// ============================================================

// Logo hosted on your site — used in all email headers
// IMPORTANT: Email clients don't support SVG — must use PNG
var LOGO_URL = 'https://trypropfolio.com/logo-email.png';

/**
 * Shared email shell — layout based on reference design:
 * Logo (centered, white bg) → green accent divider → bold headline →
 * body copy → centered CTA button → help/support line → footer with
 * company info, copyright, privacy link
 */
function emailShell(bodyContent) {
  return '<!DOCTYPE html>'
    + '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">'
    + '<title>Propfolio</title></head>'
    + '<body style="margin:0;padding:0;background-color:#f5f6f8;-webkit-font-smoothing:antialiased;">'

    // Outer wrapper
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f6f8;">'
    + '<tr><td align="center" style="padding:40px 20px;">'

    // Inner card
    + '<table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">'

    // ── Logo area ──
    + '<tr><td align="center" style="padding:40px 40px 24px 40px;">'
    + '<img src="' + LOGO_URL + '" alt="Propfolio" width="130" height="39" style="display:block;border:0;" />'
    + '</td></tr>'

    // ── Green accent divider ──
    + '<tr><td align="center" style="padding:0 40px;">'
    + '<table width="80" cellpadding="0" cellspacing="0" border="0"><tr>'
    + '<td style="height:3px;background-color:#00e751;border-radius:2px;font-size:0;line-height:0;">&nbsp;</td>'
    + '</tr></table>'
    + '</td></tr>'

    // ── Body content ──
    + '<tr><td style="padding:32px 40px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">'
    + bodyContent
    + '</td></tr>'

    // ── Help / support line ──
    + '<tr><td style="padding:0 40px 32px 40px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">'
    + '<p style="color:#414346;font-size:14px;line-height:1.6;margin:0;">'
    + 'Have questions or need help? Find answers on our <a href="https://trypropfolio.com#faq" style="color:#184c3c;font-weight:600;text-decoration:none;">FAQ page</a>, '
    + 'or contact us at <a href="mailto:team@trypropfolio.com" style="color:#184c3c;font-weight:600;text-decoration:none;">team@trypropfolio.com</a>.'
    + '</p>'
    + '</td></tr>'

    // ── Footer ──
    + '<tr><td style="border-top:1px solid #e5e5e5;padding:24px 40px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">'
    + '<p style="color:#9a9ea3;font-size:12px;line-height:1.8;margin:0;">'
    + 'Propfolio<br>'
    + '<a href="https://trypropfolio.com" style="color:#9a9ea3;text-decoration:none;">trypropfolio.com</a><br>'
    + '&copy; 2026 Propfolio. All rights reserved.'
    + '</p>'
    + '<p style="margin:12px 0 0 0;">'
    + '<a href="https://trypropfolio.com#privacy" style="color:#184c3c;font-size:12px;font-weight:600;text-decoration:none;">Privacy policy</a>'
    + '</p>'
    + '</td></tr>'

    + '</table>'
    + '</td></tr>'
    + '</table>'
    + '</body></html>';
}


/**
 * Welcome email — sent to new waitlist registrants
 */
function buildWelcomeEmail(firstName, referralCode) {
  var referralLink = 'https://trypropfolio.com?ref=' + referralCode;

  var body = ''
    // Centered headline
    + '<h1 style="color:#1f2022;font-size:24px;font-weight:700;margin:0 0 28px 0;text-align:center;">'
    + 'You\'re on the Waitlist!'
    + '</h1>'

    // Greeting
    + '<p style="color:#414346;font-size:16px;line-height:1.6;margin:0 0 16px 0;">'
    + 'Hi ' + firstName + ','
    + '</p>'

    // Body copy
    + '<p style="color:#414346;font-size:16px;line-height:1.6;margin:0 0 16px 0;">'
    + 'You\'re officially on the Propfolio waitlist. As one of our first members, you\'ve locked in <strong>20% off for life</strong> on all paid plans.'
    + '</p>'

    + '<p style="color:#414346;font-size:16px;line-height:1.6;margin:0 0 16px 0;">'
    + 'We\'re building AI-powered property management that works across borders. You\'ll be among the first to try it when we launch in Q2 2026.'
    + '</p>'

    + '<p style="color:#414346;font-size:16px;line-height:1.6;margin:0 0 32px 0;">'
    + 'Want to unlock <strong>50% off for life</strong>? The top 5 referrers on our leaderboard before launch win. Share your unique link to start climbing.'
    + '</p>'

    // Centered CTA button
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:0 0 24px 0;">'
    + '<a href="' + referralLink + '" style="display:inline-block;background-color:#184c3c;color:#ffffff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">'
    + 'Share Your Referral Link'
    + '</a>'
    + '</td></tr></table>'

    // Referral link text
    + '<p style="color:#66696d;font-size:13px;line-height:1.5;margin:0 0 32px 0;text-align:center;">'
    + 'Your referral link: <a href="' + referralLink + '" style="color:#184c3c;word-break:break-all;">' + referralLink + '</a>'
    + '</p>';

  return emailShell(body);
}


/**
 * Referral notification email — sent to the referrer when someone they referred signs up
 */
function buildReferralNotificationEmail(referrerFirstName, newSignupFirstName, newSignupLastInitial, referralCount, leaderboardPosition) {
  // Build the position context paragraph
  var positionLabel = '';
  if (leaderboardPosition <= 5) {
    positionLabel = 'You\'re in the <strong>top 5</strong> &mdash; you\'re on track for 50% off for life! Keep sharing to hold your spot.';
  } else if (leaderboardPosition <= 10) {
    positionLabel = 'You\'re <strong>#' + leaderboardPosition + '</strong> on the leaderboard. A few more referrals could put you in the top 5 for 50% off for life!';
  } else {
    positionLabel = 'You have <strong>' + referralCount + ' referral' + (referralCount !== 1 ? 's' : '') + '</strong> so far. Keep sharing to climb the leaderboard and compete for 50% off for life.';
  }

  var body = ''
    // Centered headline
    + '<h1 style="color:#1f2022;font-size:24px;font-weight:700;margin:0 0 28px 0;text-align:center;">'
    + 'New Referral Signup!'
    + '</h1>'

    // Greeting
    + '<p style="color:#414346;font-size:16px;line-height:1.6;margin:0 0 16px 0;">'
    + 'Hi ' + referrerFirstName + ','
    + '</p>'

    // Who signed up
    + '<p style="color:#414346;font-size:16px;line-height:1.6;margin:0 0 16px 0;">'
    + '<strong>' + newSignupFirstName + ' ' + newSignupLastInitial + '.</strong> just joined the Propfolio waitlist using your referral link.'
    + '</p>'

    // Position context
    + '<p style="color:#414346;font-size:16px;line-height:1.6;margin:0 0 24px 0;">'
    + positionLabel
    + '</p>'

    // Stats boxes (two columns)
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;"><tr>'
    + '<td width="50%" align="center" valign="top" style="padding:0 8px 0 0;">'
    + '<table cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f6f8;border-radius:8px;width:100%;"><tr><td align="center" style="padding:20px;">'
    + '<p style="color:#184c3c;font-size:32px;font-weight:700;margin:0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">' + referralCount + '</p>'
    + '<p style="color:#66696d;font-size:11px;margin:6px 0 0 0;text-transform:uppercase;letter-spacing:0.5px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">Referrals</p>'
    + '</td></tr></table>'
    + '</td>'
    + '<td width="50%" align="center" valign="top" style="padding:0 0 0 8px;">'
    + '<table cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f6f8;border-radius:8px;width:100%;"><tr><td align="center" style="padding:20px;">'
    + '<p style="color:#184c3c;font-size:32px;font-weight:700;margin:0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">#' + leaderboardPosition + '</p>'
    + '<p style="color:#66696d;font-size:11px;margin:6px 0 0 0;text-transform:uppercase;letter-spacing:0.5px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">Rank</p>'
    + '</td></tr></table>'
    + '</td>'
    + '</tr></table>'

    // Centered CTA button
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:0 0 32px 0;">'
    + '<a href="https://trypropfolio.com#leaderboard" style="display:inline-block;background-color:#184c3c;color:#ffffff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">'
    + 'View the Leaderboard'
    + '</a>'
    + '</td></tr></table>';

  return emailShell(body);
}


// ============================================================
// REFERRAL LOOKUP HELPERS
// ============================================================

/**
 * Count how many referrals a given referral code has generated
 * and determine leaderboard position
 */
function getReferralStats(referralCode) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var rows = data.slice(1); // skip header

  // Count referrals for ALL codes
  var referralCounts = {};
  for (var i = 0; i < rows.length; i++) {
    var referredBy = String(rows[i][8]).trim();
    if (referredBy && referredBy !== '' && referredBy !== 'undefined') {
      referralCounts[referredBy] = (referralCounts[referredBy] || 0) + 1;
    }
  }

  var myCount = referralCounts[referralCode] || 0;

  // Determine leaderboard position (rank)
  var allCounts = [];
  for (var code in referralCounts) {
    allCounts.push(referralCounts[code]);
  }
  allCounts.sort(function(a, b) { return b - a; });

  var position = 1;
  for (var i = 0; i < allCounts.length; i++) {
    if (allCounts[i] > myCount) {
      position++;
    } else {
      break;
    }
  }

  return {
    count: myCount,
    position: position
  };
}

/**
 * Look up the referrer's info by their referral code
 */
function getReferrerByCode(referralCode) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var rows = data.slice(1);

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][7]).trim() === referralCode) {
      return {
        firstName: rows[i][1],
        lastName: rows[i][2],
        email: rows[i][3]
      };
    }
  }
  return null;
}


// ============================================================
// SECURITY HELPERS
// ============================================================

/**
 * Strip HTML tags and trim whitespace to prevent XSS / injection
 */
function sanitize(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Check if an email already exists in the spreadsheet
 * Returns true if duplicate found
 */
function isDuplicateEmail(sheet, email) {
  var data = sheet.getDataRange().getValues();
  var rows = data.slice(1); // skip header
  var normalizedEmail = email.toLowerCase().trim();

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][3]).toLowerCase().trim() === normalizedEmail) {
      return true;
    }
  }
  return false;
}

// ============================================================
// MAIN HANDLERS
// ============================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Security: honeypot check — reject if hidden field is filled
    if (data.website && String(data.website).trim() !== '') {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Security: sanitize all user input
    var firstName = sanitize(data.firstName || '');
    var lastName = sanitize(data.lastName || '');
    var email = sanitize(data.email || '').toLowerCase();
    var portfolioSize = sanitize(data.portfolioSize || '');
    var companySize = sanitize(data.companySize || '');
    var country = sanitize(data.country || '');
    var referralCode = sanitize(data.referralCode || '');
    var referredBy = sanitize(data.referredBy || '');
    var timestamp = data.timestamp || new Date().toISOString();

    // Security: basic email validation
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid email address.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Security: reject if first name or email is missing
    if (!firstName) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'First name is required.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Security: duplicate email check — prevent double signups
    if (isDuplicateEmail(sheet, email)) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'duplicate', message: 'This email is already on the waitlist.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Append new row with sanitized data
    sheet.appendRow([
      timestamp,
      firstName,
      lastName,
      email,
      portfolioSize,
      companySize,
      country,
      referralCode,
      referredBy
    ]);

    // --- Send Welcome Email ---
    if (email && firstName) {
      var welcomeHtml = buildWelcomeEmail(firstName, referralCode);
      sendEmail(
        email,
        'Welcome to the Propfolio waitlist, ' + firstName + '!',
        welcomeHtml
      );
    }

    // --- Send Referral Notification Email (if this signup was referred) ---
    if (referredBy && referredBy !== '' && referredBy !== 'undefined') {
      var referrer = getReferrerByCode(referredBy);
      if (referrer && referrer.email) {
        var stats = getReferralStats(referredBy);
        var notificationHtml = buildReferralNotificationEmail(
          referrer.firstName,
          firstName,
          String(lastName).charAt(0),
          stats.count,
          stats.position
        );
        sendEmail(
          referrer.email,
          referrer.firstName + ', your referral ' + firstName + ' just joined Propfolio!',
          notificationHtml
        );
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

    // If action=leaderboard, return leaderboard data
    if (action === 'leaderboard') {
      return getLeaderboard();
    }

    // Default: health check
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', message: 'Propfolio Waitlist API is running' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getLeaderboard() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  // Skip header row
  var rows = data.slice(1);
  var totalSignups = rows.length;

  // Count referrals per referral code
  // Column I (index 8) = "Referred By" — this is the referral code of whoever referred them
  // Column H (index 7) = "Referral Code" — this person's own referral code
  // Column B (index 1) = "First Name"
  // Column C (index 2) = "Last Name"
  // Column A (index 0) = "Timestamp"

  // Build a map of referral code -> referrer info
  var referrerMap = {}; // referralCode -> { firstName, lastName, timestamp }
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var referralCode = String(row[7]).trim();
    if (referralCode) {
      referrerMap[referralCode] = {
        firstName: row[1],
        lastName: row[2],
        timestamp: row[0]
      };
    }
  }

  // Count how many people each referral code brought in
  var referralCounts = {};
  for (var i = 0; i < rows.length; i++) {
    var referredBy = String(rows[i][8]).trim();
    if (referredBy && referredBy !== '' && referredBy !== 'undefined') {
      referralCounts[referredBy] = (referralCounts[referredBy] || 0) + 1;
    }
  }

  // Build leaderboard array
  var leaderboard = [];
  for (var code in referralCounts) {
    var info = referrerMap[code];
    if (info) {
      var joinDate = new Date(info.timestamp);
      var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var joinStr = monthNames[joinDate.getMonth()] + ' ' + joinDate.getDate();

      leaderboard.push({
        initials: (String(info.firstName).charAt(0) + String(info.lastName).charAt(0)).toUpperCase(),
        name: info.firstName + ' ' + String(info.lastName).charAt(0) + '.',
        joined: 'Joined ' + joinStr,
        referrals: referralCounts[code]
      });
    }
  }

  // Sort by referrals descending, take top 10
  leaderboard.sort(function(a, b) { return b.referrals - a.referrals; });
  leaderboard = leaderboard.slice(0, 10);

  // Calculate total referrals
  var totalReferrals = 0;
  for (var code in referralCounts) {
    totalReferrals += referralCounts[code];
  }

  var result = {
    status: 'success',
    leaderboard: leaderboard,
    totalReferrals: totalReferrals,
    totalSignups: totalSignups
  };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
