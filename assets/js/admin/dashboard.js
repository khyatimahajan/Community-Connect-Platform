$(document).ready(function () {
    var tagify = new Tagify(document.querySelector('input[name=members]'), {
        delimiters : null,
        templates : {
            tag : function(v, tagData){
                try{
                return `<tag title='${v}' contenteditable='false' spellcheck="false" class='tagify__tag ${tagData.class ? tagData.class : ""}' ${this.getAttributes(tagData)}>
                            <x title='remove tag' class='tagify__tag__removeBtn'></x>
                            <div>
                                <span class='tagify__tag-text'>${v}</span>
                            </div>
                        </tag>`
                }
                catch(err){}
            },
    
            dropdownItem : function(tagData){
                try{
                return `<div class='tagify__dropdown__item ${tagData.class ? tagData.class : ""}'>
                                <span>${tagData.value}</span>
                            </div>`
                }
                catch(err){}
            }
        },
        enforceWhitelist : true,
        whitelist : users,
        dropdown : {
            enabled: 1,
            classname : 'extra-properties'
        }
    })
    
    tagify.on('click', function(e){
        console.log(e.detail);
    });
    
    tagify.on('remove', function(e){
        console.log(e.detail);
    });
    
    tagify.on('add', function(e){
        console.log( "original Input:", tagify.DOM.originalInput);
        console.log( "original Input's value:", tagify.DOM.originalInput.value);
        console.log( "event detail:", e.detail);
    });
    

    $(".group-msg").fadeTo(1500, 500).slideUp(500, function(){
        $(".group-msg").slideUp(500);
    });
    

    $('.trash-icon').on('click', function(){
        let id = $(this).attr('id');
        $('#gruop_id').val(id);
    });

});
