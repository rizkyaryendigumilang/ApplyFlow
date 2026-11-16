import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSVToApplications, exportApplicationsToCSV } from '../data-transfer.ts';
import type { Application } from '../pb-types.ts';

test('parseCSVToApplications parses Google Sheet schema accurately', () => {
  const googleSheetCsv = [
    'Job Details,,,,,,,,,',
    'Company,Position,Link,Name of Contact,Email/Phone,Location,Type,Mode,Pay,Sent',
    'Apple,Engineer,www.apple.com,Steve Jobs,steve@apple.com,USA,Full-time,Remote,135/hr,"Email, resume"',
    'Microsoft,Data Analyst,www.microsoft.com,Bill Gates,bill@microsoft.com,USA,Part-time,In-person,125/hr,"CV, short vid intro"',
  ].join('\r\n');

  const apps = parseCSVToApplications(googleSheetCsv);
  assert.equal(apps.length, 2);

  const apple = apps[0];
  assert.equal(apple.company, 'Apple');
  assert.equal(apple.position, 'Engineer');
  assert.equal(apple.link, 'https://www.apple.com');
  assert.equal(apple.contactName, 'Steve Jobs');
  assert.equal(apple.contact, 'steve@apple.com');
  assert.equal(apple.location, 'USA');
  assert.equal(apple.type, 'Full-time');
  assert.equal(apple.mode, 'Remote');
  assert.equal(apple.pay, '135/hr');
  assert.equal(apple.salaryPeriod, 'hourly');
  assert.equal(apple.salaryMin, 135);
  assert.equal(apple.sent, 'Email, resume');

  const msft = apps[1];
  assert.equal(msft.company, 'Microsoft');
  assert.equal(msft.position, 'Data Analyst');
  assert.equal(msft.contactName, 'Bill Gates');
  assert.equal(msft.type, 'Part-time');
  assert.equal(msft.mode, 'In-person');
  assert.equal(msft.pay, '125/hr');
  assert.equal(msft.salaryPeriod, 'hourly');
  assert.equal(msft.salaryMin, 125);
  assert.equal(msft.sent, 'CV, short vid intro');
});

test('exportApplicationsToCSV exports 10 core fields matching spreadsheet with zero em-dashes', () => {
  const mockApps: Application[] = [
    {
      id: 'app-test-1',
      company: 'Apple',
      position: 'Engineer',
      link: 'https://jobs.apple.com',
      contactName: 'Steve Jobs',
      contact: 'steve@apple.com',
      location: 'USA',
      type: 'Full-time',
      mode: 'Remote',
      pay: '135/hr',
      salaryMin: 135,
      salaryMax: 0,
      salaryPeriod: 'hourly',
      status: 'Interview',
      sentAt: '2026-11-16',
      sent: 'Email, resume',
      cvVersion: 'CV-Tech-v1',
    },
  ];

  const csv = exportApplicationsToCSV(mockApps);
  assert.ok(csv.includes('Company,Position,Link,Name of Contact,Email/Phone,Location,Type,Mode,Pay,Sent'));
  assert.ok(csv.includes('"Apple","Engineer","https://jobs.apple.com","Steve Jobs","steve@apple.com","USA","Full-time","Remote","135/hr","Email, resume"'));
  assert.ok(!csv.includes('\u2014'), 'CSV should contain 0 em-dashes');
});
