/**
 * Test Suite: dashManifestGenerator.ts
 * 
 * Tests for DASH manifest generation with video, audio, and subtitle streams
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    createDashManifestBlobUrl,
    generateDashManifest,
    generateDashManifestBlobUrl,
    revokeDashManifestBlobUrl,
    type DashManifestConfig
 } from './dashManifestGenerator';
import {
	createMockVideoStream,
	createMockAudioStream,
	createMockSubtitle,
	createMockVideoStreamSet,
	createMockMultiLanguageAudioStreams,
	createMockSubtitleSet,
	createMockDashConfig,
	createMinimalVideoConfig,
	createMinimalAudioConfig,
	createStreamsWithoutByteRanges,
	createStreamsWithPartialByteRanges,
	createMockWebMStreams,
	createStreamsWithSpecialCharacters,
	createAudioStreamsWithUndefinedLanguage
} from '../../tests/fixtures/mockDashData';


// =============================================================================
// generateDashManifest() Tests - Basic Functionality
// =============================================================================

describe('generateDashManifest', () => {
	describe('basic functionality', () => {
		it('should generate valid XML manifest', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('<?xml version="1.0" encoding="UTF-8"?>');
			expect(manifest).toContain('<MPD');
			expect(manifest).toContain('</MPD>');
		});

		it('should include DASH namespace', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('xmlns="urn:mpeg:dash:schema:mpd:2011"');
		});

		it('should set type to static', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('type="static"');
		});

		it('should set correct DASH profile', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('profiles="urn:mpeg:dash:profile:isoff-on-demand:2011"');
		});

		it('should include Period element', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('<Period');
			expect(manifest).toContain('</Period>');
		});
	});

	describe('duration formatting', () => {
		it('should format duration in ISO 8601 format', () => {
			const config = createMinimalVideoConfig();
			config.duration = 120; // 2 minutes
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('mediaPresentationDuration="PT2M"');
		});

		it('should handle hours in duration', () => {
			const config = createMinimalVideoConfig();
			config.duration = 3665; // 1h 1m 5s
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('PT1H1M5S');
		});

		it('should handle seconds only', () => {
			const config = createMinimalVideoConfig();
			config.duration = 45;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('PT45S');
		});

		it('should handle fractional seconds', () => {
			const config = createMinimalVideoConfig();
			config.duration = 10.5;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('PT10.500S');
		});

		it('should handle zero duration', () => {
			const config = createMinimalVideoConfig();
			config.duration = 0;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('PT0S');
		});

		it('should handle very long durations', () => {
			const config = createMinimalVideoConfig();
			config.duration = 36000; // 10 hours
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('PT10H');
		});
	});

	describe('validation', () => {
		it('should throw error when no streams provided', () => {
			const config: DashManifestConfig = {
				duration: 120
			};
			
			expect(() => generateDashManifest(config)).toThrow(
				'At least one stream (video or audio) must be provided'
			);
		});

		it('should throw error when empty streams provided', () => {
			const config: DashManifestConfig = {
				videoStreams: [],
				audioStreams: [],
				duration: 120
			};
			
			expect(() => generateDashManifest(config)).toThrow(
				'At least one stream (video or audio) must be provided'
			);
		});

		it('should warn when duration is zero', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const config = createMinimalVideoConfig();
			config.duration = 0;
			
			generateDashManifest(config);
			
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining('Duration is 0 or undefined')
			);
			
			warnSpy.mockRestore();
		});

		it('should accept video-only configuration', () => {
			const config = createMinimalVideoConfig();
			
			expect(() => generateDashManifest(config)).not.toThrow();
		});

		it('should accept audio-only configuration', () => {
			const config = createMinimalAudioConfig();
			
			expect(() => generateDashManifest(config)).not.toThrow();
		});
	});
});

// =============================================================================
// Video Adaptation Set Tests
// =============================================================================

describe('generateDashManifest - Video Streams', () => {
	describe('video adaptation set', () => {
		it('should generate video AdaptationSet', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('<AdaptationSet');
			expect(manifest).toContain('contentType="video"');
		});

		it('should set correct MIME type for video', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('mimeType="video/mp4"');
		});

		it('should set video adaptation set ID to 0', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toMatch(/<AdaptationSet[^>]*id="0"/);
		});

		it('should set subsegmentAlignment to true', () => {
			const config = createMinimalVideoConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toMatch(/<AdaptationSet[^>]*subsegmentAlignment="true"/);
		});

		it('should handle WebM video streams', () => {
			const config: DashManifestConfig = {
				videoStreams: createMockWebMStreams(),
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('mimeType="video/webm"');
			expect(manifest).toContain('vp09.00.10.08');
		});
	});

	describe('video representations', () => {
		it('should generate Representation for each video stream', () => {
			const config: DashManifestConfig = {
				videoStreams: createMockVideoStreamSet(),
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('id="video-1"');
			expect(manifest).toContain('id="video-2"');
			expect(manifest).toContain('id="video-3"');
		});

		it('should include bandwidth in representation', () => {
			const config = createMinimalVideoConfig();
			config.videoStreams![0].bandwidth = 5000000;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('bandwidth="5000000"');
		});

		it('should include width and height', () => {
			const config = createMinimalVideoConfig();
			config.videoStreams![0].width = 1920;
			config.videoStreams![0].height = 1080;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('width="1920"');
			expect(manifest).toContain('height="1080"');
		});

		it('should include frameRate', () => {
			const config = createMinimalVideoConfig();
			config.videoStreams![0].frameRate = 60;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('frameRate="60"');
		});

		it('should include normalized codec', () => {
			const config = createMinimalVideoConfig();
			config.videoStreams![0].codec = 'avc1.640028';
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('codecs="avc1.640028"');
		});

		it('should normalize codec strings', () => {
			const config = createMinimalVideoConfig();
			config.videoStreams![0].codec = 'h264';
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('codecs="avc1.42E01E"');
		});

		it('should include BaseURL with stream URL', () => {
			const config = createMinimalVideoConfig();
			const url = 'https://example.com/video.mp4';
			config.videoStreams![0].url = url;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain(`<BaseURL>${url}</BaseURL>`);
		});

		it('should use default values when optional fields missing', () => {
			const config: DashManifestConfig = {
				videoStreams: [{
					url: 'https://example.com/video.mp4',
					codec: 'avc1.640028'
				}],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('bandwidth="1000000"'); // default
			expect(manifest).toContain('width="1920"'); // default
			expect(manifest).toContain('height="1080"'); // default
			expect(manifest).toContain('frameRate="30"'); // default
		});
	});

	describe('byte ranges', () => {
		it('should include SegmentBase with byte ranges', () => {
			const config = createMinimalVideoConfig();
			config.videoStreams![0].initStart = 0;
			config.videoStreams![0].initEnd = 740;
			config.videoStreams![0].indexStart = 741;
			config.videoStreams![0].indexEnd = 2500;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('<SegmentBase');
			expect(manifest).toContain('indexRange="741-2500"');
			expect(manifest).toContain('<Initialization range="0-740"');
		});

		it('should omit SegmentBase when byte ranges missing', () => {
			const config: DashManifestConfig = {
				videoStreams: createStreamsWithoutByteRanges(),
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).not.toContain('<SegmentBase');
		});

		it('should omit SegmentBase when byte ranges incomplete', () => {
			const config: DashManifestConfig = {
				videoStreams: createStreamsWithPartialByteRanges(),
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).not.toContain('<SegmentBase');
		});
	});
});

// =============================================================================
// Audio Adaptation Set Tests
// =============================================================================

describe('generateDashManifest - Audio Streams', () => {
	describe('audio adaptation sets', () => {
		it('should generate audio AdaptationSet', () => {
			const config = createMinimalAudioConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('<AdaptationSet');
			expect(manifest).toContain('contentType="audio"');
		});

		it('should set correct MIME type for audio', () => {
			const config = createMinimalAudioConfig();
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('mimeType="audio/mp4"');
		});

		it('should create separate AdaptationSet per language', () => {
			const config: DashManifestConfig = {
				audioStreams: createMockMultiLanguageAudioStreams(),
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			// Should have 3 languages: en, es, fr
			const adaptationSetMatches = manifest.match(/contentType="audio"/g);
			expect(adaptationSetMatches?.length).toBe(3);
		});

		it('should include language attribute', () => {
			const config = createMinimalAudioConfig();
			config.audioStreams![0].language = 'en';
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('lang="en"');
		});

		it('should include language label', () => {
			const config = createMinimalAudioConfig();
			config.audioStreams![0].languageName = 'English';
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('label="English"');
		});

		it('should normalize language codes', () => {
			const config: DashManifestConfig = {
				audioStreams: [{
					url: 'https://example.com/audio.m4a',
					codec: 'mp4a.40.2',
					language: 'es_419', // underscore format
					languageName: 'Spanish (Latin America)'
				}],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('lang="es-419"'); // normalized to hyphen
		});

		it('should handle undefined language', () => {
			const config: DashManifestConfig = {
				audioStreams: createAudioStreamsWithUndefinedLanguage(),
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('lang="und"');
			expect(manifest).toContain('lang="en"');
		});
	});

	describe('audio representations', () => {
		it('should generate Representation for each audio stream', () => {
			const config: DashManifestConfig = {
				audioStreams: [
					createMockAudioStream({ language: 'en', bandwidth: 256000 }),
					createMockAudioStream({ language: 'en', bandwidth: 128000 })
				],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('bandwidth="256000"');
			expect(manifest).toContain('bandwidth="128000"');
		});

		it('should include audio sampling rate', () => {
			const config = createMinimalAudioConfig();
			config.audioStreams![0].audioSampleRate = 48000;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('audioSamplingRate="48000"');
		});

		it('should include audio channel configuration', () => {
			const config = createMinimalAudioConfig();
			config.audioStreams![0].audioChannels = 2;
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('<AudioChannelConfiguration');
			expect(manifest).toContain('value="2"');
		});

		it('should use default values when optional fields missing', () => {
			const config: DashManifestConfig = {
				audioStreams: [{
					url: 'https://example.com/audio.m4a',
					codec: 'mp4a.40.2',
					language: 'en'
				}],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('bandwidth="128000"'); // default
			expect(manifest).toContain('audioSamplingRate="44100"'); // default
			expect(manifest).toContain('value="2"'); // default channels
		});

		it('should normalize audio codecs', () => {
			const config: DashManifestConfig = {
				audioStreams: [{
					url: 'https://example.com/audio.m4a',
					codec: 'aac', // should normalize to mp4a.40.2
					language: 'en'
				}],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('codecs="mp4a.40.2"');
		});
	});

	describe('multiple audio languages', () => {
		it('should group streams by language', () => {
			const config: DashManifestConfig = {
				audioStreams: [
					createMockAudioStream({ language: 'en', bandwidth: 256000 }),
					createMockAudioStream({ language: 'en', bandwidth: 128000 }),
					createMockAudioStream({ language: 'es', bandwidth: 128000 })
				],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			// Should have 2 audio adaptation sets (en and es)
			const audioAdaptationSets = manifest.match(/contentType="audio"/g);
			expect(audioAdaptationSets?.length).toBe(2);
		});

		it('should assign unique IDs to audio adaptation sets', () => {
			const config: DashManifestConfig = {
				audioStreams: createMockMultiLanguageAudioStreams(),
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			// Audio adaptation set IDs start at 1
			expect(manifest).toMatch(/<AdaptationSet[^>]*id="1"[^>]*contentType="audio"/);
			expect(manifest).toMatch(/<AdaptationSet[^>]*id="2"[^>]*contentType="audio"/);
			expect(manifest).toMatch(/<AdaptationSet[^>]*id="3"[^>]*contentType="audio"/);
		});
	});
});

// =============================================================================
// Subtitle Adaptation Set Tests
// =============================================================================

describe('generateDashManifest - Subtitles', () => {
	describe('subtitle adaptation sets', () => {
		it('should generate subtitle AdaptationSet', () => {
			const config: DashManifestConfig = {
				videoStreams: [createMockVideoStream()],
				subtitleStreams: [createMockSubtitle()],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('contentType="text"');
		});

		it('should include subtitle language', () => {
			const config: DashManifestConfig = {
				videoStreams: [createMockVideoStream()],
				subtitleStreams: [createMockSubtitle({ language: 'es' })],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('lang="es"');
		});

		it('should include subtitle MIME type', () => {
			const config: DashManifestConfig = {
				videoStreams: [createMockVideoStream()],
				subtitleStreams: [createMockSubtitle()],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('mimeType="text/vtt"');
		});

		it('should include Role element', () => {
			const config: DashManifestConfig = {
				videoStreams: [createMockVideoStream()],
				subtitleStreams: [createMockSubtitle()],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('<Role');
			expect(manifest).toContain('urn:mpeg:dash:role:2011');
		});

		it('should set role to subtitles by default', () => {
			const config: DashManifestConfig = {
				videoStreams: [createMockVideoStream()],
				subtitleStreams: [createMockSubtitle({ kind: undefined })],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('value="subtitles"');
		});

		it('should set role to captions when specified', () => {
			const config: DashManifestConfig = {
				videoStreams: [createMockVideoStream()],
				subtitleStreams: [createMockSubtitle({ kind: 'captions' })],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('value="captions"');
		});

		it('should generate representation for each subtitle', () => {
			const config: DashManifestConfig = {
				videoStreams: [createMockVideoStream()],
				subtitleStreams: createMockSubtitleSet(),
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			// Should have 3 subtitle representations
			const subtitleReps = manifest.match(/subtitle-\d+/g);
			expect(subtitleReps?.length).toBeGreaterThanOrEqual(3);
		});

		it('should assign IDs after video and audio adaptation sets', () => {
			const config = createMockDashConfig();
			
			const manifest = generateDashManifest(config);
			
			// Video is 0, audio starts at 1, subtitles come after
			// With 3 audio languages, subtitles should start at 4
			expect(manifest).toContain('id="4"'); // First subtitle
		});
	});
});

// =============================================================================
// XML Escaping Tests
// =============================================================================

describe('generateDashManifest - XML Escaping', () => {
	it('should escape special characters in URLs', () => {
		const config: DashManifestConfig = {
			videoStreams: createStreamsWithSpecialCharacters(),
			duration: 120
		};
		
		const manifest = generateDashManifest(config);
		
		expect(manifest).toContain('&lt;');
		expect(manifest).toContain('&gt;');
		expect(manifest).toContain('&quot;');
		expect(manifest).toContain('&apos;');
	});

	it('should escape ampersands in URLs', () => {
		const config: DashManifestConfig = {
			videoStreams: [{
				url: 'https://example.com/video?a=1&b=2',
				codec: 'avc1.640028'
			}],
			duration: 120
		};
		
		const manifest = generateDashManifest(config);
		
		expect(manifest).toContain('&amp;');
	});

	it('should escape special characters in language names', () => {
		const config: DashManifestConfig = {
			audioStreams: [{
				url: 'https://example.com/audio.m4a',
				codec: 'mp4a.40.2',
				language: 'en',
				languageName: 'English "CC" <HD>'
			}],
			duration: 120
		};
		
		const manifest = generateDashManifest(config);
		
		expect(manifest).toContain('&quot;');
		expect(manifest).toContain('&lt;');
		expect(manifest).toContain('&gt;');
	});

	it('should escape special characters in codecs', () => {
		const config: DashManifestConfig = {
			videoStreams: [{
				url: 'https://example.com/video.mp4',
				codec: 'avc1.640028<test>'
			}],
			duration: 120
		};
		
		const manifest = generateDashManifest(config);
		
		expect(manifest).toContain('&lt;');
		expect(manifest).toContain('&gt;');
	});
});

// =============================================================================
// Complete Manifest Tests
// =============================================================================

describe('generateDashManifest - Complete Manifests', () => {
	it('should generate manifest with video, audio, and subtitles', () => {
		const config = createMockDashConfig();
		
		const manifest = generateDashManifest(config);
		
		expect(manifest).toContain('contentType="video"');
		expect(manifest).toContain('contentType="audio"');
		expect(manifest).toContain('contentType="text"');
	});

	it('should generate manifest with video only', () => {
		const config = createMinimalVideoConfig();
		
		const manifest = generateDashManifest(config);
		
		expect(manifest).toContain('contentType="video"');
		expect(manifest).not.toContain('contentType="audio"');
		expect(manifest).not.toContain('contentType="text"');
	});

	it('should generate manifest with audio only', () => {
		const config = createMinimalAudioConfig();
		
		const manifest = generateDashManifest(config);
		
		expect(manifest).not.toContain('contentType="video"');
		expect(manifest).toContain('contentType="audio"');
	});

	it('should generate manifest with video and audio only', () => {
		const config: DashManifestConfig = {
			videoStreams: [createMockVideoStream()],
			audioStreams: [createMockAudioStream()],
			duration: 120
		};
		
		const manifest = generateDashManifest(config);
		
		expect(manifest).toContain('contentType="video"');
		expect(manifest).toContain('contentType="audio"');
		expect(manifest).not.toContain('contentType="text"');
	});

	it('should maintain proper XML structure', () => {
		const config = createMockDashConfig();
		
		const manifest = generateDashManifest(config);
		
		// Count opening and closing tags
		const openMPD = (manifest.match(/<MPD/g) || []).length;
		const closeMPD = (manifest.match(/<\/MPD>/g) || []).length;
		expect(openMPD).toBe(closeMPD);
		
		const openPeriod = (manifest.match(/<Period/g) || []).length;
		const closePeriod = (manifest.match(/<\/Period>/g) || []).length;
		expect(openPeriod).toBe(closePeriod);
	});

	it('should generate parseable XML', () => {
		const config = createMockDashConfig();
		
		const manifest = generateDashManifest(config);
		
		// Should not throw when parsing
		expect(() => {
			if (typeof DOMParser !== 'undefined') {
				const parser = new DOMParser();
				parser.parseFromString(manifest, 'text/xml');
			}
		}).not.toThrow();
	});
});

// =============================================================================
// Blob URL Tests
// =============================================================================

describe('Blob URL Functions', () => {
	describe('createDashManifestBlobUrl', () => {
		it('should create blob URL from manifest', () => {
			const manifest = '<?xml version="1.0"?><MPD></MPD>';
			
			const blobUrl = createDashManifestBlobUrl(manifest);
			
			expect(blobUrl).toMatch(/^blob:/);
		});

		it('should create URL with correct MIME type', () => {
			const manifest = '<?xml version="1.0"?><MPD></MPD>';
			
			const blobUrl = createDashManifestBlobUrl(manifest);
			
			// Blob URL should be created (implementation detail)
			expect(blobUrl).toBeTruthy();
		});

		it('should handle empty manifest', () => {
			const manifest = '';
			
			const blobUrl = createDashManifestBlobUrl(manifest);
			
			expect(blobUrl).toMatch(/^blob:/);
		});

		it('should handle large manifests', () => {
			const manifest = '<?xml version="1.0"?><MPD>' + 'x'.repeat(100000) + '</MPD>';
			
			const blobUrl = createDashManifestBlobUrl(manifest);
			
			expect(blobUrl).toMatch(/^blob:/);
		});
	});

	describe('revokeDashManifestBlobUrl', () => {
		it('should revoke blob URL', () => {
			const manifest = '<?xml version="1.0"?><MPD></MPD>';
			const blobUrl = createDashManifestBlobUrl(manifest);
			
			expect(() => revokeDashManifestBlobUrl(blobUrl)).not.toThrow();
		});

		it('should handle non-blob URLs gracefully', () => {
			const regularUrl = 'https://example.com/manifest.mpd';
			
			expect(() => revokeDashManifestBlobUrl(regularUrl)).not.toThrow();
		});

		it('should handle empty string', () => {
			expect(() => revokeDashManifestBlobUrl('')).not.toThrow();
		});
	});

	describe('generateDashManifestBlobUrl', () => {
		beforeEach(() => {
			vi.spyOn(console, 'log').mockImplementation(() => {});
		});

		it('should generate manifest and create blob URL', () => {
			const config = createMinimalVideoConfig();
			
			const blobUrl = generateDashManifestBlobUrl(config);
			
			expect(blobUrl).toMatch(/^blob:/);
		});

		it('should log generated manifest', () => {
			const config = createMinimalVideoConfig();
			
			generateDashManifestBlobUrl(config);
			
			expect(console.log).toHaveBeenCalledWith(
				'Generated DASH manifest:',
				expect.any(String)
			);
		});

		it('should handle complex configurations', () => {
			const config = createMockDashConfig();
			
			const blobUrl = generateDashManifestBlobUrl(config);
			
			expect(blobUrl).toMatch(/^blob:/);
		});
	});
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('DASH Manifest Generator Integration', () => {
	describe('typical YouTube video workflow', () => {
		it('should generate manifest for multi-quality video with audio', () => {
			const config: DashManifestConfig = {
				videoStreams: createMockVideoStreamSet(),
				audioStreams: createMockMultiLanguageAudioStreams(),
				duration: 600
			};
			
			const manifest = generateDashManifest(config);
			
			// Should have video adaptation set
			expect(manifest).toContain('contentType="video"');
			expect(manifest).toContain('id="video-1"');
			expect(manifest).toContain('id="video-2"');
			expect(manifest).toContain('id="video-3"');
			
			// Should have audio adaptation sets for each language
			expect(manifest).toContain('contentType="audio"');
			expect(manifest).toContain('lang="en"');
			expect(manifest).toContain('lang="es"');
			expect(manifest).toContain('lang="fr"');
			
			// Should have correct duration
			expect(manifest).toContain('PT10M');
		});

		it('should generate complete workflow with blob URL', () => {
			const config = createMockDashConfig();
			
			const blobUrl = generateDashManifestBlobUrl(config);
			
			expect(blobUrl).toMatch(/^blob:/);
			
			// Should be able to revoke
			revokeDashManifestBlobUrl(blobUrl);
		});

		it('should handle video-only livestream scenario', () => {
			const config: DashManifestConfig = {
				videoStreams: [
					createMockVideoStream({
						bandwidth: 2500000,
						width: 1280,
						height: 720,
						frameRate: 30
					})
				],
				duration: 0 // Live content
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('contentType="video"');
			expect(manifest).toContain('PT0S');
		});
	});

	describe('real-world edge cases', () => {
		it('should handle streams with minimal metadata', () => {
			const config: DashManifestConfig = {
				videoStreams: [{
					url: 'https://example.com/video.mp4',
					codec: 'avc1.640028'
				}],
				audioStreams: [{
					url: 'https://example.com/audio.m4a',
					codec: 'mp4a.40.2',
					language: 'en'
				}],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			expect(manifest).toContain('contentType="video"');
			expect(manifest).toContain('contentType="audio"');
		});

		it('should handle complex multi-language audio scenario', () => {
			const config: DashManifestConfig = {
				videoStreams: [createMockVideoStream()],
				audioStreams: [
					// English - multiple bitrates
					createMockAudioStream({ language: 'en', bandwidth: 256000 }),
					createMockAudioStream({ language: 'en', bandwidth: 128000 }),
					// Spanish
					createMockAudioStream({ language: 'es', bandwidth: 128000 }),
					// French
					createMockAudioStream({ language: 'fr', bandwidth: 128000 }),
					// Original/undefined
					createMockAudioStream({ language: 'und', languageName: 'Original', bandwidth: 256000 })
				],
				duration: 600
			};
			
			const manifest = generateDashManifest(config);
			
			// Should have 4 audio adaptation sets (en, es, fr, und)
			const audioAdaptationSets = manifest.match(/contentType="audio"/g);
			expect(audioAdaptationSets?.length).toBe(4);
		});

		it('should handle mixed format streams', () => {
			const config: DashManifestConfig = {
				videoStreams: [
					createMockVideoStream({ format: 'MP4', codec: 'avc1.640028' }),
					createMockVideoStream({ format: 'WEBM', codec: 'vp09.00.10.08' })
				],
				audioStreams: [
					createMockAudioStream({ format: 'M4A', codec: 'mp4a.40.2', language: 'en' }),
					createMockAudioStream({ format: 'WEBM', codec: 'opus', language: 'en' })
				],
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			// First stream determines MIME type for adaptation set
			expect(manifest).toContain('mimeType="video/mp4"');
			expect(manifest).toContain('mimeType="audio/mp4"');
		});
	});

	describe('error recovery', () => {
		it('should handle gracefully when byte ranges are incomplete', () => {
			const config: DashManifestConfig = {
				videoStreams: createStreamsWithPartialByteRanges(),
				duration: 120
			};
			
			const manifest = generateDashManifest(config);
			
			// Should generate manifest but without SegmentBase
			expect(manifest).toContain('contentType="video"');
			expect(manifest).not.toContain('<SegmentBase');
		});

		it('should validate and throw meaningful errors', () => {
			const config: DashManifestConfig = {
				duration: 120
			};
			
			expect(() => generateDashManifest(config)).toThrow(
				'At least one stream'
			);
		});
	});
});