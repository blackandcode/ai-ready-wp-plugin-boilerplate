/**
 * Reusable Card Layout adhering to WordPress Design System (WPDS).
 *
 * Implements the Compound Component design pattern:
 * - <CardLayout>{children}</CardLayout>
 * - <CardLayout.Header>{headerContent}</CardLayout.Header>
 * - <CardLayout.Body>{bodyContent}</CardLayout.Body>
 * - <CardLayout.Footer>{footerContent}</CardLayout.Footer>
 *
 * Also maintains backwards compatibility with prop-based usage:
 * <CardLayout header={...} footer={...}>{children}</CardLayout>
 *
 * @package
 */

import {
	Card,
	CardHeader as WpCardHeader,
	CardBody as WpCardBody,
	CardFooter as WpCardFooter,
} from '@wordpress/components';
import type { ReactNode } from 'react';

interface CardLayoutProps {
	header?: ReactNode;
	children?: ReactNode;
	footer?: ReactNode;
	className?: string;
}

interface SubComponentProps {
	children: ReactNode;
	className?: string;
}

function CardHeader( {
	children,
	className = 'airwp-card-header',
}: SubComponentProps ) {
	return <WpCardHeader className={ className }>{ children }</WpCardHeader>;
}

function CardBody( {
	children,
	className = 'airwp-card-body',
}: SubComponentProps ) {
	return <WpCardBody className={ className }>{ children }</WpCardBody>;
}

function CardFooter( {
	children,
	className = 'airwp-card-footer',
}: SubComponentProps ) {
	return <WpCardFooter className={ className }>{ children }</WpCardFooter>;
}

export function CardLayout( {
	header,
	children,
	footer,
	className = 'airwp-settings-card',
}: CardLayoutProps ) {
	return (
		<Card className={ className }>
			{ header && <CardHeader>{ header }</CardHeader> }
			{ children &&
				// If children already contains Compound Components or standard nodes
				( typeof children === 'object' && children !== null ? (
					children
				) : (
					<CardBody>{ children }</CardBody>
				) ) }
			{ footer && <CardFooter>{ footer }</CardFooter> }
		</Card>
	);
}

CardLayout.Header = CardHeader;
CardLayout.Body = CardBody;
CardLayout.Footer = CardFooter;
