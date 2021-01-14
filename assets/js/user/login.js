$(document).ready(function () {
	$('#timezone').val(Intl.DateTimeFormat().resolvedOptions().timeZone);
	$('.user_timezone').val(Intl.DateTimeFormat().resolvedOptions().timeZone);
});