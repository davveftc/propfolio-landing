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
// IMPORTANT: After updating this script, you must create a
// NEW deployment version for changes to take effect:
//   Deploy > Manage deployments > Edit (pencil icon) >
//   Version: "New version" > Deploy
// ============================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Append new row
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.firstName || '',
      data.lastName || '',
      data.email || '',
      data.portfolioSize || '',
      data.companySize || '',
      data.country || '',
      data.referralCode || '',
      data.referredBy || ''
    ]);

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
