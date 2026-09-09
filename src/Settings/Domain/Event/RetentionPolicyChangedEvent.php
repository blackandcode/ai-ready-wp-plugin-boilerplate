<?php
/**
 * Retention Policy Changed Domain Event.
 *
 * @package AIReady\WPPluginBoilerplate\Settings\Domain\Event
 */

namespace AIReady\WPPluginBoilerplate\Settings\Domain\Event;

use DateTimeImmutable;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\DataRetentionPolicy;

/**
 * Event recorded when the data retention policy is changed.
 */
readonly class RetentionPolicyChangedEvent {

	/**
	 * Prior policy.
	 *
	 * @var DataRetentionPolicy
	 */
	public DataRetentionPolicy $previous_policy;

	/**
	 * New policy.
	 *
	 * @var DataRetentionPolicy
	 */
	public DataRetentionPolicy $new_policy;

	/**
	 * Timestamp.
	 *
	 * @var DateTimeImmutable
	 */
	public DateTimeImmutable $occurred_on;

	/**
	 * Constructor.
	 *
	 * @param DataRetentionPolicy    $previous_policy Prior policy.
	 * @param DataRetentionPolicy    $new_policy New policy.
	 * @param DateTimeImmutable|null $occurred_on Timestamp.
	 */
	public function __construct(
		DataRetentionPolicy $previous_policy,
		DataRetentionPolicy $new_policy,
		?DateTimeImmutable $occurred_on = null
	) {
		$this->previous_policy = $previous_policy;
		$this->new_policy      = $new_policy;
		$this->occurred_on     = $occurred_on ?? new DateTimeImmutable();
	}
}
