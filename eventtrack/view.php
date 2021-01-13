<?php

require_once('../../config.php');
require_once('eventtrack_form.php');

global $DB;


// Check for all required variables.
$courseid = required_param('courseid', PARAM_INT);


if (!$course = $DB->get_record('course', array('id' => $courseid))) {
    print_error('invalidcourse', 'block_eventtrack', $courseid);
}

require_login($course);

$simplehtml = new eventtrack_form();

$simplehtml->display();

