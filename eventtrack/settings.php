<?php
defined('MOODLE_INTERNAL') || die;

if ($ADMIN->fulltree) { // needs this condition or there is error on login page
    // $settings = new admin_settingpage('block_eventtrack', 'Event Track');
    
    $settings->add(new admin_setting_configtext('block_eventtrack_irs_url', 'IRS URL', 'URL des IRS', 'https://tracking.difa.stage.edutec.science/datums'));
    $settings->add(new admin_setting_configtext('block_eventtrack_irs_user', 'IRS User', 'User für die IRS Authentifizierung', 'user'));
    $settings->add(new admin_setting_configtext('block_eventtrack_irs_password', 'IRS Password', 'Passwort für die IRS Authentifizierung', 'user'));
    // $ADMIN->add('blocks', $settings);
}
