/**
 * Curated Safe Educational Scam Presets
 * 
 * Demonstrates real-world social engineering attack patterns for educational evaluation.
 * Clearly labeled as demo and educational content.
 */

import { ExampleCase } from '../types.js';

export const EDUCATIONAL_EXAMPLES: ExampleCase[] = [
  {
    id: 'ex_bank_alert',
    title: 'Bank Impersonation & Urgent OTP Lure',
    channel: 'sms',
    expectedRisk: 'CRITICAL',
    preview: 'CHASE BANK ALERT: Unauthorized $1,429 transfer detected. Act now...',
    text: 'CHASE BANK ALERT: Unauthorized wire transfer of $1,429.50 attempted on your debit card. If this was not you, reply with your OTP verification code immediately or your account will be suspended within 2 hours.',
    description: 'Classic smishing scenario combining brand impersonation, urgent panic, direct OTP theft demand, and an artificial suspension deadline.',
  },
  {
    id: 'ex_delivery_scam',
    title: 'Postal Courier Redelivery Fee Phishing',
    channel: 'sms',
    expectedRisk: 'HIGH',
    preview: 'USPS: Your package could not be delivered due to an incomplete address...',
    text: 'USPS Notice: Your package could not be delivered due to an incomplete street address. A clearance fee of $2.99 is required to reschedule dispatch. Please confirm your details immediately: https://usps-redelivery-portal.com',
    description: 'Smishing scam exploiting routine e-commerce deliveries to capture credit card numbers via a small advance fee and typosquatted link.',
  },
  {
    id: 'ex_legal_threat',
    title: 'Law Enforcement / Tax Coercion Extortion',
    channel: 'email',
    expectedRisk: 'CRITICAL',
    preview: 'IRS FINAL WARNING: Legal action and arrest warrant pending against you...',
    text: 'INTERNAL REVENUE SERVICE: Urgent attention required! An arrest warrant will be issued by local law enforcement within 24 hours regarding unpaid tax penalties. Immediate action required: settle via Apple gift cards or wire transfer to avoid immediate federal detention.',
    description: 'Aggressive extortion scam exploiting fear of legal prosecution and demanding payment in untraceable gift cards.',
  },
  {
    id: 'ex_prize_lottery',
    title: 'Unsolicited Prize & Fee Advance Bait',
    channel: 'email',
    expectedRisk: 'HIGH',
    preview: 'Congratulations! You have been selected as the grand prize winner...',
    text: 'Congratulations! You have been selected as the lucky winner of our $500,000 international sweepstakes grant. To claim your reward, an administrative processing fee of $150 must be wired to our agent via Western Union before end of day.',
    description: 'Advance-fee fraud tempting the recipient with an imaginary windfall while requiring upfront payments.',
  },
  {
    id: 'ex_job_recruiter',
    title: 'Remote Job Bait & Channel Diversion',
    channel: 'social_dm',
    expectedRisk: 'HIGH',
    preview: 'Hello! Our recruitment team noticed your profile for a remote assistant...',
    text: 'Hello! Our global recruitment agency noticed your profile for a remote data assistant role ($65/hr). No experience needed. Immediate action required. Please contact our HR manager on Telegram username: @GlobalRecruiterHR to conduct the interview and receive your startup check.',
    description: 'Recruitment scam moving the victim off-platform to avoid fraud detection, typically leading to fake check cashing fraud.',
  },
  {
    id: 'ex_benign_meeting',
    title: 'Legitimate Corporate Deadline Notice',
    channel: 'email',
    expectedRisk: 'BENIGN',
    preview: 'Team, please submit your quarterly slide deck before 5 PM today...',
    text: 'Hi team, please submit your quarterly project slides before 5 PM today so we can finalize the review for tomorrow morning’s executive meeting. Let me know if you need any help with the figures.',
    description: 'A benign professional message containing an everyday operational deadline without threats, payments, or credential harvesting.',
  },
  {
    id: 'ex_benign_casual',
    title: 'Benign Personal SMS',
    channel: 'sms',
    expectedRisk: 'BENIGN',
    preview: 'Hey! Are we still meeting for lunch at the cafe around 12:30?...',
    text: 'Hey! Are we still meeting for lunch at the cafe around 12:30? Let me know if you want me to grab a table ahead of time.',
    description: 'Routine interpersonal text with zero suspicious indicators.',
  },
];
