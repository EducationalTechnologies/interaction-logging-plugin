<?php
/**
 * File description.
 *
 * @package   block_eventtrack
 * @copyright 2020 Daniel Biedermann
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

$functions = array(

    'block_eventtrack_log_clicks' => array(
        'classpath' => 'blocks/eventtrack/external/external.php',
        'classname'   => 'block_eventtrack_external',
        'methodname'  => 'post_tracked_clicks',
        'description' => 'Tracks user clicks on all moodle elements',
        'type'        => 'read',
        'ajax'        => true,
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),
);
