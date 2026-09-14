<?php
/**
 * Invalid Setting Base Domain Exception.
 *
 * @package WPAIBP\Backend\Apps\Settings\Domain\Exception
 */

namespace WPAIBP\Backend\Apps\Settings\Domain\Exception;

use DomainException;

/**
 * Base exception thrown when any settings invariant is violated.
 */
class InvalidSettingException extends DomainException {
}
