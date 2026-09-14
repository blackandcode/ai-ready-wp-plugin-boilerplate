<?php
/**
 * Hello World Application Service.
 *
 * @package WPAIBP\Backend\Apps\HelloWorld\Application
 */

namespace WPAIBP\Backend\Apps\HelloWorld\Application;

use WPAIBP\Backend\Apps\HelloWorld\Application\DTO\HelloWorldDTO;
use WPAIBP\Backend\Apps\HelloWorld\Domain\HelloWorldGreeting;
use WPAIBP\Framework\Kernel\Plugin;

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
		$version     = defined( 'WPAIBP_VERSION' ) ? WPAIBP_VERSION : Plugin::VERSION;

		return new HelloWorldDTO(
			$greeting_vo->value(),
			gmdate( 'c' ),
			$version,
			'ok'
		);
	}
}
