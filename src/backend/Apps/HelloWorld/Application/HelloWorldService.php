<?php
/**
 * Hello World Application Service.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld\Application
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld\Application;

use AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld\Application\DTO\HelloWorldDTO;
use AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld\Domain\HelloWorldGreeting;
use AIReady\WPPluginBoilerplate\Framework\Kernel\Plugin;

/**
 * Service producing Hello World responses.
 */
class HelloWorldService {

	/**
	 * Get Hello World DTO.
	 *
	 * @param HelloWorldGreeting|null $greeting Optional custom greeting.
	 * @return HelloWorldDTO
	 */
	public function get_hello_world( ?HelloWorldGreeting $greeting = null ): HelloWorldDTO {
		$greeting_vo = $greeting ?? HelloWorldGreeting::default();
		$version     = defined( 'AIRWP_VERSION' ) ? AIRWP_VERSION : Plugin::VERSION;

		return new HelloWorldDTO(
			$greeting_vo->value(),
			gmdate( 'c' ),
			$version,
			'ok'
		);
	}
}
