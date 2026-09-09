<?php
/**
 * Domain Exception base class.
 *
 * @package AIReady\WPPluginBoilerplate\Settings\Domain\Exception
 */

namespace AIReady\WPPluginBoilerplate\Settings\Domain\Exception;

use DomainException;

/**
 * Base domain exception for all settings domain errors.
 */
class InvalidSettingException extends DomainException {}
