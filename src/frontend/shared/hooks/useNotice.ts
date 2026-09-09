/**
 * Custom Hook for Notice / Alert State Management.
 *
 * @package
 */

import { useState, useCallback, useMemo } from '@wordpress/element';

export type NoticeStatus = 'success' | 'error' | 'info' | 'warning';

export interface NoticeState {
	status: NoticeStatus;
	message: string;
}

export function useNotice() {
	const [ notice, setNotice ] = useState< NoticeState | null >( null );

	const showNotice = useCallback(
		( status: NoticeStatus, message: string ) => {
			setNotice( { status, message } );
		},
		[]
	);

	const showSuccess = useCallback(
		( message: string ) => {
			showNotice( 'success', message );
		},
		[ showNotice ]
	);

	const showError = useCallback(
		( message: string ) => {
			showNotice( 'error', message );
		},
		[ showNotice ]
	);

	const dismiss = useCallback( () => {
		setNotice( null );
	}, [] );

	return useMemo(
		() => ( {
			notice,
			showNotice,
			showSuccess,
			showError,
			dismiss,
		} ),
		[ notice, showNotice, showSuccess, showError, dismiss ]
	);
}
