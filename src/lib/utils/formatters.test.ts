import { describe, it, expect } from 'vitest';
import { formatCount, formatDate, formatDuration, parseIsoDuration } from './formatters';

describe('formatCount', () => {
	it.each([
		[0, '0'],
		[999, '999'],
		[1000, '1,000'],
		[1234567, '1,234,567']
	])('%d → %s', (input, expected) => {
		expect(formatCount(input)).toBe(expected);
	});
});

describe('formatDate', () => {
	it.each([
		['ISO date', '2023-05-15', 'May 15, 2023'],
		['ISO datetime', '2023-05-15T12:00:00Z', 'May 15, 2023'],
		['start of year', '2023-01-01', 'Jan 1, 2023'],
		['end of year', '2023-12-31', 'Dec 31, 2023'],
		['invalid date → original string', 'not-a-date', 'not-a-date'],
		['empty string → empty', '', '']
	])('%s: %j → %j', (_label, input, expected) => {
		expect(formatDate(input)).toBe(expected);
	});
});

describe('formatDuration', () => {
	it.each([
		[0, '0:00'],
		[59, '0:59'],
		[60, '1:00'],
		[860, '14:20'],
		[3599, '59:59'],
		[3600, '1:00:00'],
		[3723, '1:02:03'],
		[45296, '12:34:56'],
		[86400, '24:00:00']
	])('%d seconds → %s', (input, expected) => {
		expect(formatDuration(input)).toBe(expected);
	});
});

describe('parseIsoDuration', () => {
	it.each([
		['PT1H2M3S', 3723],
		['PT45M', 2700],
		['PT30S', 30],
		['PT2H', 7200],
		['PT1H30S', 3630],
		['PT1M30.5S', 90.5],
		['PT10H30M45S', 37845],
		['PT0S', 0],
		['INVALID', 0],
		['', 0],
		[null as never, 0]
	])('parses %j → %d seconds', (input, expected) => {
		expect(parseIsoDuration(input)).toBe(expected);
	});
});