var compose = (function () {

var exports = {};

exports.show = function (tabname, focus_area) {
    if (reloading_app) {
        return;
    }
    $("#send-status").removeClass(status_classes).hide();
    $('#compose').css({visibility: "visible"});
    $('.message_comp').slideDown(100);
    $('#message-type-tabs a[href="#' + tabname + '-message"]').tab('show');
    focus_area.focus();
    focus_area.select();
};

exports.hide = function () {
    $('input, textarea, button').blur();
    $('.message_comp').slideUp(100,
                              function() { $('#compose').css({visibility: "hidden"});});
};

exports.clear = function () {
    $("#compose").find('input[type=text], textarea').val('');
};

exports.button_press = function (tabname) {
    exports.clear();
    $('#sidebar a[href="#home"]').tab('show');
    exports.show(tabname, $("#" + tabname));
    hotkeys.set_compose();
};

exports.toggle_mode = function () {
    if ($("#message-type-tabs li.active").find("a[href=#stream-message]").length !== 0) {
        // In stream tab, switch to personals.
        exports.show('personal', $("#huddle_recipient"));
    } else {
        exports.show('stream', $("#stream"));
    }
};

exports.composing = function () {
    if ($("#stream-message").is(":visible")) {
        return 'stream';
    }

    if ($("#personal-message").is(":visible")) {
        return 'huddle';
    }

    return false;
};

exports.stream_name = function (newval) {
    var oldval = $.trim($("#stream").val());
    if (newval !== undefined) {
        $("#stream").val(newval);
    }
    return oldval;
};

exports.subject = function (newval) {
    var oldval =  $.trim($("#subject").val());
    if (newval !== undefined) {
        $("#subject").val(newval);
    }
    return oldval;
};

exports.message = function (newval) {
    var oldval = $.trim($("#new_message_content").val());
    if (newval !== undefined) {
        $("#new_message_content").val(newval);
    }
    return oldval;
};

exports.recipient = function (newval) {
    var oldval = $.trim($("#huddle_recipient").val());
    if (newval !== undefined) {
        $("#huddle_recipient").val(newval);
    }
    return oldval;
};

function compose_error(error_text, bad_input) {
    $('#send-status').removeClass(status_classes)
               .addClass('alert-error')
               .text(error_text)
               .stop(true).fadeTo(0, 1);
    $('#compose').find('input[type="submit"]').removeAttr('disabled');
    bad_input.focus().select();
}

function submit_buttons() {
    return $('#compose').find('input[type="submit"]');
}

// *Synchronously* check if a stream exists.
// If not, displays an error and returns false.
function check_stream_for_send(stream_name) {
    var okay = true;
    $.ajax({
        type: "POST",
        url: "/json/subscriptions/exists",
        data: {'stream': stream_name},
        async: false,
        success: function (data) {
            if (!data.exists) {
                // The stream doesn't exist
                okay = false;
                $('#send-status').removeClass(status_classes).show();
                $('#stream-dne-name').text(stream_name);
                $('#stream-dne').show();
                submit_buttons().removeAttr('disabled');
                exports.hide();
                $('#create-it').focus();
            }
            $("#home-error").hide();
        },
        error: function (xhr) {
            okay = false;
            report_error("Error checking subscription", xhr, $("#home-error"));
            $("#stream").focus();
            submit_buttons().removeAttr('disabled');
        }
    });
    return okay;
}

function validate_stream_message() {
    var stream_name = exports.stream_name();
    if (stream_name === "") {
        compose_error("Please specify a stream", $("#stream"));
        return false;
    }

    if (exports.subject() === "") {
        compose_error("Please specify an subject", $("#subject"));
        return false;
    }

    if (exports.message() === "") {
        compose_error("You have nothing to send!", $("#new_message_content"));
        return false;
    }

    if (!subs.have(stream_name)) {
        if (!check_stream_for_send(stream_name)) {
            return false;
        }
        // You're not subbed to the stream
        $('#send-status').removeClass(status_classes).show();
        $('#stream-nosub-name').text(stream_name);
        $('#stream-nosub').show();
        submit_buttons().removeAttr('disabled');
        exports.hide();
        $('#sub-it').focus();
        return false;
    }

    return true;
}

function validate_huddle_message() {
    if (exports.recipient() === "") {
        compose_error("Please specify at least one recipient", $("#huddle_recipient"));
        return false;
    }

    if (exports.message() === "") {
        compose_error("You have nothing to send!", $("#new_message_content"));
        return false;
    }

    return true;
}

exports.validate = function () {
    submit_buttons().attr('disabled', 'disabled').blur();

    if (exports.composing() === 'huddle') {
        return validate_huddle_message();
    } else {
        return validate_stream_message();
    }
};

return exports;

}());
