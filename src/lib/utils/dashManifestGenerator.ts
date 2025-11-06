/**
 * DASH Manifest Generator for YouTube Streams
 * Generates client-side DASH MPD manifests with proper initialization and index ranges
 */

import { normalizeDashCodec, inferMimeType } from "$lib/utils/codecUtils";
import { normalizeLanguageCode } from "$lib/utils/languageUtils";

/**
 * Metadata for a single stream (video or audio)
 */
export interface StreamMetadata {
    url: string;
    codec: string;
    mimeType?: string;
    bandwidth?: number;
    // Video-specific
    width?: number;
    height?: number;
    frameRate?: number;
    // Audio-specific
    audioSampleRate?: number;
    audioChannels?: number;
    language?: string;
    languageName?: string;
    // Byte range information
    initStart?: number;
    initEnd?: number;
    indexStart?: number;
    indexEnd?: number;
    format?: string;
}

/**
 * Configuration for DASH manifest generation
 */
export interface DashManifestConfig {
    videoStreams?: StreamMetadata[];
    audioStreams?: StreamMetadata[];
    duration: number;
}

/**
 * Options for byte range information
 */
interface ByteRangeInfo {
    initStart?: number;
    initEnd?: number;
    indexStart?: number;
    indexEnd?: number;
}

/**
 * Checks if byte range information is complete
 */
function hasByteRanges(info: ByteRangeInfo): boolean {
    return typeof info.initStart === 'number' &&
        typeof info.initEnd === 'number' &&
        typeof info.indexStart === 'number' &&
        typeof info.indexEnd === 'number';
}

/**
 * Converts duration in seconds to ISO 8601 duration format
 */
function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);

    let duration = 'PT';
    if (hours > 0) duration += `${hours}H`;
    if (minutes > 0) duration += `${minutes}M`;
    if (secs > 0 || ms > 0) {
        duration += ms > 0
            ? `${secs}.${ms.toString().padStart(3, '0')}S`
            : `${secs}S`;
    }

    return duration === 'PT' ? 'PT0S' : duration;
}

/**
 * Escapes XML special characters
 */
function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Generates a SegmentBase element with byte ranges
 */
function generateSegmentBase(info: ByteRangeInfo, indent: string): string {
    if (!hasByteRanges(info)) return '';

    const initRange = `${info.initStart}-${info.initEnd}`;
    const indexRange = `${info.indexStart}-${info.indexEnd}`;

    return `${indent}<SegmentBase indexRange="${indexRange}">
${indent}  <Initialization range="${initRange}"/>
${indent}</SegmentBase>\n`;
}

/**
 * Generates a video Representation element
 */
function generateVideoRepresentation(
    stream: StreamMetadata,
    index: number,
    indent: string
): string {
    const codec = normalizeDashCodec(stream.codec);
    const bandwidth = stream.bandwidth || 1000000;
    const width = stream.width || 1920;
    const height = stream.height || 1080;
    const frameRate = stream.frameRate || 30;

    let xml = `${indent}<Representation 
${indent}  id="video-${index + 1}" 
${indent}  bandwidth="${bandwidth}"
${indent}  codecs="${escapeXml(codec)}"
${indent}  width="${width}"
${indent}  height="${height}"
${indent}  frameRate="${frameRate}">
${indent}  <BaseURL>${escapeXml(stream.url)}</BaseURL>\n`;

    xml += generateSegmentBase(stream, `${indent}  `);
    xml += `${indent}</Representation>\n`;

    return xml;
}

/**
 * Generates a video AdaptationSet with all video representations
 */
function generateVideoAdaptationSet(
    streams: StreamMetadata[],
    indent: string
): string {
    const firstStream = streams[0];
    const mimeType = inferMimeType(firstStream.format, firstStream.codec, true);

    let xml = `${indent}<AdaptationSet 
${indent}  id="0" 
${indent}  contentType="video" 
${indent}  mimeType="${escapeXml(mimeType)}"
${indent}  subsegmentAlignment="true"
${indent}  startWithSAP="1">\n`;

    streams.forEach((stream, index) => {
        xml += generateVideoRepresentation(stream, index, `${indent}  `);
    });

    xml += `${indent}</AdaptationSet>\n`;

    return xml;
}

/**
 * Generates an audio Representation element
 */
function generateAudioRepresentation(
    stream: StreamMetadata,
    adaptationSetId: number,
    index: number,
    indent: string
): string {
    const codec = normalizeDashCodec(stream.codec);
    const bandwidth = stream.bandwidth || 128000;
    const sampleRate = stream.audioSampleRate || 44100;
    const channels = stream.audioChannels || 2;

    let xml = `${indent}<Representation
${indent}  id="audio-${adaptationSetId}-${index + 1}"
${indent}  bandwidth="${bandwidth}"
${indent}  codecs="${escapeXml(codec)}"
${indent}  audioSamplingRate="${sampleRate}">
${indent}  <AudioChannelConfiguration 
${indent}    schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
${indent}    value="${channels}"/>
${indent}  <BaseURL>${escapeXml(stream.url)}</BaseURL>\n`;

    xml += generateSegmentBase(stream, `${indent}  `);
    xml += `${indent}</Representation>\n`;

    return xml;
}

/**
 * Generates an audio AdaptationSet for a specific language
 */
function generateAudioAdaptationSet(
    streams: StreamMetadata[],
    language: string,
    languageName: string,
    adaptationSetId: number,
    indent: string
): string {
    const firstStream = streams[0];
    const mimeType = inferMimeType(firstStream.format, firstStream.codec, false);

    let xml = `${indent}<AdaptationSet 
${indent}  id="${adaptationSetId}" 
${indent}  contentType="audio" 
${indent}  mimeType="${escapeXml(mimeType)}"
${indent}  lang="${escapeXml(language)}"
${indent}  label="${escapeXml(languageName)}"
${indent}  subsegmentAlignment="true"
${indent}  startWithSAP="1">\n`;

    streams.forEach((stream, index) => {
        xml += generateAudioRepresentation(stream, adaptationSetId, index, `${indent}  `);
    });

    xml += `${indent}</AdaptationSet>\n`;

    return xml;
}

/**
 * Groups audio streams by language
 */
function groupStreamsByLanguage(
    streams: StreamMetadata[]
): Map<string, { streams: StreamMetadata[]; name: string }> {
    const languageMap = new Map<string, { streams: StreamMetadata[]; name: string }>();

    for (const stream of streams) {
        const language = normalizeLanguageCode(stream.language);
        const languageName = stream.languageName || language;

        if (!languageMap.has(language)) {
            languageMap.set(language, { streams: [], name: languageName });
        }

        languageMap.get(language)!.streams.push(stream);
    }

    return languageMap;
}

/**
 * Generates all audio AdaptationSets
 */
function generateAudioAdaptationSets(
    streams: StreamMetadata[],
    indent: string
): string {
    const streamsByLanguage = groupStreamsByLanguage(streams);
    let xml = '';
    let adaptationSetId = 1;

    streamsByLanguage.forEach(({ streams: langStreams, name: languageName }, language) => {
        xml += generateAudioAdaptationSet(
            langStreams,
            language,
            languageName,
            adaptationSetId,
            indent
        );
        adaptationSetId++;
    });

    return xml;
}

/**
 * Validates manifest configuration
 * @throws {Error} if configuration is invalid
 */
function validateConfig(config: DashManifestConfig): void {
    const hasVideo = config.videoStreams && config.videoStreams.length > 0;
    const hasAudio = config.audioStreams && config.audioStreams.length > 0;

    if (!hasVideo && !hasAudio) {
        throw new Error('At least one stream (video or audio) must be provided');
    }

    if (!config.duration || config.duration === 0) {
        console.warn('Duration is 0 or undefined, this may cause playback issues');
    }
}



/**
 * Generates a DASH MPD XML manifest with SegmentBase for byte-range requests
 */
export function generateDashManifest(config: DashManifestConfig): string {
    validateConfig(config);

    const { videoStreams, audioStreams, duration } = config;
    const durationStr = formatDuration(duration);
    const indent = '    ';


    let mpd = `<?xml version="1.0" encoding="UTF-8"?>
    <MPD xmlns="urn:mpeg:dash:schema:mpd:2011" 
        type="static"
        mediaPresentationDuration="${durationStr}"
        minBufferTime="PT2S"
        profiles="urn:mpeg:dash:profile:isoff-on-demand:2011">
    <Period duration="${durationStr}">
    `;

    // Add video adaptation set
    if (videoStreams && videoStreams.length > 0) {
        mpd += generateVideoAdaptationSet(videoStreams, indent);
    }

    // Add audio adaptation sets (one per language)
    if (audioStreams && audioStreams.length > 0) {
        mpd += generateAudioAdaptationSets(audioStreams, indent);
    }

    mpd += `  </Period>
    </MPD>`;

    return mpd;
}

/**
 * Creates a Blob URL from the DASH manifest
 */
export function createDashManifestBlobUrl(manifest: string): string {
    const blob = new Blob([manifest], { type: 'application/dash+xml' });
    return URL.createObjectURL(blob);
}

/**
 * Revokes a previously created blob URL
 */
export function revokeDashManifestBlobUrl(url: string): void {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}

/**
 * Convenience function that generates manifest and creates blob URL
 */
export function generateDashManifestBlobUrl(config: DashManifestConfig): string {
    const manifest = generateDashManifest(config);
    console.log('Generated DASH manifest:', manifest);
    return createDashManifestBlobUrl(manifest);
}