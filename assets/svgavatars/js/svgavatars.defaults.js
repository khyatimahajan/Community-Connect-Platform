/************************************************************************************************
 * @name:       svgavatars.defaults.js - default options for jQuery plugin for creating avatars
 * @version:    1.5
 * @URL:        https://svgavatars.com
 * @copyright:  (c) 2014-2019 DeeThemes (https://codecanyon.net/user/DeeThemes)
 * @licenses:   https://codecanyon.net/licenses/regular
				https://codecanyon.net/licenses/extended
*************************************************************************************************/
if (window.jQuery === undefined) {
  window.alert('SVG Avatars Script requires jQuery (https://jquery.com)!');
  throw new Error('SVG Avatars Script requires jQuery!');
}

function svgAvatarsOptions() {
  'use strict';

  var options = {
    // the path from root of your site to svgavatars folder. Also may be as URL, like 'https://yoursite.com/path/to/svgavatars/' or 'https://yoursite.com/path/to/svgavatars/'
    pathToFolder: 'assets/svgavatars/',

    // the default file name for downloaded avatars
    downloadingName: 'myAvatar',

    // show either 'both' genders or 'boysonly' or 'girlsonly'
    showGender: 'both',

    // the step of saturation color change in HSV (HSB) mode (10% by default)
    saturationDelta: 0.1,

    // the step of value (brightness) color change in HSV (HSB) mode (6% by default)
    brightnessDelta: 0.06,

    // must be exactly 'png' or 'svg' for storing file on your server
    saveFileFormat: 'png',

    // the dimentions for avatar stored on a server (pixels)
    savingSize: 400,

    // the conditional dimentions of SVG file when download by user (pixels)
    svgDownloadSize: 600,

    // the dimentions of first option PNG file when download by user (pixels)
    pngFirstDownloadSize: 200,

    // the dimentions of second option PNG file when download by user (pixels)
    pngSecondDownloadSize: 400,

    // the dimentions of PNG file when download by user on iOS devices (pixels)
    pngiOSDownloadSize: 500,

    // the dimentions of PNG file when download by user on Win8 phones and tablets (pixels)
    pngWin8TabletDownloadSize: 400,

    // the dimentions of PNG file for Gravatar service (pixels)
    gravatarSize: 200,

    // true will disable save on your server option
    hideSaveButton: false,

    // true will disable download SVG option on Android devices (not useful)
    hideSvgDownloadOnAndroid: true,

    // true will disable download SVG option
    hideSvgDownloadButton: true,

    // true will disable download PNG with first dimensions
    hidePngFirstDownloadButton: true,

    // true will disable download PNG with second dimensions
    hidePngSecondDownloadButton: true,

    // true will disable the possibility to install created avatar as gravatar
    hideGravatar: true,

    // must be exactly 'light' or 'dark'
    colorScheme: 'dark',

    // true will disable share option
    hideShareButton: true,

    // the dimentions of PNG file for share with Social networks (pixels)
    shareImageSize: 400,

    //false will disable Twitter share option
    twitter: true,

    //false will disable Pinterest share option
    pinterest: true,

    //will be an URL of a HTML page where the generator is placed
    shareLink: document.URL,

    //will be the title tag of a HTML page where the generator is placed
    shareTitle: document.title,

    //if you leave it blank, it might be taken from your meta description tag
    shareDescription: '',

    //replase YourSite.com with yours or leave it blank (do NOT delete variable itself!), if you don't want a watermark on avatar for social share
    shareCredit: 'Created on SocialMedia.com',
  };

  if (options.pathToFolder === '/EDIT_THIS_OPTION/') {
    window.alert(
      'SVG Avatars: Please edit "pathToFolder" option in the "svgavatars.defaults.js" file!'
    );
    throw new Error(
      'SVG Avatars: Please edit "pathToFolder" option in the "svgavatars.defaults.js" file!'
    );
  }

  return options;
}
