<?php

defined('MOODLE_INTERNAL') || die();

class block_eventtrack extends block_base
{
    public function init()
    {
        $this->title = get_string('pluginname', 'block_eventtrack');
    }

    function applicable_formats()
    {
        return array('all' => true);
    }

    public function has_config()
    {
        return true;
    }


    public function instance_allow_multiple()
    {
        return false;
    }

    public function get_content()
    {
        if ($this->content !== null) {
            return $this->content;
        }

        global $CFG, $USER;

        if ($USER) {
            if ($USER->id) {
                $this->content = new stdClass();
                $this->content->text = "<div data-userid='{$USER->id}' class='moodle-userid' style='display: none;'>.</div>";
            }
        }

        $config = get_config('block_eventtrack');

        $arguments = array(
            'userid' => $USER->id,
            'irsUrl' => $CFG->block_eventtrack_irs_url,
            'irsUser' => $CFG->block_eventtrack_irs_user,
            'irsPassword' => $CFG->block_eventtrack_irs_password,
        );
        
        $this->page->requires->js_call_amd('block_eventtrack/tracker', 'init', $arguments);

        return $this->content;
    }
}
