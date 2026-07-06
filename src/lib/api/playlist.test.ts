/**
 * Test Suite: playlist.ts (api)
 *
 * Tests for playlist fetching including JSON parsing, API request construction,
 * error handling, and edge cases
 */

import { describeJsonFetcher } from '../../tests/helpers/describeJsonFetcher';
import { getPlaylist } from './playlist';
import playlistFixture from '../../tests/fixtures/api/playlistResponse.json'

describeJsonFetcher({
	name: 'getPlaylist',
	call: getPlaylist,
	endpoint: '/playlists',
	fixture: playlistFixture
});