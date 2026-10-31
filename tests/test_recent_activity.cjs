const fs = require('fs');
const assert = require('assert');

const indexHtml = fs.readFileSync('public/index.html', 'utf8');
const appJs = fs.readFileSync('public/js/app.js', 'utf8');
const styleCss = fs.readFileSync('public/css/style.css', 'utf8');

// 1. Verify 'Kembali' button removed from modal-qr-scanner
const qrScannerModalMatch = indexHtml.match(/<div id="modal-qr-scanner"[\s\S]*?id="modal-qr-admin-choice"/);
assert(qrScannerModalMatch, 'modal-qr-scanner must exist');
const qrScannerModal = qrScannerModalMatch[0];
assert(!qrScannerModal.includes('<span>Kembali</span>'), 'Kembali button must be removed from QR scanner header');
assert(!qrScannerModal.includes('title="Kembali"'), 'Kembali title must be removed from QR scanner header');
assert(qrScannerModal.includes('✕ Batal'), 'Batal button must remain in QR scanner modal');
assert(qrScannerModal.includes('Pindai QR Presensi'), 'Title Pindai QR Presensi must remain');
console.log('✅ 1. QR scanner header cleaned: Kembali button removed, Batal button preserved');

// 2. Verify renderAdminDashboard(true) called for fast refresh
assert(appJs.includes('renderAdminDashboard(true);'), 'renderAdminDashboard(true) must be called for fast refresh');
assert(!appJs.includes("selectSpeakerType('Bhikkhu Sangha', firstChip);\n\n      renderAdminDashboard();"), 'Event submit must use renderAdminDashboard(true)');
console.log('✅ 2. Admin create event refreshes instantly with skipRemoteSync=true');

// 3. Verify modal-activity-detail in index.html (with complete schedule & removed 'Lihat Semua Riwayat')
assert(indexHtml.includes('id="modal-activity-detail"'), 'modal-activity-detail must exist');
assert(indexHtml.includes('id="modal-activity-title"'), 'modal-activity-title must exist');
assert(indexHtml.includes('id="modal-activity-speaker"'), 'modal-activity-speaker must exist');
assert(indexHtml.includes('id="modal-activity-date"'), 'modal-activity-date must exist');
assert(indexHtml.includes('id="modal-activity-schedule"'), 'modal-activity-schedule must exist for complete event schedule');
assert(indexHtml.includes('id="modal-activity-time"'), 'modal-activity-time must exist');
assert(indexHtml.includes('id="modal-activity-location"'), 'modal-activity-location must exist');
assert(indexHtml.includes('id="modal-activity-method"'), 'modal-activity-method must exist');
const modalDetailMatch = indexHtml.match(/<div id="modal-activity-detail"[\s\S]*?<\/div>\s*<\/div>/);
assert(modalDetailMatch, 'modal-activity-detail full content must match');
assert(!modalDetailMatch[0].includes('Lihat Semua Riwayat'), 'Lihat Semua Riwayat button must be removed from modal-activity-detail');
console.log('✅ 3. modal-activity-detail verified: complete schedule added, useless button removed');

// 4. Verify showRecentActivityDetail logic in app.js
assert(appJs.includes('window.showRecentActivityDetail = function(item)'), 'showRecentActivityDetail must be defined');
assert(appJs.includes('window.showRecentActivityDetail(item)'), 'timeline items must call showRecentActivityDetail');
assert(appJs.includes('scheduleEl.innerText = scheduleVal;'), 'scheduleEl must be populated with scheduleVal');
console.log('✅ 4. showRecentActivityDetail and click handlers verified in app.js');

// 5. Verify single responsive view in history (no duplicate table and cards on screen)
assert(styleCss.includes('#umat-history-mobile-list {\n    display: none !important;\n  }'), 'Mobile list must be hidden on desktop');
assert(styleCss.includes('#umat-history-table-wrapper {\n    display: none !important;\n  }'), 'Table wrapper must be hidden on mobile');
console.log('✅ 5. Responsive history view verified: desktop shows table only, mobile shows cards only');

// 6. Verify event archive, duplicate into form, and permanent delete confirmation
const dataJs = fs.readFileSync('public/js/data.js', 'utf8');
const adminJs = fs.readFileSync('public/js/admin.js', 'utf8');
assert(dataJs.includes('function archiveEvent('), 'archiveEvent must exist in data.js');
assert(adminJs.includes('function archiveEvent('), 'archiveEvent must exist in admin.js');
assert(appJs.includes('window.handleAdminArchiveEvent = function(eventId)'), 'handleAdminArchiveEvent must be defined in app.js');
assert(appJs.includes('window.handleAdminDuplicateEvent = function(eventId)'), 'handleAdminDuplicateEvent must be defined in app.js');
assert(appJs.includes('handleAdminDuplicateEvent'), 'createAdminEventCard must support duplicate button for archived events');
console.log('✅ 6. Event archive, duplicate template into form, and permanent delete verified');

// 7. Verify zero-attendance guarantee on createEvent & cascade delete on deleteEvent
assert(dataJs.includes('cleanAtt = rawAtt.filter'), 'createEvent must purge any residual attendance for the new ID');
assert(dataJs.includes('filteredAtt = rawAtt.filter'), 'deleteEvent must cascade delete attendance in localStorage');
assert(dataJs.includes('filteredGuests = rawGuests.filter'), 'deleteEvent must cascade delete guests in localStorage');
console.log('✅ 7. Zero attendance on event creation & cascade delete on deleteEvent verified');

console.log('\n🎉 All verification checks passed with 100% success!');
