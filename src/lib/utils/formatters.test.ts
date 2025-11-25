import { describe, it, expect } from 'vitest';
import { formatCount, formatDate } from './formatters';

describe('formatCount', () => {
	it('should format small numbers with commas', () => {
		const result = formatCount(1234);

		expect(result).toBe('1,234');
	});

	it('should format large numbers with commas', () => {
		const result = formatCount(1234567);

		expect(result).toBe('1,234,567');
	});

	it('should format millions correctly', () => {
		const result = formatCount(12345678);

		expect(result).toBe('12,345,678');
	});

	it('should handle zero', () => {
		const result = formatCount(0);

		expect(result).toBe('0');
	});

	it('should handle single digit numbers', () => {
		const result = formatCount(5);

		expect(result).toBe('5');
	});

	it('should handle numbers less than 1000', () => {
		const result = formatCount(999);

		expect(result).toBe('999');
	});

	it('should handle exactly 1000', () => {
		const result = formatCount(1000);

		expect(result).toBe('1,000');
	});
});

describe('formatDate', () => {
	it('should format ISO date string correctly', () => {
		const result = formatDate('2023-05-15');

		expect(result).toBe('May 15, 2023');
	});

	it('should format ISO datetime string correctly', () => {
		const result = formatDate('2023-05-15T12:00:00Z');

		expect(result).toBe('May 15, 2023');
	});

	it('should handle different months', () => {
		const january = formatDate('2023-01-15');
		const december = formatDate('2023-12-25');

		expect(january).toBe('Jan 15, 2023');
		expect(december).toBe('Dec 25, 2023');
	});

	it('should handle different years', () => {
		const result2020 = formatDate('2020-06-15');
		const result2024 = formatDate('2024-06-15');

		expect(result2020).toBe('Jun 15, 2020');
		expect(result2024).toBe('Jun 15, 2024');
	});

	it('should return empty string for empty input', () => {
		const result = formatDate('');

		expect(result).toBe('');
	});

	it('should return original string for invalid date', () => {
		const result = formatDate('not-a-date');

		expect(result).toBe('not-a-date');
	});

	it('should handle date at start of year', () => {
		const result = formatDate('2023-01-01');

		expect(result).toBe('Jan 1, 2023');
	});

	it('should handle date at end of year', () => {
		const result = formatDate('2023-12-31');

		expect(result).toBe('Dec 31, 2023');
	});

	it('should handle leap year date', () => {
		const result = formatDate('2024-02-29');

		expect(result).toBe('Feb 29, 2024');
	});
});