$('.trash-icon').on('click', function() {
    let memberId = $(this).attr('id');
    $('#f_member_id').val(memberId);
});


$(".group-msg").fadeTo(1500, 500).slideUp(500, function(){
    $(".group-msg").slideUp(500);
});