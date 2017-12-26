var APP = (function() {

    var _init = function() {
        _bindEvents();
    };

    var _bindEvents = function() {
        $('#form_shorten').on('submit', function(e) {
            e.preventDefault();
            var url = $.trim($('.text-url').val());
            console.log(url);
            $.ajax({
                url: '/shorten',
                type: 'POST',
                data: {
                    url: url
                },
                success: function(data) {
                    console.log(data);
                    var _buildUrl = window.location.origin + '/' + data.hash;
                    $('.shortened-url').html('<a href="' + _buildUrl + '" target="_blank">' + _buildUrl + '</a>');
                    $('#shorten_area').removeClass('hide').show();
                }
            })
        });
    };

    return {
        init: _init
    };

})();

$(function() {
    APP.init();
});
