<?php
/********************************************************************************************
 * @name:       download-temp-avatar.php - part of jQuery script for creating vector avatars
 * @version:    1.5
 * @URL:        https://svgavatars.com
 * @copyright:  (c) 2014-2019 DeeThemes (https://codecanyon.net/user/DeeThemes)
 * @licenses:   https://codecanyon.net/licenses/regular
 *              https://codecanyon.net/licenses/extended
 *
 * Force download of stored avatars from the 'temp-avatars' directory
*********************************************************************************************/
// require validation functions
require_once( 'validation.php' );

// getting file name and downloading name from GET
$dlname = svgAvatars_sanitize_downloading_name( $_GET['downloadingname'] );
$filename = svgAvatars_validate_filename( $_GET['filename'] );
$file = '../temp-avatars/' . $filename['name'] . '.' . $filename['type'];
$type = $filename['type'];

// detect special conditions devices
$iPod    = strpos( $_SERVER['HTTP_USER_AGENT'], 'iPod' );
$iPhone  = strpos( $_SERVER['HTTP_USER_AGENT'], 'iPhone' );
$iPad    = strpos( $_SERVER['HTTP_USER_AGENT'], 'iPad' );
$Android = stripos( $_SERVER['HTTP_USER_AGENT'], 'Android' );

// checking if file exist (means that it has been written earlier successfully by save-temp-avatar.php)
if ( file_exists( $file ) && $file !== '../temp-avatars/' ) {

    header( 'Content-Length: ' . filesize( $file ) );
    // for iOS device in Safari force download is not possible
    if( ! $iPad && ! $iPhone && ! $iPod ) {
        // Android "Internet" Browser makes two GET request for a file.
        // If we change file name to $dlname, this will not work,
        // so we need to leave a temporary file name for Android
        if ( $Android ) {
            if ( $type === 'png' ) {
                header( 'Content-Type: "image/png"' );
                header( 'Content-Disposition: attachment; filename="' . $filename['name'] . '.png"' );
            } elseif ( $type === 'svg' ) {
                header( 'Content-Type: "image/svg+xml"' );
                header( 'Content-Disposition: attachment; filename="' . $filename['name'] . '.svg"' );
            }
        } else {
            if ( $type === 'png' ) {
                header( 'Content-Type: "image/png"' );
                header( 'Content-Disposition: attachment; filename="' . $dlname . '.png"' );
            } elseif ( $type === 'svg' ) {
                header( 'Content-Type: "image/svg+xml"' );
                header( 'Content-Disposition: attachment; filename="' . $dlname . '.svg"' );
            }
        }
        if ( ob_get_length() > 0 ) {
            ob_clean();
        }
        flush();
        readfile( $file );
        exit;
    }
} else {
    die( 'File does not exist!' );
}
