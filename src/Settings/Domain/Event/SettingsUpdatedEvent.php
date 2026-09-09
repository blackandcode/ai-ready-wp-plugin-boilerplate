<?php
/**
 * Settings Updated Domain Event.
 *
 * @package AIReady\WPPluginBoilerplate\Settings\Domain\Event
 */

namespace AIReady\WPPluginBoilerplate\Settings\Domain\Event;

use DateTimeImmutable;

/**
 * Event recorded when plugin settings are modified.
 */
readonly class SettingsUpdatedEvent {

	/**
	 * List of updated section or field keys.
	 *
	 * @var array<int, string>
	 */
	public array $changed_keys;

	/**
	 * Settings data snapshot.
	 *
	 * @var array<string, mixed>
	 */
	public array $payload;

	/**
	 * Timestamp when event occurred.
	 *
	 * @var DateTimeImmutable
	 */
	public DateTimeImmutable $occurred_on;

	/**
	 * Constructor.
	 *
	 * @param array<int, string>     $changed_keys Changed keys.
	 * @param array<string, mixed>   $payload Current snapshot payload.
	 * @param DateTimeImmutable|null $occurred_on Event timestamp.
	 */
	public function __construct(
		array $changed_keys,
		array $payload,
		?DateTimeImmutable $occurred_on = null
	) {
		$this->changed_keys = $changed_keys;
		$this->payload      = $payload;
		$this->occurred_on  = $occurred_on ?? new DateTimeImmutable();
	}
}
