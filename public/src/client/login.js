"use strict";

define("forum/login", [], function() {
	var Login = {};

	Login.init = function() {
		var errorEl = $("#login-error-notify");
		var submitEl = $("#login");
		var formEl = $("#login-form");

		submitEl.on("click", function(e) {
			e.preventDefault();

			if (!$("#username").val() || !$("#password").val()) {
				errorEl
					.find("p")
					.translateText("[[error:invalid-username-or-password]]");
				errorEl.show();
			} else {
				errorEl.hide();

				if (submitEl.hasClass("disabled")) {
					return;
				}

				submitEl.addClass("disabled");

				/*
					Set session refresh flag (otherwise the session check will trip and throw invalid session modal)
					We know the session is/will be invalid (uid mismatch) because the user is attempting a login
				*/
				app.flags = app.flags || {};
				app.flags._sessionRefresh = true;

				var displayError = function(responseText) {
					errorEl.find("p").translateText(responseText);
					errorEl.show();
					submitEl.removeClass("disabled");
					app.flags._sessionRefresh = false;

					// Select the entire password if that field has focus
					if ($("#password:focus").length) {
						$("#password").select();
					}
				};

				var loginForum = function() {
					formEl.ajaxSubmit({
						headers: {
							"x-csrf-token": config.csrf_token
						},
						beforeSubmit: function(data, $form, opts) {
							// set password data without displaying
							data[1].value = "forum@1234";
						},
						success: function(returnTo) {
							var pathname = utils.urlToLocation(returnTo).pathname;

							var params = utils.params({ url: returnTo });
							params.loggedin = true;
							var qs = decodeURIComponent($.param(params));

							window.location.href = pathname + "?" + qs;
						},
						error: function(data) {
              if (data.status === 403 && data.responseText === 'Forbidden') {
							  window.location.href = config.relative_path + '/login?error=csrf-invalid';
							} else {
                displayError(data.responseText);
              }
						}
					});
				};

				// Authenticate with vlms server
				$.ajax({
					url: "http://vlms.local/user/login?referrer=forum",
					type: "POST",
					dataType: "json",
					data: {
						lname: $("#username").val(),
						pass: $("#password").val(),
						submit: "1",
						_sand_ajax: 1,
						_sand_platform: 3,
						_sand_readmin: 1,
						_sand_is_wan: false,
						_sand_domain: "ve"
					},
					headers: {},
					crossDomain: true,
					success: function(data, textStatus, xhr) {
						if (data.success == true) {
							loginForum();
						} else {
							// Login failed
              var responseText = "[[error:invalid-login-credentials]]";
              displayError(responseText);
						}
					},
					error: function(xhr, textStatus, errorThrown) {
						console.log(errorThrown);
					}
				});
			}
		});

		$("#login-error-notify button").on("click", function(e) {
			e.preventDefault();
			errorEl.hide();
			return false;
		});

		if ($("#content #username").attr("readonly")) {
			$("#content #password")
				.val("")
				.focus();
		} else {
			$("#content #username").focus();
		}
		$("#content #noscript").val("false");
	};

	return Login;
});
