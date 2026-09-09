/**
 * API Client Adapter for Settings and Diagnostics.
 *
 * Implements the Repository/Adapter Pattern, isolating network transport
 * and WordPress api-fetch mechanics from React components.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch';
import type {
	PluginSettingsData,
	SystemDiagnosticsData,
	AirwpBootstrapData,
} from '../types';

export class ApiClientError extends Error {
	constructor(
		message: string,
		public readonly code: string = 'api_error',
		public readonly status: number = 500,
		public readonly raw?: unknown
	) {
		super( message );
		this.name = 'ApiClientError';
	}
}

export interface FetcherOptions {
	path?: string;
	url?: string;
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	data?: unknown;
	headers?: Record< string, string >;
}

export type FetcherFn = < T >( options: FetcherOptions ) => Promise< T >;

export interface ISettingsApiClient {
	getSettings: () => Promise< PluginSettingsData >;
	updateSettings: (
		settings: PluginSettingsData
	) => Promise< PluginSettingsData >;
	getDiagnostics: () => Promise< SystemDiagnosticsData >;
}

export class SettingsApiClient implements ISettingsApiClient {
	private readonly fetcher: FetcherFn;
	private readonly baseEndpoint: string;
	private readonly bootstrapGetter: () => AirwpBootstrapData | undefined;

	constructor(
		options: {
			fetcher?: FetcherFn;
			baseEndpoint?: string;
			bootstrapGetter?: () => AirwpBootstrapData | undefined;
		} = {}
	) {
		this.fetcher = options.fetcher || ( apiFetch as unknown as FetcherFn );
		this.baseEndpoint = options.baseEndpoint || '/ai-ready-wp/v1';
		this.bootstrapGetter =
			options.bootstrapGetter ||
			( () =>
				typeof window !== 'undefined'
					? window.airwpAdminBootstrap
					: undefined );
	}

	private getHeaders(): Record< string, string > {
		const bootstrap = this.bootstrapGetter();
		const headers: Record< string, string > = {
			'Content-Type': 'application/json',
		};

		if ( bootstrap?.nonce ) {
			headers[ 'X-WP-Nonce' ] = bootstrap.nonce;
		}

		return headers;
	}

	private handleError( error: unknown ): never {
		if ( error instanceof ApiClientError ) {
			throw error;
		}

		const errObj = error as {
			message?: string;
			code?: string;
			data?: { status?: number };
		};
		const message =
			errObj?.message ||
			'A network error occurred while communicating with WordPress.';
		const code = errObj?.code || 'unknown_error';
		const status =
			errObj?.data?.status ||
			( typeof error === 'object' && error && 'status' in error
				? Number( ( error as any ).status )
				: 500 );

		throw new ApiClientError( message, code, status, error );
	}

	public async getSettings(): Promise< PluginSettingsData > {
		try {
			return await this.fetcher< PluginSettingsData >( {
				path: `${ this.baseEndpoint }/settings`,
				method: 'GET',
				headers: this.getHeaders(),
			} );
		} catch ( error ) {
			this.handleError( error );
		}
	}

	public async updateSettings(
		settings: PluginSettingsData
	): Promise< PluginSettingsData > {
		try {
			return await this.fetcher< PluginSettingsData >( {
				path: `${ this.baseEndpoint }/settings`,
				method: 'POST',
				data: settings,
				headers: this.getHeaders(),
			} );
		} catch ( error ) {
			this.handleError( error );
		}
	}

	public async getDiagnostics(): Promise< SystemDiagnosticsData > {
		try {
			return await this.fetcher< SystemDiagnosticsData >( {
				path: `${ this.baseEndpoint }/diagnostics`,
				method: 'GET',
				headers: this.getHeaders(),
			} );
		} catch ( error ) {
			this.handleError( error );
		}
	}
}

export const defaultSettingsApiClient = new SettingsApiClient();
