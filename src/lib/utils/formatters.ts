/**
 * Formats a number into a human-readable count string
 * Examples: 1234 -> "1,234", 1234567 -> "1,234,567"
 */
export function formatCount(count: number): string {
	const formatter = new Intl.NumberFormat('en-US');
	return formatter.format(count);
}

/**
 * Formats an upload date string into a human-readable date
 * Examples: "2023-05-15" -> "May 15, 2023"
 */
export function formatDate(dateString: string): string {
	if (!dateString) {
		return '';
	}

	const date = new Date(dateString);
	
	// Check if date is valid
	if (isNaN(date.getTime())) {
		return dateString; // Return original string if invalid
	}

	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}