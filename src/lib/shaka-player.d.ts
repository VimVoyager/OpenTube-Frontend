declare module 'shaka-player' {
	import type {
		ShakaPlayerClass,
		ShakaUIOverlayClass,
		ShakaPolyfill,
		ShakaPlayerConfiguration,
		ShakaUIConfiguration,
		ShakaErrorEvent
	} from '$lib/types';

	export const Player: ShakaPlayerClass;
	export const ui: {
		Overlay: ShakaUIOverlayClass;
	};
	export const polyfill: ShakaPolyfill;

	export type PlayerConfiguration = ShakaPlayerConfiguration;
	export type UIConfiguration = ShakaUIConfiguration;
	export type ErrorEvent = ShakaErrorEvent;
}

declare module 'shaka-player/dist/shaka-player.ui' {
	import type {
		ShakaPlayerClass,
		ShakaUIOverlayClass,
		ShakaPolyfill,
		ShakaPlayerConfiguration,
		ShakaUIConfiguration,
		ShakaErrorEvent,
		ShakaNetworkingEngine,
		ShakaRequest
	} from '$lib/types';

	const shaka: {
		Player: ShakaPlayerClass;
		ui: {
			Overlay: ShakaUIOverlayClass;
		};
		polyfill: ShakaPolyfill;
	};

	export default shaka;

	export type PlayerConfiguration = ShakaPlayerConfiguration;
	export type UIConfiguration = ShakaUIConfiguration;
	export type ErrorEvent = ShakaErrorEvent;
}