<?php
defined('MOODLE_INTERNAL') || die;

require_once($CFG->libdir . '/externallib.php');

require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/course/externallib.php');

require_once($CFG->libdir . '/externallib.php');

class block_eventtrack_external extends external_api
{

    /**
     * Returns description of method parameters
     *
     * @return external_function_parameters
     * @since Moodle 3.6
     */
    public static function post_tracked_clicks_parameters()
    {
        return new external_function_parameters([
            'clickData' => new external_single_structure(
                array(
                    'timeStamp' => new external_value(PARAM_RAW, 'the time at which the event occured', VALUE_OPTIONAL),
                    'elementClasses' => new external_value(PARAM_RAW, 'the element that was clicked', VALUE_OPTIONAL),
                    'elementId' => new external_value(PARAM_RAW, 'the element that was the target of the click', VALUE_OPTIONAL),
                    'type' => new external_value(PARAM_RAW, 'the type of event that was raised', VALUE_OPTIONAL)
                )
            )
        ]);
    }

    /**
     * Post the tracked clicks
     *
     * @param int $limit Limit
     * @param int $offset Offset
     *
     * @return  array list of courses and warnings
     */
    public static function post_tracked_clicks($clickData)
    {
        global $USER, $PAGE, $DB;

        $insert = array(
            'eventname' => 'my/custom/event',
            'component' => 'eventtrack',
            'action' => 'clicked',
            'other' => json_encode($clickData),
            'target' => 'user',
            'userid' => $USER->id,
            'crud' => 'c',
            'timecreated' => $clickData["timeStamp"],
            'edulevel' => 0, // TODO: find out what this value needs to be
            'contextid' => 1, // TODO: find out what this value needs to be
            'contextlevel' => 10, // TODO: find out what this value needs to be
            'contextinstanceid' => 10, // TODO: find out what this value needs to be
        );
        $DB->set_debug(true);
        $transaction = $DB->start_delegated_transaction();
        $DB->insert_record('logstore_standard_log', $insert);
        $transaction->allow_commit();
        $params = self::validate_parameters(self::post_tracked_clicks_parameters(), [
            'clickData' => $clickData
        ]);

        return [];
    }

    /**
     * Returns description of method result value
     *
     * @return external_description
     * @since Moodle 3.6
     */
    public static function post_tracked_clicks_returns()
    {
        return new external_multiple_structure(
            new external_single_structure(
                array()
            )
        );
    }
}
