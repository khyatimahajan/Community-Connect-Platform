$(document).ready(function () {
    //Connection array
    connections = connections.split("&#34;").join('"')
    connections = JSON.parse(connections);
    connections = connections.filter(conn => conn.username ? true : false);
    connections = connections.map(connection => {
        return connection.username;
    });

    $('.input-type-dec, .input-type-dec1').atwho({
        at: "@",
        data: connections
    })

    //Post image input change
    $('.image-upload').on('click', function () {
        $('#main-post-image').trigger('click');
    });

    $('#main-post-image').change(function (evt) {
        readURL(this, 'post');
    });

    $('.img-close').on('click', function () {
        $("#post-image").val(null);
        $('.image-previews').hide();
    });

    //Post comment image input change
    $('#comment-image').on('click', function () {
        $('#main-post-image').remove();
        $('#comment-post-image').trigger('click');
    });

    $('#comment-post-image').change(function (evt) {
        readURL(this, 'comment');
    });

    $('.comment-post-image-close-wrapper').on('click', function () {
        $("#comment-image").val(null);
        $('.comment-post-image-close-wrapper').hide();
    });

    function readURL(input, type) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                if (type == "post") {
                    $('.image-previews').show();
                    $('.image-pre').css('background-image', 'url(' + e.target.result + ')');
                } else {
                    $('.comment-post-image-close-wrapper').show();
                    $('#comment-image-preview').attr('src', e.target.result);
                }
            }
            reader.readAsDataURL(input.files[0]);
        }
    }
});