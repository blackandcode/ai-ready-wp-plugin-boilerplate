<?php
/**
 * Hello World Greeting Value Object.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld\Domain
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld\Domain;

use InvalidArgumentException;

/**
 * Value object representing a Hello World greeting message.
 */
readonly class HelloWorldGreeting {

	/**
	 * Greeting text.
	 *
	 * @var string
	 */
	private string $message;

	/**
	 * Constructor.
	 *
	 * @param string $message Raw message.
	 * @throws InvalidArgumentException If message is empty.
	 */
	public function __construct( string $message ) {
		$trimmed = trim( $message );
		if ( '' === $trimmed ) {
			throw new InvalidArgumentException( 'Hello World greeting message cannot be empty.' );
		}

		$this->message = $trimmed;
	}

	/**
	 * Get primitive value.
	 *
	 * @return string
	 */
	public function value(): string {
		return $this->message;
	}

	/**
	 * Create default greeting.
	 *
	 * @return self
	 */
	public static function default(): self {
		return new self( 'Hello from AI-Ready WP Plugin Boilerplate!' );
	}
}
