import type { SearchResultConfig } from '$lib/adapters/types';

export interface LoadResponse {
	results: SearchResultConfig[];
	query: string;
	sortFilter?: string;
	error: string | null;
}
