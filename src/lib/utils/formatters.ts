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

/**
 * Formats duration from number of seconds to H:M:S format
 * Example: 860 -> "14:20"
 */
export const formatDuration = (seconds: number): string => {
	const hours: number = Math.floor(seconds / 3600);
	const minutes: number = Math.floor((seconds % 3600) / 60);
	const secs: number = seconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${secs.toString().padStart(2, '0')}`;
};
