<?php
/**
 * Settings Application Service.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application;

use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application\Command\UpdateSettingsCommand;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application\DTO\SettingsDTO;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Repository\SettingsRepositoryInterface;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\CacheTtl;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\DataRetentionPolicy;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\Description;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\FeatureFlag;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\GreetingMessage;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\RestDebug;
use AIReady\WPPluginBoilerplate\Framework\Event\EventDispatcherInterface;

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

		$debug = null !== $command->rest_debug
			? new RestDebug( $command->rest_debug )
			: $aggregate->get_rest_debug();

		$ttl = null !== $command->cache_ttl
			? new CacheTtl( $command->cache_ttl )
			: $aggregate->get_cache_ttl();

		$policy = null !== $command->uninstall_action
			? DataRetentionPolicy::from_string( $command->uninstall_action )
			: $aggregate->get_data_retention_policy();

		$aggregate->update_all( $greeting, $feature, $desc, $debug, $ttl, $policy );

		$this->repository->save( $aggregate );

		// Dispatch domain events.
		foreach ( $aggregate->release_events() as $event ) {
			$this->dispatcher->dispatch( $event );
		}

		return SettingsDTO::from_aggregate( $aggregate );
	}
}
