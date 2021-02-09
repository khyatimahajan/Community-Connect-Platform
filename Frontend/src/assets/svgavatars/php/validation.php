<?php
/******************************************************************************************
 * @name:       validation.php - part of WP plugin for creating vector avatars
 * @version:    1.5
 * @URL:        https://svgavatars.com
 * @copyright:  (c) 2014-2019 DeeThemes (https://codecanyon.net/user/DeeThemes)
 * @licenses:   https://codecanyon.net/licenses/regular
 *              https://codecanyon.net/licenses/extended
 *
 * Validate file name, type and PNG or SVG data. Sanitize downloadin file name.
*******************************************************************************************/
function svgAvatars_validate_filename( $name ) {
	$file = array(
		'name' => '',
		'type' => ''
	);
	// the file extentions must be exactly png or svg
	if ( ( $name && strrpos( $name, 'png', -3 ) !== false ) || ( $name && strrpos( $name, 'svg', -3 ) !== false ) ) {
		list( $file['name'], $file['type'] ) = explode( '.', $name );
		
		// file name must start with 'svgA' and following digits only
		if ( preg_match( '/^(svgA)[0-9]+$/', $file['name'] ) !== 1 ) {
			$file['name'] = 'invalid';
			$file['type'] = 'invalid';
		}
	} else {
		$file['name'] = 'invalid';
		$file['type'] = 'invalid';
	}
	return $file;
}

function svgAvatars_sanitize_downloading_name( $name ) {
	//Strip out any % encoded octets
	$sanitized = preg_replace( '|%[a-fA-F0-9][a-fA-F0-9]|', '', $name ); 
	//Limit to A-Z,a-z,0-9,_,-
	$sanitized = preg_replace( '/[^A-Za-z0-9_-]/', '', $sanitized );
	return $sanitized;
}

function svgAvatars_validate_imagedata( $data, $filetype ) {
	if ( $filetype === 'png' ) {
		if ( ( substr( $data, 0, 22 ) ) !== 'data:image/png;base64,' ) {
			// doesn't contain the expected first 22 characters
			return false;
		}
		$base64 = str_replace('data:image/png;base64,', '', $data);
		if ( ( base64_encode( base64_decode( $base64, true ) ) ) !== $base64) {
			// decoding and re-encoding the data fails
			return false;
		}
		// all is fine
		return $base64;
	} elseif ( $filetype === 'svg' ) {
		// sanitize SVG before saving on disk
		$svg = new svgAvatarsSvgCodeSanitizer();
		$svg->load_svg( $data );
		$svg->sanitize_svg();
		$sanitized_svg = $svg->save_svg();
		return $sanitized_svg;
	} else {
		return false;
	}
}

// whitelisting all the SVG code
class svgAvatarsSvgCodeSanitizer {

	private $document;
	private static $whitelist_elems = array();
	private static $whitelist_attrs = array();

	function __construct() {
		global $svgAvatars_svgcode_whitelist_elems;
		global $svgAvatars_svgcode_whitelist_attrs;
		
		$this->document = new DOMDocument();
		$this->document->preserveWhiteSpace = false;

		require_once 'svg-whitelist.php';
		self::$whitelist_elems = $svgAvatars_svgcode_whitelist_elems;
		self::$whitelist_attrs = $svgAvatars_svgcode_whitelist_attrs;
	}

	function load_svg( $data ) {
		$this->document->loadXML( stripcslashes( $data ) );
	}

	function sanitize_svg() {
		$elems = $this->document->getElementsByTagName( "*" );
		for( $i = 0; $i < $elems->length; $i++ ) {
			$node = $elems->item($i);
			$tag_name = $node->tagName;
			if( in_array( $tag_name, self::$whitelist_elems ) ) {
				for( $j = 0; $j < $node->attributes->length; $j++ ) {
					$attr_name = $node->attributes->item($j)->name;
					if( ! in_array( $attr_name, self::$whitelist_attrs ) ) {
						$node->removeAttribute( $attr_name );
					}
				}
			} else {
				$node->parentNode->removeChild( $node );
			}
		}
	}

	function save_svg() {
		$this->document->formatOutput = true;
		return $this->document->saveXML();
	}
}
