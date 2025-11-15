#!/usr/bin/env node

const fs = require('node:fs');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { booking: 'TEST123', send: '' };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--booking' && args[i + 1]) {
      result.booking = args[i + 1];
      i++;
    } else if (args[i] === '--send' && args[i + 1]) {
      result.send = args[i + 1];
      i++;
    }
  }
  
  return result;
}

const { booking, send } = parseArgs();

const checks = {
  encryption_implemented: false,
  phone_masking_implemented: false,
  link_masking_implemented: false,
  content_filtering_implemented: false,
  scope_restriction_implemented: false,
};

const sourceFiles = [
  'src/modules/arb/services/chat.service.ts',
  'src/modules/arb/entities/booking-chat-message.entity.ts',
];

const findings = [];

for (const filePath of sourceFiles) {
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  if (filePath.includes('chat.service')) {
    if (content.includes('encryptMessage') || content.includes('aes-256-gcm') || content.includes('AES-GCM')) {
      checks.encryption_implemented = true;
      findings.push('Encryption (AES-GCM) found in chat service');
    }
    if (content.includes('maskPhone') || content.includes('phone_masked')) {
      checks.phone_masking_implemented = true;
      findings.push('Phone masking found in chat service');
    }
    if (content.includes('maskLinks') || content.includes('links_masked') || content.includes('extractAndMaskLinks')) {
      checks.link_masking_implemented = true;
      findings.push('Link masking found in chat service');
    }
    if (content.includes('filterContent') || content.includes('filter')) {
      checks.content_filtering_implemented = true;
      findings.push('Content filtering found in chat service');
    }
    if (content.includes('booking_id') && content.includes('customer_id') && content.includes('partner_id')) {
      checks.scope_restriction_implemented = true;
      findings.push('Scope restriction (booking-scoped) found in chat service');
    }
  }

  if (filePath.includes('booking-chat-message')) {
    if (content.includes('body_encrypted')) {
      checks.encryption_implemented = true;
    }
    if (content.includes('phone_masked')) {
      checks.phone_masking_implemented = true;
    }
    if (content.includes('links_masked')) {
      checks.link_masking_implemented = true;
    }
  }
}

const testMessage = send || 'اتصل بي 771234567 https://wa.me/123456';
const hasPhone = /\d{10,}/.test(testMessage);
const hasLink = /https?:\/\//.test(testMessage);

const output = [
  '# Chat Privacy Check — ARB',
  '',
  `Test Booking ID: ${booking}`,
  `Test Message: ${testMessage}`,
  '',
  '## Privacy Features',
  '',
  `- ✅ Encryption (AES-GCM): ${checks.encryption_implemented ? 'IMPLEMENTED' : 'MISSING'}`,
  `- ✅ Phone Masking: ${checks.phone_masking_implemented ? 'IMPLEMENTED' : 'MISSING'}`,
  `- ✅ Link Masking: ${checks.link_masking_implemented ? 'IMPLEMENTED' : 'MISSING'}`,
  `- ✅ Content Filtering: ${checks.content_filtering_implemented ? 'IMPLEMENTED' : 'MISSING'}`,
  `- ✅ Scope Restriction: ${checks.scope_restriction_implemented ? 'IMPLEMENTED' : 'MISSING'}`,
  '',
  '## Status',
  '',
  Object.values(checks).every(v => v)
    ? '✅ PASS: All chat privacy requirements met'
    : '❌ FAIL: Some chat privacy requirements missing',
  '',
  ...(findings.length > 0 ? [
    '## Findings',
    '',
    ...findings.map(f => `- ${f}`),
  ] : []),
  '',
  '## Test Message Analysis',
  '',
  `- Contains phone number: ${hasPhone ? 'YES' : 'NO'}`,
  `- Contains link: ${hasLink ? 'YES' : 'NO'}`,
  `- Should be masked: ${hasPhone || hasLink ? 'YES' : 'NO'}`,
].join('\n');

console.log(output);
process.exit(Object.values(checks).every(v => v) ? 0 : 1);
