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

    //File input change
    $('#post-image').change(function (evt) {
        readURL(this);
    });

    $('.image-upload').on('click', function () {
        $('#post-image').trigger('click');
    });

    $('.img-close').on('click', function () {
        $("#post-image").val(null);
        $('.image-previews').hide();
    });

    function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $('.image-previews').show();
                $('.image-pre').css('background-image', 'url(' + e.target.result + ')');
                //$('img').attr('src', e.target.result);
            }
            reader.readAsDataURL(input.files[0]);
        }
    }
});