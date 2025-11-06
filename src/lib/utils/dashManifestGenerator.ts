/**
 * DASH Manifest Generator for YouTube Streams
 * Generates client-side DASH MPD manifests with proper initialization and index ranges
 */

export interface StreamMetadata {
    url: string;
    codec: string;
    mimeType?: string;
    bandwidth?: number;
    width?: number;
    height?: number;
    frameRate?: number;
    audioSampleRate?: number;
    audioChannels?: number;
    language?: string;
    languageName?: string;
    initStart?: number;
    initEnd?: number;
    indexStart?: number;
    indexEnd?: number;
    format?: string;
}

export interface DashManifestConfig {
    videoStreams?: StreamMetadata[];
    audioStreams?: StreamMetadata[];
    duration: number;
}

/**
 * Normalizes codec strings to DASH-compatible format
 */
function normalizeDashCodec(codec: string): string {
    const lowerCodec = codec.toLowerCase();

    // Already in correct format
    if (lowerCodec.match(/^(avc1|vp09|av01|mp4a|opus|vorbis)\./)) {
        return codec;
    }

    // Handle common variations
    if (lowerCodec.includes('h264')) return 'avc1.42E01E';
    if (lowerCodec.includes('vp9')) return 'vp09.00.10.08';
    if (lowerCodec.includes('av1')) return 'av01.0.05M.08';
    if (lowerCodec.includes('aac')) return 'mp4a.40.2';
    if (lowerCodec.includes('opus')) return 'opus';
    if (lowerCodec.includes('vorbis')) return 'vorbis';

    return codec;
}

/**
 * Infers MIME type from format string and codec
 * Handles backedn format strings like "MPEG_4", "MP4", "WEBM", "M4A", etc.
 */
function inferMimeType(format?: string, codec?: string, isVideo?: boolean): string {
    // Check format first - this is most reliable
    if (format) {
        const formatUpper = format.toUpperCase();

        // Video formats
        if (formatUpper === 'MPEG_4' || formatUpper === 'MP4') {
            return 'video/mp4';
        }
        if (formatUpper === 'WEBM') {
            return 'video/webm';
        }
        if (formatUpper === 'V_VP9' || formatUpper === 'VP9') {
            return 'video/webm';
        }

        // Audio formats
        if (formatUpper === 'M4A' || formatUpper === 'MP4A') {
            return 'audio/mp4';
        }
        if (formatUpper === 'WEBMA' || formatUpper === 'OPUS' || formatUpper === 'VORBIS') {
            return 'audio/webm';
        }
    }

    // Fallback based on codec
    if (codec) {
        const codecLower = codec.toLowerCase();

        // Video codecs
        if (codecLower.includes('avc1') || codecLower.includes('h264')) {
            return 'video/mp4';
        }
        if (codecLower.includes('vp09') || codecLower.includes('vp9')) {
            return 'video/webm';
        }
        if (codecLower.includes('av01') || codecLower.includes('av1')) {
            return 'video/mp4';
        }

        // Audio codecs
        if (codecLower.includes('mp4a')) {
            return 'audio/mp4';
        }
        if (codecLower.includes('opus')) {
            return 'audio/webm';
        }
        if (codecLower.includes('vorbis')) {
            return 'audio/webm';
        }
    }
    // Final fallback
    return isVideo ? 'video/mp4' : 'audio/mp4';
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
        if (ms > 0) {
            duration += `${secs}.${ms.toString().padStart(3, '0')}S`;
        } else {
            duration += `${secs}S`;
        }
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

function normalizeLanguageCode(lang: string): string {
    if (!lang) return 'und';

    const normalized = lang.replace(/_/g, '-');

    const parts = normalized.split('-');
    if (parts.length > 0) {
        parts[0] = parts[0].toLowerCase();
    }

    return parts.join('-');
}

/**
 * Generates a DASH MPD XML manifest with SegmentBase for byte-range requests
 */
export function generateDashManifest(config: DashManifestConfig): string {
    const { videoStreams, audioStreams, duration } = config;

    if (!videoStreams || videoStreams.length === 0 && !audioStreams) {
        throw new Error('At least one stream (video or audio) must be provided');
    }

    if (!duration || duration === 0) {
        console.warn('Duration is 0 or undefined, this will likely cause playback issues');
    }

    const durationStr = formatDuration(duration);

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
        const firstStream = videoStreams[0];
        const mimeType = inferMimeType(firstStream.format, firstStream.codec, true);
        // const videoCodec = normalizeDashCodec(firstStream.codec);

        // Start the AdaptationSet
        mpd += `    <AdaptationSet 
        id="0" 
        contentType="video" 
        mimeType="${escapeXml(mimeType)}"
        subsegmentAlignment="true"
        startWithSAP="1">
`;
        videoStreams.forEach((videoStream, index) => {
            const streamCodec = normalizeDashCodec(videoStream.codec);
            const bandwidth = videoStream.bandwidth || 1000000;
            const width = videoStream.width || 1920;
            const height = videoStream.height || 1080;
            const frameRate = videoStream.frameRate || 30;

            // Check if we have byte range information
            const hasInitRange = typeof videoStream.initStart === 'number' && typeof videoStream.initEnd === 'number';
            const hasIndexRange = typeof videoStream.indexStart === 'number' && typeof videoStream.indexEnd === 'number';

            mpd += `    <Representation 
          id="video-${index + 1}" 
          bandwidth="${bandwidth}"
          codecs="${escapeXml(streamCodec)}"
          width="${width}"
          height="${height}"
          frameRate="${frameRate}">
        <BaseURL>${escapeXml(videoStream.url)}</BaseURL>
`;

            if (hasInitRange && hasIndexRange) {
                const initRange = `${videoStream.initStart}-${videoStream.initEnd}`;
                const indexRange = `${videoStream.indexStart}-${videoStream.indexEnd}`;
                mpd += `        <SegmentBase indexRange="${indexRange}">
          <Initialization range="${initRange}"/>
        </SegmentBase>
`;
            }

            mpd += `      </Representation>
`;
        });

        mpd += `      </AdaptationSet> 
`;
    }

    // Add audio adaptation set
    if (audioStreams && audioStreams.length > 0) {
        // Group audio streams by language
        const streamsByLanguage = new Map<string, StreamMetadata[]>();

        audioStreams.forEach(stream => {
            console.log("Language - ", stream.language);
            const lang = normalizeLanguageCode(stream.language || 'und');
            if (!streamsByLanguage.has(lang)) {
                streamsByLanguage.set(lang, []);
            }
            streamsByLanguage.get(lang)!.push(stream);
        });

        let audioAdaptationSetId = 1;
        streamsByLanguage.forEach((streams, language) => {
            const firstAudioStream = streams[0];
            const audioCodec = normalizeDashCodec(firstAudioStream.codec);
            const mimeType = inferMimeType(firstAudioStream.format, firstAudioStream.codec, false);
            const languageName = firstAudioStream.languageName || language;



            streams.forEach((audioStream, index) => {
                const bandwidth = audioStream.bandwidth || 128000;
                const sampleRate = audioStream.audioSampleRate || 44100;
                const channels = audioStream.audioChannels || 2;

                // Check if we have byte range information
                const hasInitRange = typeof audioStream.initStart === 'number' && typeof audioStream.initEnd === 'number';
                const hasIndexRange = typeof audioStream.indexStart === 'number' && typeof audioStream.indexEnd === 'number';

                mpd += `    <AdaptationSet 
        id="${audioAdaptationSetId}" 
        contentType="audio" 
        mimeType="${escapeXml(mimeType)}"
        lang="${escapeXml(language)}"
        label="${escapeXml(languageName)}"
        subsegmentAlignment="true"
        startWithSAP="1">
`;
                mpd += `      <Representation
            id="audio-${audioAdaptationSetId}-${index + 1}"
            bandwidth="${bandwidth}"
            codecs="${escapeXml(audioCodec)}"
            audioSamplingRate="${sampleRate}">
        <AudioChannelConfiguration 
            schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
            value="${channels}"/>
        <BaseURL>${escapeXml(audioStream.url)}</BaseURL>
`;

                if (hasInitRange && hasIndexRange) {
                    const initRange = `${audioStream.initStart}-${audioStream.initEnd}`;
                    const indexRange = `${audioStream.indexStart}-${audioStream.indexEnd}`;
                    mpd += `        <SegmentBase indexRange="${indexRange}">
          <Initialization range="${initRange}"/>
        </SegmentBase>
`;
                }

                mpd += `      </Representation>
`;
                mpd += `    </AdaptationSet>
`;
            });


            audioAdaptationSetId++;
        });
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