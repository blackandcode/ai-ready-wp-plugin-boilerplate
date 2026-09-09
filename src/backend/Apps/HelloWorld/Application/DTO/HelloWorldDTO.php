<?php
/**
 * Hello World DTO.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld\Application\DTO
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld\Application\DTO;

/**
 * Immutable DTO representing Hello World endpoint payload.
 */
readonly class HelloWorldDTO {

	/**
	 * Greeting message.
	 *
	 * @var string
	 */
	public string $message;

	/**
	 * ISO 8601 UTC timestamp.
	 *
	 * @var string
	 */
	public string $timestamp;

	/**
	 * Plugin version.
	 *
	 * @var string
	 */
	public string $version;

	/**
	 * Health check status.
	 *
	 * @var string
	 */
	public string $status;

	/**
	 * Constructor.
	 *
	 * @param string $message Greeting message.
	 * @param string $timestamp Timestamp.
	 * @param string $version Plugin version.
	 * @param string $status Health check status.
	 */
	public function __construct(
		string $message,
		string $timestamp,
		string $version,
		string $status = 'ok'
	) {
		$this->message   = $message;
		$this->timestamp = $timestamp;
		$this->version   = $version;
		$this->status    = $status;
	}

	/**
	 * Convert to array.
	 *
	 * @return array<string, string>
	 */
	public function to_array(): array {
		return array(
			'message'   => $this->message,
			'timestamp' => $this->timestamp,
			'version'   => $this->version,
			'status'    => $this->status,
		);
	}
}
