<?php
/******************************************************************************************
 * @name:       save-ready-avatar.php - part of WP plugin for creating vector avatars
 * @version:    1.5
 * @URL:        https://svgavatars.com
 * @copyright:  (c) 2014-2019 DeeThemes (https://codecanyon.net/user/DeeThemes)
 * @licenses:   https://codecanyon.net/licenses/regular
 *              https://codecanyon.net/licenses/extended
 *
 * Store avatars on a server in the 'ready-avatars' directory
*******************************************************************************************/
// require validation functions
require_once( 'validation.php' );

// getting and validating file name and image data from POST
// returned $file will be an array with name and type
$file = svgAvatars_validate_filename( $_POST['filename'] );
if ( $file['type'] !== 'invalid' ) {
    $data =  svgAvatars_validate_imagedata( $_POST['imgdata'], $file['type'] );
} else {
    die( 'error_file_type' );
}



// if filename is correct
if ( $file['name'] !== 'invalid' ) {
    if ( $file['type'] === 'png' ) {
        // cheking that validated image data is not empty
        if ( $data !== false ) {
            $data = base64_decode( $data );
            $dir = '../ready-avatars/';
            if ( is_dir( $dir ) && is_writable( $dir ) ) {
                file_put_contents( $dir . $file['name'] . '.png', $data );
                
                # You can place here an additional PHP code, for example,
                # to store links of saved avatars in your database.
                #
                # It is not recommended to store files themselves in your database,
                # but links to them only.

                die( 'saved' );
            } else {
                die( 'error_uploads_dir' );
            }
        } else {
            die( 'error_file_data' );
        }
    } elseif ( $file['type'] === 'svg' ) {
        $data = stripcslashes( $data );
        // cheking that valid code is SVG
        if ( strpos( $data, '<svg xmlns="https://www.w3.org/2000/svg" version="1.1"' ) !== false && strrpos($data, '</svg>', -6) !== false ) {
            $dir = '../ready-avatars/';
            if ( is_dir( $dir ) && is_writable( $dir ) ) {
                file_put_contents( $dir . $file['name'] . '.svg', $data );

                # You can place here an additional PHP code, for example,
                # to store links of saved avatars in your database.
                #
                # It is not recommended to store files themselves in your database,
                # but links to them only.

                die( 'saved' );
            } else {
                die( 'error_uploads_dir' );
            }
        } else {
            die( 'error_file_data' );
        }
    } else {
        die( 'error_file_type' );
    }
} else {
    die( 'error_file_type' );
}
