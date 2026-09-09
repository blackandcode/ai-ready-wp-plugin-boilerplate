<?php
/**
 * Test SettingsApplicationService.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Settings\Application
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Settings\Application;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Event\EventDispatcher;
use AIReady\WPPluginBoilerplate\Settings\Application\Command\UpdateSettingsCommand;
use AIReady\WPPluginBoilerplate\Settings\Application\SettingsApplicationService;
use AIReady\WPPluginBoilerplate\Settings\Domain\Event\SettingsUpdatedEvent;
use AIReady\WPPluginBoilerplate\Settings\Domain\Exception\InvalidCacheTtlException;
use AIReady\WPPluginBoilerplate\Settings\Domain\Exception\InvalidGreetingMessageException;
use AIReady\WPPluginBoilerplate\Settings\Domain\Model\PluginSettings;
use AIReady\WPPluginBoilerplate\Settings\Domain\Repository\SettingsRepositoryInterface;

/**
 * In-memory Fake Repository for unit testing application service.
 */
class InMemorySettingsRepository implements SettingsRepositoryInterface {
	private PluginSettings $settings;

	public function __construct() {
		$this->settings = PluginSettings::create_default();
	}

	public function get(): PluginSettings {
		return $this->settings;
	}

	public function save( PluginSettings $settings ): void {
		$this->settings = $settings;
	}
}

/**
 * Class SettingsApplicationServiceTest
 */
class SettingsApplicationServiceTest extends TestCase {

	/**
	 * Test retrieving settings DTO.
	 */
	public function test_get_settings(): void {
		$repo       = new InMemorySettingsRepository();
		$dispatcher = new EventDispatcher();
		$service    = new SettingsApplicationService( $repo, $dispatcher );

		$dto = $service->get_settings();

		$this->assertSame( 'Hello from AI-Ready WP Plugin Boilerplate!', $dto->general['greeting_message'] );
		$this->assertTrue( $dto->general['enable_feature'] );
		$this->assertSame( 3600, $dto->advanced['cache_ttl'] );
		$this->assertSame( 'preserve', $dto->data_retention['uninstall_action'] );
	}

	/**
	 * Test updating settings dispatches events and persists.
	 */
	public function test_update_settings_dispatches_event(): void {
		$repo       = new InMemorySettingsRepository();
		$dispatcher = new EventDispatcher();
		$dispatched = false;

		$dispatcher->subscribe(
			SettingsUpdatedEvent::class,
			static function () use ( &$dispatched ) {
				$dispatched = true;
			}
		);

		$service = new SettingsApplicationService( $repo, $dispatcher );

		$command = UpdateSettingsCommand::from_array(
			array(
				'general' => array(
					'greeting_message' => 'New Greetings!',
				),
				'advanced' => array(
					'cache_ttl' => 7200,
				),
			)
		);

		$updated = $service->update_settings( $command );

		$this->assertSame( 'New Greetings!', $updated->general['greeting_message'] );
		$this->assertSame( 7200, $updated->advanced['cache_ttl'] );
		$this->assertTrue( $dispatched );
	}

	/**
	 * Test invalid command parameters throw domain exception without saving.
	 */
	public function test_invalid_command_throws_exception(): void {
		$repo       = new InMemorySettingsRepository();
		$dispatcher = new EventDispatcher();
		$service    = new SettingsApplicationService( $repo, $dispatcher );

		$command = new UpdateSettingsCommand( greeting_message: '' );

		$this->expectException( InvalidGreetingMessageException::class );
		$service->update_settings( $command );
	}

	/**
	 * Test invalid TTL throws exception.
	 */
	public function test_invalid_ttl_throws_exception(): void {
		$repo       = new InMemorySettingsRepository();
		$dispatcher = new EventDispatcher();
		$service    = new SettingsApplicationService( $repo, $dispatcher );

		$command = new UpdateSettingsCommand( cache_ttl: 999999 );

		$this->expectException( InvalidCacheTtlException::class );
		$service->update_settings( $command );
	}
}
