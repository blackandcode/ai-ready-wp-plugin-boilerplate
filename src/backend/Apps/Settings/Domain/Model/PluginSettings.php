<?php
/**
 * Plugin Settings Aggregate Root.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Model
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Model;

use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Event\RetentionPolicyChangedEvent;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Event\SettingsUpdatedEvent;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\CacheTtl;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\DataRetentionPolicy;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\Description;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\FeatureFlag;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\GreetingMessage;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\RestDebug;

/**
 * Aggregate root encapsulating plugin settings state, invariants, and events.
 */
class PluginSettings {

	/**
	 * Greeting message.
	 *
	 * @var GreetingMessage
	 */
	private GreetingMessage $greeting_message;

	/**
	 * Feature flag.
	 *
	 * @var FeatureFlag
	 */
	private FeatureFlag $enable_feature;

	/**
	 * Plugin description.
	 *
	 * @var Description
	 */
	private Description $description;

	/**
	 * REST debug flag.
	 *
	 * @var RestDebug
	 */
	private RestDebug $rest_debug;

	/**
	 * Cache TTL duration.
	 *
	 * @var CacheTtl
	 */
	private CacheTtl $cache_ttl;

	/**
	 * Data retention policy.
	 *
	 * @var DataRetentionPolicy
	 */
	private DataRetentionPolicy $data_retention_policy;

	/**
	 * Recorded domain events awaiting dispatch.
	 *
	 * @var array<int, object>
	 */
	private array $recorded_events = array();

	/**
	 * Constructor.
	 *
	 * @param GreetingMessage     $greeting_message Greeting message.
	 * @param FeatureFlag         $enable_feature Feature flag.
	 * @param Description         $description Description.
	 * @param RestDebug           $rest_debug REST debug.
	 * @param CacheTtl            $cache_ttl Cache TTL.
	 * @param DataRetentionPolicy $data_retention_policy Retention policy.
	 */
	public function __construct(
		GreetingMessage $greeting_message,
		FeatureFlag $enable_feature,
		Description $description,
		RestDebug $rest_debug,
		CacheTtl $cache_ttl,
		DataRetentionPolicy $data_retention_policy
	) {
		$this->greeting_message      = $greeting_message;
		$this->enable_feature        = $enable_feature;
		$this->description           = $description;
		$this->rest_debug            = $rest_debug;
		$this->cache_ttl             = $cache_ttl;
		$this->data_retention_policy = $data_retention_policy;
	}

	/**
	 * Factory to create default settings aggregate.
	 *
	 * @return self
	 */
	public static function create_default(): self {
		return new self(
			new GreetingMessage( 'Hello from AI-Ready WP Plugin Boilerplate!' ),
			new FeatureFlag( true ),
			new Description( 'A modern WordPress plugin powered by AI workflows.' ),
			new RestDebug( false ),
			new CacheTtl( CacheTtl::DEFAULT_TTL ),
			DataRetentionPolicy::Preserve
		);
	}

	/**
	 * Reconstitute aggregate from raw persistence data without firing domain events.
	 *
	 * @param array<string, mixed> $data Persisted settings array.
	 * @return self
	 */
	public static function reconstitute( array $data ): self {
		$defaults = self::create_default()->to_array();
		$merged   = array_replace_recursive( $defaults, $data );

		$greeting = new GreetingMessage( (string) ( $merged['general']['greeting_message'] ?? '' ) );
		$flag     = new FeatureFlag( (bool) ( $merged['general']['enable_feature'] ?? true ) );
		$desc     = new Description( (string) ( $merged['general']['description'] ?? '' ) );

		$debug = new RestDebug( (bool) ( $merged['advanced']['rest_debug'] ?? false ) );
		$ttl   = CacheTtl::from_clamped( (int) ( $merged['advanced']['cache_ttl'] ?? CacheTtl::DEFAULT_TTL ) );

		$policy_raw = (string) ( $merged['data_retention']['uninstall_action'] ?? 'preserve' );
		$policy     = DataRetentionPolicy::from_or_default( $policy_raw );

		return new self( $greeting, $flag, $desc, $debug, $ttl, $policy );
	}

	/**
	 * Update general section settings.
	 *
	 * @param GreetingMessage $greeting New greeting.
	 * @param FeatureFlag     $flag New feature flag.
	 * @param Description     $desc New description.
	 * @return void
	 */
	public function update_general(
		GreetingMessage $greeting,
		FeatureFlag $flag,
		Description $desc
	): void {
		$changed = array();

		if ( ! $this->greeting_message->equals( $greeting ) ) {
			$this->greeting_message = $greeting;
			$changed[]              = 'general.greeting_message';
		}

		if ( ! $this->enable_feature->equals( $flag ) ) {
			$this->enable_feature = $flag;
			$changed[]            = 'general.enable_feature';
		}

		if ( ! $this->description->equals( $desc ) ) {
			$this->description = $desc;
			$changed[]         = 'general.description';
		}

		if ( ! empty( $changed ) ) {
			$this->record_event( new SettingsUpdatedEvent( $changed, $this->to_array() ) );
		}
	}

	/**
	 * Update advanced section settings.
	 *
	 * @param RestDebug $debug New REST debug flag.
	 * @param CacheTtl  $ttl New cache TTL.
	 * @return void
	 */
	public function update_advanced( RestDebug $debug, CacheTtl $ttl ): void {
		$changed = array();

		if ( ! $this->rest_debug->equals( $debug ) ) {
			$this->rest_debug = $debug;
			$changed[]        = 'advanced.rest_debug';
		}

		if ( ! $this->cache_ttl->equals( $ttl ) ) {
			$this->cache_ttl = $ttl;
			$changed[]       = 'advanced.cache_ttl';
		}

		if ( ! empty( $changed ) ) {
			$this->record_event( new SettingsUpdatedEvent( $changed, $this->to_array() ) );
		}
	}

	/**
	 * Update data retention policy.
	 *
	 * @param DataRetentionPolicy $policy New retention policy.
	 * @return void
	 */
	public function update_retention_policy( DataRetentionPolicy $policy ): void {
		if ( $this->data_retention_policy !== $policy ) {
			$previous                    = $this->data_retention_policy;
			$this->data_retention_policy = $policy;

			$this->record_event( new RetentionPolicyChangedEvent( $previous, $policy ) );
			$this->record_event(
				new SettingsUpdatedEvent(
					array( 'data_retention.uninstall_action' ),
					$this->to_array()
				)
			);
		}
	}

	/**
	 * Apply complete update across all sections.
	 *
	 * @param GreetingMessage     $greeting Greeting message.
	 * @param FeatureFlag         $flag Feature flag.
	 * @param Description         $desc Description.
	 * @param RestDebug           $debug REST debug.
	 * @param CacheTtl            $ttl Cache TTL.
	 * @param DataRetentionPolicy $policy Retention policy.
	 * @return void
	 */
	public function update_all(
		GreetingMessage $greeting,
		FeatureFlag $flag,
		Description $desc,
		RestDebug $debug,
		CacheTtl $ttl,
		DataRetentionPolicy $policy
	): void {
		$this->update_general( $greeting, $flag, $desc );
		$this->update_advanced( $debug, $ttl );
		$this->update_retention_policy( $policy );
	}

	/**
	 * Record a domain event.
	 *
	 * @param object $event Domain event object.
	 * @return void
	 */
	protected function record_event( object $event ): void {
		$this->recorded_events[] = $event;
	}

	/**
	 * Release recorded events and reset internal event queue.
	 *
	 * @return array<int, object>
	 */
	public function release_events(): array {
		$events                = $this->recorded_events;
		$this->recorded_events = array();
		return $events;
	}

	/**
	 * Convert aggregate state to primitives array.
	 *
	 * @return array<string, mixed>
	 */
	public function to_array(): array {
		return array(
			'general'        => array(
				'greeting_message' => $this->greeting_message->value(),
				'enable_feature'   => $this->enable_feature->value(),
				'description'      => $this->description->value(),
			),
			'advanced'       => array(
				'rest_debug' => $this->rest_debug->value(),
				'cache_ttl'  => $this->cache_ttl->value(),
			),
			'data_retention' => array(
				'uninstall_action' => $this->data_retention_policy->value,
			),
		);
	}

	/**
	 * Get greeting message.
	 *
	 * @return GreetingMessage
	 */
	public function get_greeting_message(): GreetingMessage {
		return $this->greeting_message;
	}

	/**
	 * Get enable feature flag.
	 *
	 * @return FeatureFlag
	 */
	public function get_enable_feature(): FeatureFlag {
		return $this->enable_feature;
	}

	/**
	 * Get description.
	 *
	 * @return Description
	 */
	public function get_description(): Description {
		return $this->description;
	}

	/**
	 * Get REST debug flag.
	 *
	 * @return RestDebug
	 */
	public function get_rest_debug(): RestDebug {
		return $this->rest_debug;
	}

	/**
	 * Get cache TTL.
	 *
	 * @return CacheTtl
	 */
	public function get_cache_ttl(): CacheTtl {
		return $this->cache_ttl;
	}

	/**
	 * Get data retention policy.
	 *
	 * @return DataRetentionPolicy
	 */
	public function get_data_retention_policy(): DataRetentionPolicy {
		return $this->data_retention_policy;
	}
}
