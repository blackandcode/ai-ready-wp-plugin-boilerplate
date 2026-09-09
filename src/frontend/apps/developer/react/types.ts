/**
 * Developer Application Types.
 *
 * @package
 */

import type { ComponentType } from 'react';
import type { AirwpBootstrapData } from '../../shared';

export type DeveloperSubTab = 'diagnostics' | 'api-reference';

export interface DeveloperTabMeta {
	id: DeveloperSubTab;
	label: string;
	icon?: ComponentType< { size?: number } > | any;
}

export type { AirwpBootstrapData };
