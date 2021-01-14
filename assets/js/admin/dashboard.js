$(document).ready(function () {
	var tagify = new Tagify(document.querySelector('input[name=members]'), {
		delimiters: null,
		templates: {
			tag: function (tagData) {
				try {
					return `<tag title='${
						tagData.value
					}' contenteditable='false' spellcheck="false" class='tagify__tag ${
						tagData.class ? tagData.class : ''
					}' ${this.getAttributes(tagData)}>
                        <x title='remove tag' class='tagify__tag__removeBtn'></x>
                        <div>
                            ${
                              tagData.code
                                ? `<img onerror="this.style.visibility = 'hidden'" src='https://lipis.github.io/flag-icon-css/flags/4x3/${tagData.code.toLowerCase()}.svg'>`
                                : ''
                            }
                            <span class='tagify__tag-text'>${
								tagData.value
							}</span>
                        </div>
                    </tag>`;
				} catch (err) {
					console.log(err);
				}
			},

			dropdownItem: function (tagData) {
				try {
					return `<div class='tagify__dropdown__item ${
						tagData.class ? tagData.class : ''
					}' tagifySuggestionIdx="${tagData.tagifySuggestionIdx}">
                     
                            <span>${tagData.value}</span>
                        </div>`;
				} catch (err) {
					console.log(err);
				}
			},
		},
		enforceWhitelist: true,
		whitelist: users,
		dropdown: {
			enabled: 1, // suggest tags after a single character input
			classname: 'extra-properties', // custom class for the suggestions dropdown
		}, // map tags' values to this property name, so this property will be the actual value and not the printed value on the screen
	});

	tagify.on('click', function (e) {
		/*console.log(e.detail);*/
	});

	tagify.on('remove', function (e) {
		/*console.log(e.detail);*/
	});

	tagify.on('add', function (e) {
		/*console.log('original Input:', tagify.DOM.originalInput);
		console.log("original Input's value:", tagify.DOM.originalInput.value);
		console.log('event detail:', e.detail);*/
	});

	$('.group-msg')
		.fadeTo(1500, 500)
		.slideUp(500, function () {
			$('.group-msg').slideUp(500);
		});

	$('.trash-icon').on('click', function () {
		let id = $(this).attr('id');
		$('#gruop_id').val(id);
	});
});
