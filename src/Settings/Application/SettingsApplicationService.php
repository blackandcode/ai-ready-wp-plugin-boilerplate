<?php
/**
 * Settings Application Service.
 *
 * @package AIReady\WPPluginBoilerplate\Settings\Application
 */

namespace AIReady\WPPluginBoilerplate\Settings\Application;

use AIReady\WPPluginBoilerplate\Event\EventDispatcherInterface;
use AIReady\WPPluginBoilerplate\Settings\Application\Command\UpdateSettingsCommand;
use AIReady\WPPluginBoilerplate\Settings\Application\DTO\SettingsDTO;
use AIReady\WPPluginBoilerplate\Settings\Domain\Repository\SettingsRepositoryInterface;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\CacheTtl;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\DataRetentionPolicy;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\Description;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\FeatureFlag;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\GreetingMessage;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\RestDebug;

/**
 * Application service orchestrating settings commands, domain invariants, and events.
 */
class SettingsApplicationService {

	/**
	 * Repository instance.
	 *
	 * @var SettingsRepositoryInterface
	 */
	private SettingsRepositoryInterface $repository;

	/**
	 * Event dispatcher.
	 *
	 * @var EventDispatcherInterface
	 */
	private EventDispatcherInterface $dispatcher;

	/**
	 * Constructor.
	 *
	 * @param SettingsRepositoryInterface $repository Repository instance.
	 * @param EventDispatcherInterface    $dispatcher Event dispatcher.
	 */
	public function __construct(
		SettingsRepositoryInterface $repository,
		EventDispatcherInterface $dispatcher
	) {
		$this->repository = $repository;
		$this->dispatcher = $dispatcher;
	}

	/**
	 * Retrieve current plugin settings.
	 *
	 * @return SettingsDTO
	 */
	public function get_settings(): SettingsDTO {
		$aggregate = $this->repository->get();
		return SettingsDTO::from_aggregate( $aggregate );
	}

	/**
	 * Update plugin settings from a command.
	 *
	 * @param UpdateSettingsCommand $command Command with update parameters.
	 * @return SettingsDTO Updated settings.
	 */
	public function update_settings( UpdateSettingsCommand $command ): SettingsDTO {
		$aggregate = $this->repository->get();

		$greeting = null !== $command->greeting_message
			? new GreetingMessage( $command->greeting_message )
			: $aggregate->get_greeting_message();

		$feature = null !== $command->enable_feature
			? new FeatureFlag( $command->enable_feature )
			: $aggregate->get_enable_feature();

		$desc = null !== $command->description
			? new Description( $command->description )
			: $aggregate->get_description();

		$aggregate->update_general( $greeting, $feature, $desc );

		$debug = null !== $command->rest_debug
			? new RestDebug( $command->rest_debug )
			: $aggregate->get_rest_debug();

		$ttl = null !== $command->cache_ttl
			? new CacheTtl( $command->cache_ttl )
			: $aggregate->get_cache_ttl();

		$aggregate->update_advanced( $debug, $ttl );

		if ( null !== $command->uninstall_action ) {
			$policy = DataRetentionPolicy::from_string( $command->uninstall_action );
			$aggregate->update_retention_policy( $policy );
		}

		$this->repository->save( $aggregate );

		$events = $aggregate->release_events();
		foreach ( $events as $event ) {
			$this->dispatcher->dispatch( $event );
		}

		return SettingsDTO::from_aggregate( $aggregate );
	}

	/**
	 * Retrieve a specific section of settings.
	 *
	 * @param string $section Section identifier (general, advanced, data_retention).
	 * @return array<string, mixed>
	 */
	public function get_section( string $section ): array {
		$all = $this->get_settings()->to_array();
		return $all[ $section ] ?? array();
	}
}
