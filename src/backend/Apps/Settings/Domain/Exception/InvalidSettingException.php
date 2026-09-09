<?php
/**
 * Invalid Setting Base Domain Exception.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Exception
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Exception;

use DomainException;

/**
 * Base exception thrown when any settings invariant is violated.
 */
class InvalidSettingException extends DomainException {
}
